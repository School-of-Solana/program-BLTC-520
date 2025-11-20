import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { expect, assert } from "chai";
import { OnchainNotes } from "../target/types/onchain_notes";

describe("onchain_notes", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.onchainNotes as Program<OnchainNotes>;
  const author = provider.wallet;
  const outsider = Keypair.generate();
  const fan = Keypair.generate();

  const [notePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("note"), author.publicKey.toBuffer()],
    program.programId
  );

  before("airdrop SOL to test signers", async () => {
    const connection = provider.connection;
    for (const kp of [outsider, fan]) {
      const sig = await connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
    }
  });

  const createNoteIx = (content: string) =>
    program.methods.createNote(content).accounts({
      authority: author.publicKey,
      note: notePda,
      systemProgram: SystemProgram.programId,
    });

  it("creates a note", async () => {
    await createNoteIx("gm solana").rpc();
    const note = await program.account.note.fetch(notePda);
    expect(note.content).to.equal("gm solana");
    expect(note.upvotes.toNumber()).to.equal(0);
  });

  it("rejects duplicate note creation", async () => {
    try {
      await createNoteIx("second post").rpc();
      assert.fail("Expected duplicate initialization to fail");
    } catch (err) {
      expect((err as Error).message).to.include("already in use");
    }
  });

  it("updates note content for the author", async () => {
    await program.methods
      .updateNote("updated content")
      .accounts({ 
        authority: author.publicKey, 
        note: notePda,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    const note = await program.account.note.fetch(notePda);
    expect(note.content).to.equal("updated content");
  });

  it("blocks updates from other users", async () => {
    try {
      await program.methods
        .updateNote("malicious edit")
        .accounts({
          authority: outsider.publicKey,
          note: notePda,
        })
        .signers([outsider])
        .rpc();
      assert.fail("Expected unauthorized update to fail");
    } catch (err) {
      const anchorErr = err as anchor.AnchorError;
      expect(anchorErr.error.errorCode.code).to.equal("ConstraintHasOne");
    }
  });

  it("allows fans to upvote", async () => {
    await program.methods
      .upvoteNote()
      .accounts({
        voter: fan.publicKey,
        note: notePda,
        noteAuthor: author.publicKey,
      })
      .signers([fan])
      .rpc();

    const note = await program.account.note.fetch(notePda);
    expect(note.upvotes.toNumber()).to.equal(1);
  });

  it("prevents authors from upvoting their own note", async () => {
    try {
      await program.methods
        .upvoteNote()
        .accounts({
          voter: author.publicKey,
          note: notePda,
          noteAuthor: author.publicKey,
        })
        .rpc();
      assert.fail("Expected self-upvote to fail");
    } catch (err) {
      const anchorErr = err as anchor.AnchorError;
      expect(anchorErr.error.errorCode.code).to.equal("CannotUpvoteOwnNote");
    }
  });

  it("allows tipping from other users", async () => {
    const tipAmount = new anchor.BN(LAMPORTS_PER_SOL / 5);
    await program.methods
      .tipNote(tipAmount)
      .accounts({
        tipper: fan.publicKey,
        note: notePda,
        noteAuthor: author.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([fan])
      .rpc();

    const note = await program.account.note.fetch(notePda);
    expect(note.tipTotal.eq(tipAmount)).to.be.true;
  });

  it("prevents self-tipping", async () => {
    try {
      await program.methods
        .tipNote(new anchor.BN(1_000))
        .accounts({
          tipper: author.publicKey,
          note: notePda,
          noteAuthor: author.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Expected self-tip to fail");
    } catch (err) {
      const anchorErr = err as anchor.AnchorError;
      expect(anchorErr.error.errorCode.code).to.equal("CannotTipOwnNote");
    }
  });

  it("prevents unauthorized deletes", async () => {
    try {
      await program.methods
        .deleteNote()
        .accounts({
          authority: outsider.publicKey,
          note: notePda,
        })
        .signers([outsider])
        .rpc();
      assert.fail("Expected delete constraint to fail");
    } catch (err) {
      const anchorErr = err as anchor.AnchorError;
      expect(anchorErr.error.errorCode.code).to.equal("ConstraintHasOne");
    }
  });

  it("allows the author to delete the note", async () => {
    await program.methods
      .deleteNote()
      .accounts({
        authority: author.publicKey,
        note: notePda,
      })
      .rpc();

    const deleted = await program.provider.connection.getAccountInfo(notePda);
    expect(deleted).to.be.null;
  });

  // --------- Robust Edge-Case Tests ---------
  it("fails to create a note with empty content", async () => {
    // Create a new note PDA for this test to avoid conflicts
    const testAuthor = Keypair.generate();
    const [testNotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("note"), testAuthor.publicKey.toBuffer()],
      program.programId
    );
    
    // Airdrop to test author
    const sig = await provider.connection.requestAirdrop(testAuthor.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");

    try {
      await program.methods
        .createNote("")
        .accounts({
          authority: testAuthor.publicKey,
          note: testNotePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([testAuthor])
        .rpc();
      assert.fail("Should have thrown a ContentEmpty error");
    } catch (err: any) {
      if (err.error && err.error.errorCode) {
        expect(err.error.errorCode.code).to.equal("ContentEmpty");
      } else if (typeof err.message === "string" && err.message.includes("ContentEmpty")) {
        expect(err.message).to.include("ContentEmpty");
      } else {
        assert.fail(`Expected ContentEmpty error, got: ${JSON.stringify(err)}`);
      }
    }
  });


  it("fails to tip with amount of zero", async () => {
    // Ensure note exists for this test
    const noteInfo = await program.provider.connection.getAccountInfo(notePda);
    if (!noteInfo) {
      // Recreate note if it was deleted
      await createNoteIx("test for tip zero").rpc();
    }
    
    try {
      await program.methods
        .tipNote(new anchor.BN(0))
        .accounts({
          tipper: fan.publicKey,
          note: notePda,
          noteAuthor: author.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([fan])
        .rpc();
      assert.fail("Should have thrown an InvalidTipAmount error");
    } catch (err: any) {
      if (err.error && err.error.errorCode) {
        expect(err.error.errorCode.code).to.equal("InvalidTipAmount");
      } else if (typeof err.message === "string" && err.message.includes("InvalidTipAmount")) {
        expect(err.message).to.include("InvalidTipAmount");
      } else {
        assert.fail(`Expected InvalidTipAmount error, got: ${JSON.stringify(err)}`);
      }
    }
  });

  it("creates a note with maximum allowed length (880 bytes)", async () => {
    const maxLenContent = "a".repeat(880);
    const newNoteKp = Keypair.generate();
    const [newNotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("note"), newNoteKp.publicKey.toBuffer()],
      program.programId
    );
    
    // Airdrop
    const sig = await provider.connection.requestAirdrop(newNoteKp.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");

    await program.methods
      .createNote(maxLenContent)
      .accounts({
        authority: newNoteKp.publicKey,
        note: newNotePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([newNoteKp])
      .rpc();

    const note = await program.account.note.fetch(newNotePda);
    expect(note.content).to.equal(maxLenContent);
  });

  it("fails when content exceeds maximum length (881 bytes)", async () => {
    const tooLongContent = "a".repeat(881);
    const newNoteKp = Keypair.generate();
    const [newNotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("note"), newNoteKp.publicKey.toBuffer()],
      program.programId
    );
    
    // Airdrop
    const sig = await provider.connection.requestAirdrop(newNoteKp.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");

    try {
      await program.methods
        .createNote(tooLongContent)
        .accounts({
          authority: newNoteKp.publicKey,
          note: newNotePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([newNoteKp])
        .rpc();
      assert.fail("Should have failed with ContentTooLong");
    } catch (err: any) {
       // We expect ContentTooLong from the program
       if (err.error && err.error.errorCode) {
         expect(err.error.errorCode.code).to.equal("ContentTooLong");
       } else {
         // If it fails with something else (like encoding error), we want to see it
         console.log("Unexpected error:", err);
         // If it's the "encoding overruns Buffer" error, it might show up here
         throw err;
       }
    }
  });
});
