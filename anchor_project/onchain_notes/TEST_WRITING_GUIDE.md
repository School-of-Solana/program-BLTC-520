# How to Write Anchor Tests

## Test Structure Overview

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { expect, assert } from "chai";
import { OnchainNotes } from "../target/types/onchain_notes";

describe("onchain_notes", () => {
  // 1. SETUP - Get provider, program, create keypairs
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.onchainNotes as Program<OnchainNotes>;
  
  // 2. CREATE TEST ACCOUNTS
  const author = provider.wallet;  // Uses your wallet from Anchor.toml
  const outsider = Keypair.generate();  // New keypair for testing
  
  // 3. DERIVE PDAs (if needed)
  const [notePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("note"), author.publicKey.toBuffer()],
    program.programId
  );
  
  // 4. SETUP HOOKS (before/after)
  before("airdrop SOL", async () => {
    // Give test accounts SOL for transactions
  });
  
  // 5. WRITE TESTS
  it("does something", async () => {
    // Your test code here
  });
});
```

## Key Concepts

### 1. **Setup Phase**
- `provider`: Connection to Solana (localnet/devnet/mainnet)
- `program`: Your compiled Anchor program
- `Keypair.generate()`: Creates new test accounts
- `PublicKey.findProgramAddressSync()`: Derives PDAs

### 2. **Calling Instructions**
```typescript
// Basic pattern:
await program.methods
  .instructionName(arg1, arg2)  // Method name matches Rust function
  .accounts({                    // Accounts struct
    account1: publicKey1,
    account2: publicKey2,
  })
  .signers([keypair])           // If you need additional signers
  .rpc();                        // Execute the transaction
```

### 3. **Fetching Account Data**
```typescript
const note = await program.account.note.fetch(notePda);
expect(note.content).to.equal("expected value");
expect(note.upvotes.toNumber()).to.equal(5);
```

### 4. **Testing Success Cases**
```typescript
it("allows valid operation", async () => {
  // Call instruction
  await program.methods.someInstruction().accounts({...}).rpc();
  
  // Verify state changed correctly
  const account = await program.account.someAccount.fetch(address);
  expect(account.field).to.equal(expectedValue);
});
```

### 5. **Testing Failure Cases**
```typescript
it("rejects invalid operation", async () => {
  try {
    await program.methods.someInstruction().accounts({...}).rpc();
    assert.fail("Should have thrown an error");
  } catch (err) {
    // Check the specific error
    const anchorErr = err as anchor.AnchorError;
    expect(anchorErr.error.errorCode.code).to.equal("ErrorCodeName");
  }
});
```

### 6. **Common Patterns**

#### Pattern A: Testing Constraints
```typescript
// Test that a constraint fails correctly
try {
  await program.methods.updateNote("content")
    .accounts({
      authority: wrongPerson.publicKey,  // Wrong person!
      note: notePda,
    })
    .signers([wrongPerson])
    .rpc();
  assert.fail("Should have failed");
} catch (err) {
  const anchorErr = err as anchor.AnchorError;
  expect(anchorErr.error.errorCode.code).to.equal("ConstraintHasOne");
}
```

#### Pattern B: Testing Custom Errors
```typescript
// Test your custom error codes
try {
  await program.methods.tipNote(new anchor.BN(0))  // Invalid amount
    .accounts({...})
    .rpc();
  assert.fail("Should have failed");
} catch (err) {
  const anchorErr = err as anchor.AnchorError;
  expect(anchorErr.error.errorCode.code).to.equal("InvalidTipAmount");
}
```

#### Pattern C: Testing State Accumulation
```typescript
// Test that values accumulate correctly
await program.methods.upvoteNote()
  .accounts({...})
  .rpc();
  
const note1 = await program.account.note.fetch(notePda);
expect(note1.upvotes.toNumber()).to.equal(1);

await program.methods.upvoteNote()
  .accounts({...})
  .rpc();
  
const note2 = await program.account.note.fetch(notePda);
expect(note2.upvotes.toNumber()).to.equal(2);
```

## Step-by-Step: Writing Your First Test

### Example: Test Content Length Validation

**Goal**: Test that notes with content > 1024 characters are rejected

**Steps**:
1. Create a string longer than MAX_CONTENT_LENGTH (1024)
2. Try to create a note with that content
3. Expect it to fail with `ContentTooLong` error

**Code**:
```typescript
it("rejects content that is too long", async () => {
  const longContent = "a".repeat(1025);  // 1025 characters (over limit)
  
  try {
    await program.methods
      .createNote(longContent)
      .accounts({
        authority: author.publicKey,
        note: notePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    assert.fail("Should have rejected content that is too long");
  } catch (err) {
    const anchorErr = err as anchor.AnchorError;
    expect(anchorErr.error.errorCode.code).to.equal("ContentTooLong");
  }
});
```

## Common Gotchas

1. **PDA Derivation**: Make sure seeds match exactly between Rust and TypeScript
2. **Signers**: If using a different signer, add `.signers([keypair])`
3. **Airdrops**: Test accounts need SOL - use `before()` hook to airdrop
4. **Account State**: After deleting, check with `getAccountInfo()` returns `null`
5. **BN (BigNumber)**: Use `new anchor.BN(value)` for u64 amounts
6. **Error Checking**: Use `anchor.AnchorError` type and check `error.errorCode.code`

## Practice Exercise

Try writing a test for: **"allows multiple upvotes from different users"**

Hint: You'll need:
- Multiple fan keypairs
- Call upvoteNote multiple times with different voters
- Verify the upvote count increases each time



