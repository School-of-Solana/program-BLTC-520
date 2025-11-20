import "./App.css";
import * as anchor from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import { ONCHAIN_NOTES_IDL } from "./idl/onchain_notes";
import { Buffer } from "buffer";

type NoteAccount = {
  publicKey: PublicKey;
  authority: PublicKey;
  content: string;
  upvotes: number;
  tipTotalLamports: number;
  createdAt: number;
  updatedAt: number;
};

const MAX_CONTENT_LENGTH = 880;
const NOTE_SEED = "note";
const PROGRAM_ADDRESS =
  (import.meta.env.VITE_PROGRAM_ID as string) ?? ONCHAIN_NOTES_IDL.address;
const PROGRAM_ID = new PublicKey(PROGRAM_ADDRESS);
const idlWithAddress = { ...ONCHAIN_NOTES_IDL, address: PROGRAM_ADDRESS } as const;
const typedIdl = idlWithAddress as unknown as anchor.Idl;
const coder = new anchor.BorshAccountsCoder(typedIdl);
const noteDiscriminator = coder.accountDiscriminator("Note");

const shorten = (value: PublicKey | string, chars = 4) => {
  const str = typeof value === "string" ? value : value.toBase58();
  return `${str.slice(0, chars + 2)}…${str.slice(-chars)}`;
};

const formatRelativeTime = (unixSeconds: number) => {
  const diffMs = Date.now() - unixSeconds * 1000;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const lamportsToSol = (lamports: number) =>
  (lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTipNote, setSelectedTipNote] = useState<NoteAccount | null>(null);
  const [tipAmount, setTipAmount] = useState("0.1");
  const [isTipping, setIsTipping] = useState(false);

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    return new anchor.AnchorProvider(
      connection,
      wallet as unknown as anchor.Wallet,
      anchor.AnchorProvider.defaultOptions(),
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new anchor.Program(typedIdl, provider);
  }, [provider]);

  const fetchNotes = useCallback(async (): Promise<NoteAccount[]> => {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: anchor.utils.bytes.bs58.encode(noteDiscriminator),
          },
        },
      ],
    });
    return accounts
      .map(({ account, pubkey }) => {
        try {
          const decoded = coder.decode("Note", account.data) as any;
          return {
            publicKey: pubkey,
            authority: new PublicKey(decoded.authority),
            content: decoded.content as string,
            upvotes: Number(decoded.upvotes),
            tipTotalLamports: Number(decoded.tip_total),
            createdAt: Number(decoded.created_at),
            updatedAt: Number(decoded.updated_at),
          } satisfies NoteAccount;
        } catch (error) {
          console.error("Failed to decode note", error);
          return null;
        }
      })
      .filter((note): note is NoteAccount => Boolean(note))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [connection]);

  const {
    data: notes = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["notes", connection.rpcEndpoint],
    queryFn: fetchNotes,
    refetchInterval: 15000,
  });

  const myNote = useMemo(() => {
    if (!wallet.publicKey) return null;
    return notes.find((note) => note.authority.equals(wallet.publicKey!)) ?? null;
  }, [notes, wallet.publicKey]);

  useEffect(() => {
    setContent(myNote?.content ?? "");
  }, [myNote?.content]);

  const ensureWallet = () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Connect your wallet to continue");
      return false;
    }
    if (!program) {
      toast.error("Program is not ready yet");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!ensureWallet() || !wallet.publicKey || !program) return;
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      const [notePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(NOTE_SEED), wallet.publicKey.toBuffer()],
        PROGRAM_ID,
      );
      let signature: string;
      if (myNote) {
        signature = await program.methods
          .updateNote(content.trim())
          .accounts({ 
            authority: wallet.publicKey, 
            note: notePda,
            systemProgram: SystemProgram.programId
          })
          .rpc();
      } else {
        signature = await program.methods
          .createNote(content.trim())
          .accounts({
            authority: wallet.publicKey,
            note: notePda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }
      const explorerUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
      toast.success(
        <div>
          {myNote ? "Note updated" : "Note published"}
          <br />
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            View transaction
          </a>
        </div>
      );
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save note. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!myNote) return;
    if (!ensureWallet() || !wallet.publicKey || !program) return;
    setIsDeleting(true);
    try {
      const [notePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(NOTE_SEED), wallet.publicKey.toBuffer()],
        PROGRAM_ID,
      );
      const signature = await program.methods
        .deleteNote()
        .accounts({ authority: wallet.publicKey, note: notePda })
        .rpc();
      const explorerUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
      toast.success(
        <div>
          Note deleted
          <br />
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            View transaction
          </a>
        </div>
      );
      setContent("");
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpvote = async (note: NoteAccount) => {
    if (!ensureWallet() || !wallet.publicKey || !program) return;
    if (note.authority.equals(wallet.publicKey)) {
      toast("You cannot upvote your own note", { icon: "⚠️" });
      return;
    }
    try {
      const signature = await program.methods
        .upvoteNote()
        .accounts({
          voter: wallet.publicKey,
          noteAuthor: note.authority,
          note: note.publicKey,
        })
        .rpc();
      const explorerUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
      toast.success(
        <div>
          Upvoted!
          <br />
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            View transaction
          </a>
        </div>
      );
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to upvote");
    }
  };

  const handleTip = async () => {
    if (!selectedTipNote) return;
    if (!ensureWallet() || !wallet.publicKey || !program) return;
    const lamports = Math.round(parseFloat(tipAmount || "0") * LAMPORTS_PER_SOL);
    if (!Number.isFinite(lamports) || lamports <= 0) {
      toast.error("Enter a valid tip amount");
      return;
    }
    if (selectedTipNote.authority.equals(wallet.publicKey)) {
      toast("You cannot tip yourself", { icon: "⚠️" });
      return;
    }
    setIsTipping(true);
    try {
      const signature = await program.methods
        .tipNote(new anchor.BN(lamports))
        .accounts({
          tipper: wallet.publicKey,
          noteAuthor: selectedTipNote.authority,
          note: selectedTipNote.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      const explorerUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
      toast.success(
        <div>
          Tip sent ✨
          <br />
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            View transaction
          </a>
        </div>
      );
      setSelectedTipNote(null);
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to tip");
    } finally {
      setIsTipping(false);
    }
  };

  const remainingChars = MAX_CONTENT_LENGTH - content.length;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">On-chain Notes / Blog</p>
          <h1>
            Write boldly.
            <span className="highlight"> Celebrate authors. </span>
            Keep everything on Solana.
          </h1>
          <p className="subtitle">
            Publish a single long-form note tied to your wallet, update it anytime, delete it when
            you are done, and let others upvote or tip when your words resonate.
          </p>
        </div>
        <WalletMultiButton className="wallet-button" />
      </header>

      <main className="grid">
        <section className="composer-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Your blog post</p>
              <h2>{myNote ? "Edit your living note" : "Publish your first note"}</h2>
            </div>
            <span className="status-pill">
              {wallet.publicKey ? shorten(wallet.publicKey) : "Wallet not connected"}
            </span>
          </div>
          <textarea
            className="note-input"
            placeholder="Share your latest idea, announcement, or long-form brain dump..."
            value={content}
            maxLength={MAX_CONTENT_LENGTH}
            onChange={(event) => setContent(event.target.value)}
            disabled={!wallet.connected}
          />
          <div className="composer-footer">
            <span className={clsx("char-counter", { danger: remainingChars < 0 })}>
              {remainingChars} characters remaining
            </span>
            <div className="button-row">
              <button
                className="primary-btn"
                onClick={handleSave}
                disabled={!wallet.connected || isSaving || remainingChars < 0}
              >
                {isSaving ? "Saving…" : myNote ? "Update note" : "Publish note"}
              </button>
              {myNote && (
                <button
                  className="ghost-btn"
                  onClick={handleDelete}
                  disabled={isDeleting || !wallet.connected}
                >
                  {isDeleting ? "Deleting…" : "Delete note"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="feed-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Community feed</p>
              <h2>Notes on the chain</h2>
            </div>
            <button className="ghost-btn" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes on-chain yet.</p>
              <p>Be the first to publish, or ask friends to share their wallet address.</p>
            </div>
          ) : (
            <div className="notes-stack">
              {notes.map((note) => {
                const isMine = wallet.publicKey?.equals(note.authority) ?? false;
                return (
                  <article key={note.publicKey.toBase58()} className="note-card">
                    <div className="note-meta">
                      <div>
                        <p className="author">{shorten(note.authority)}</p>
                        <p className="timestamp">{formatRelativeTime(note.updatedAt)}</p>
                      </div>
                      {isMine && <span className="tag">Yours</span>}
                    </div>
                    <p className="note-content">{note.content}</p>
                    <div className="note-stats">
                      <div>
                        <span className="stat-value">{note.upvotes}</span>
                        <span className="stat-label">upvotes</span>
                      </div>
                      <div>
                        <span className="stat-value">{lamportsToSol(note.tipTotalLamports)} SOL</span>
                        <span className="stat-label">tipped</span>
                      </div>
                    </div>
                    <div className="note-actions">
                      <button
                        className="primary-btn subtle"
                        disabled={
                          !wallet.connected ||
                          isMine ||
                          !program ||
                          (wallet.publicKey?.equals(note.authority) ?? false)
                        }
                        onClick={() => handleUpvote(note)}
                      >
                        Appreciate
                      </button>
                      <button
                        className="ghost-btn"
                        disabled={!wallet.connected || isMine}
                        onClick={() => setSelectedTipNote(note)}
                      >
                        Tip author
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <section className="info-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Technical Details</p>
            <h2>Why 880 characters?</h2>
          </div>
        </div>
        <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
          Solana transactions have a maximum size of <strong>1,232 bytes</strong>. Here's how that space is allocated:
        </p>
        <div className="buffer-visualization">
          <div className="buffer-bar">
            <div className="buffer-segment signatures" style={{ width: "5.2%" }}>
              <div className="buffer-tooltip">
                <span className="buffer-label">Signatures</span>
                <span className="buffer-value">64 bytes</span>
              </div>
            </div>
            <div className="buffer-segment instruction" style={{ width: "0.65%" }}>
              <div className="buffer-tooltip">
                <span className="buffer-label">Discriminator</span>
                <span className="buffer-value">8 bytes</span>
              </div>
            </div>
            <div className="buffer-segment string-prefix" style={{ width: "0.32%" }}>
              <div className="buffer-tooltip">
                <span className="buffer-label">String Length</span>
                <span className="buffer-value">4 bytes</span>
              </div>
            </div>
            <div className="buffer-segment content" style={{ width: "71.4%" }}>
              <div className="buffer-tooltip">
                <span className="buffer-label">Your Content</span>
                <span className="buffer-value">880 bytes</span>
              </div>
            </div>
            <div className="buffer-segment overhead" style={{ width: "22.4%" }}>
              <div className="buffer-tooltip">
                <span className="buffer-label">Other Overhead</span>
                <span className="buffer-value">276 bytes</span>
              </div>
            </div>
          </div>
          <div className="buffer-legend">
            <div className="legend-item">
              <div className="legend-color signatures"></div>
              <span>Transaction signatures & metadata</span>
            </div>
            <div className="legend-item">
              <div className="legend-color instruction"></div>
              <span>Instruction discriminator</span>
            </div>
            <div className="legend-item">
              <div className="legend-color string-prefix"></div>
              <span>String length prefix (Borsh encoding)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color content"></div>
              <span>Your actual note content</span>
            </div>
            <div className="legend-item">
              <div className="legend-color overhead"></div>
              <span>Accounts, recent blockhash, etc.</span>
            </div>
          </div>
        </div>
        <div className="info-callout">
          <strong>💡 Fun fact:</strong> 880 bytes = approximately 145 words, or 2-3 paragraphs of text. 
          Perfect for sharing ideas without writing a novel!
        </div>
      </section>

      {selectedTipNote && (
        <div className="tip-overlay">
          <div className="tip-panel">
            <button className="close" onClick={() => setSelectedTipNote(null)}>
              ×
            </button>
            <p className="eyebrow">Send appreciation</p>
            <h3>Tip {shorten(selectedTipNote.authority)}</h3>
            <label className="input-label">
              Amount (SOL)
              <input
                type="number"
                min="0"
                step="0.01"
                value={tipAmount}
                onChange={(event) => setTipAmount(event.target.value)}
              />
            </label>
            <div className="button-row">
              <button className="primary-btn" onClick={handleTip} disabled={isTipping}>
                {isTipping ? "Sending…" : "Send tip"}
              </button>
              <button className="ghost-btn" onClick={() => setSelectedTipNote(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
