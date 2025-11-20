# Project Description

**Deployed Frontend URL:** https://solanaonlineblog.vercel.app/

**Solana Program ID:** `6CBafYtMRgRdk72FDmcLhHng7zCGfiAGi6bwnvifrsaH`

## Project Overview

### Description

**Onchain Notes** is a decentralized notes application built on Solana that allows users to create, update, and manage notes on-chain. The application provides a simple social media-like experience where users can create notes, receive upvotes from other users, and receive tips. Each user can have one note account, identified by their wallet address, making it a unique, personal on-chain note-taking experience.

The dApp demonstrates core Solana concepts including Program Derived Addresses (PDAs), account management, cross-program invocations, and proper access control. All notes are stored permanently on the Solana blockchain, ensuring immutability and decentralization.

### Key Features

- **Create Notes**: Users can create a single note with up to 1024 characters of content
- **Update Notes**: Note authors can update their note content at any time
- **Upvote System**: Other users can upvote notes they like (authors cannot upvote their own notes)
- **Tipping Mechanism**: Users can tip note authors with SOL directly through the program
- **Delete Notes**: Note authors can delete their notes, reclaiming rent
- **Access Control**: Robust security ensures only authorized users can modify or delete notes

## Prerequisites

Before setting up this project, ensure you have the following installed:

### Required Software

1. **Rust** (latest stable version)
   - Install from [rustup.rs](https://rustup.rs/)
   - Verify: `rustc --version`

2. **Solana CLI** (v1.18.0 or later)
   - Install: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
   - Verify: `solana --version`
   - Configure for devnet: `solana config set --url devnet`

3. **Anchor Framework** (v0.32.1 or later)
   - Install: `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`
   - Install Anchor version: `avm install latest && avm use latest`
   - Verify: `anchor --version`

4. **Node.js** (v18 or later) and Package Manager
   - Install Node.js from [nodejs.org](https://nodejs.org/)
   - Use npm (comes with Node.js) or yarn
   - Verify: `node --version` and `npm --version`

5. **Solana Wallet**
   - Create a wallet: `solana-keygen new`
   - Fund it with devnet SOL: `solana airdrop 2`
   - Verify: `solana address` and `solana balance`

### Additional Tools (Optional but Recommended)

- **Git** - for version control
- **VS Code** - recommended editor with Rust and Solana extensions
- **Phantom Wallet** or **Solflare** - browser wallet for frontend interaction

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd program-BLTC-520
```

### 2. Anchor Program Setup

Navigate to the Anchor project directory:

```bash
cd anchor_project/onchain_notes
```

Install dependencies:

```bash
yarn install
# or
npm install
```

Build the program:

```bash
anchor build
```

This will:
- Compile the Rust program
- Generate the IDL (Interface Definition Language)
- Generate TypeScript types

### 3. Configure Anchor

Update `Anchor.toml` with your wallet path:

```toml
[provider]
wallet = "~/.config/solana/id.json"  # Update this path if needed
```

Verify your Solana configuration:

```bash
solana config get
```

### 4. Deploy to Devnet

First, ensure you have devnet SOL:

```bash
solana airdrop 2 --url devnet
```

Deploy the program:

```bash
anchor deploy
```

This will deploy the program and output the program ID (should match the one in the code).

### 5. Run Tests

Run the test suite:

```bash
anchor test
```

Or with a specific test file:

```bash
yarn test
# or
npm test
```

### 6. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../../frontend
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Create a `.env` file (if not exists):

```env
VITE_SOLANA_NETWORK=devnet
VITE_PROGRAM_ID=6CBafYtMRgRdk72FDmcLhHng7zCGfiAGi6bwnvifrsaH
```

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in the terminal).

### 7. Build Frontend for Production

Build the frontend:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist/` directory, ready for deployment to Vercel, Netlify, or any static hosting service.

## How to Use the dApp

### For End Users

1. **Connect Wallet**
   - Open the frontend application
   - Click "Connect Wallet" button
   - Select your wallet (Phantom, Solflare, etc.)
   - Approve the connection

2. **Create Your Note**
   - If you don't have a note yet, you'll see a "Create Note" option
   - Enter your note content (up to 1024 characters)
   - Click "Create Note" and approve the transaction
   - Your note will be created and stored on-chain

3. **Update Your Note**
   - If you already have a note, you can edit it
   - Modify the content and click "Update Note"
   - Approve the transaction to update it on-chain

4. **View Other Notes**
   - Browse notes created by other users
   - See upvote counts and tip totals for each note

5. **Interact with Notes**
   - **Upvote**: Click the upvote button on any note (except your own)
   - **Tip**: Enter a tip amount and click "Tip Note" to send SOL to the note author
   - You cannot upvote or tip your own note

6. **Delete Your Note**
   - If you want to remove your note, click "Delete Note"
   - Approve the transaction to delete it and reclaim rent

### For Developers

Interact with the program using Anchor's program interface:

```typescript
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Create a note
await program.methods
  .createNote("My first on-chain note!")
  .accounts({
    authority: wallet.publicKey,
    note: notePda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Update a note
await program.methods
  .updateNote("Updated content")
  .accounts({
    authority: wallet.publicKey,
    note: notePda,
  })
  .rpc();

// Upvote a note
await program.methods
  .upvoteNote()
  .accounts({
    voter: voterWallet.publicKey,
    note: notePda,
    noteAuthor: noteAuthor.publicKey,
  })
  .rpc();

// Tip a note
await program.methods
  .tipNote(new anchor.BN(LAMPORTS_PER_SOL / 10)) // 0.1 SOL
  .accounts({
    tipper: tipperWallet.publicKey,
    note: notePda,
    noteAuthor: noteAuthor.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Delete a note
await program.methods
  .deleteNote()
  .accounts({
    authority: wallet.publicKey,
    note: notePda,
  })
  .rpc();
```

## Program Architecture

### PDA Usage

The program uses a single PDA (Program Derived Address) to create unique note accounts for each user. The PDA is derived using:

- **Seed**: `"note"` (the constant `NOTE_SEED`)
- **Authority Pubkey**: The public key of the note's author

This ensures that each user can only have one note, and the note account address is deterministically derived from the user's wallet address.

**PDA Derivation:**
```rust
seeds = [NOTE_SEED, authority.key().as_ref()]
bump = [computed bump]
```

**PDAs Used:**
- **Note PDA**: One per user, derived from the "note" seed and user's public key. Stores the note's content, metadata, upvotes, and tip total.

### Program Instructions

**Instructions Implemented:**

1. **`create_note`**: Creates a new note account for the caller
   - Validates content is not empty and within length limit (1024 chars)
   - Initializes the Note account with the provided content
   - Sets upvotes and tip_total to 0
   - Records creation and update timestamps

2. **`update_note`**: Updates the content of an existing note
   - Only the note author can update their note
   - Validates content is not empty and within length limit
   - Updates the content and timestamp

3. **`delete_note`**: Deletes a note account
   - Only the note author can delete their note
   - Closes the account and returns rent to the authority

4. **`upvote_note`**: Increments the upvote count for a note
   - Any user except the author can upvote
   - Prevents self-upvoting through validation

5. **`tip_note`**: Sends SOL as a tip to the note author
   - Transfers SOL from tipper to note author
   - Updates the tip_total on the note account
   - Prevents self-tipping
   - Requires tip amount > 0

### Account Structure

The main account structure is the `Note` account:

```rust
#[account]
pub struct Note {
    pub authority: Pubkey,      // The wallet that owns/created this note
    pub bump: u8,               // PDA bump seed
    pub upvotes: u64,           // Total number of upvotes received
    pub tip_total: u64,         // Total SOL tipped to this note (in lamports)
    pub created_at: i64,        // Unix timestamp when note was created
    pub updated_at: i64,        // Unix timestamp when note was last updated
    pub content: String,        // The actual note content (max 1024 chars)
}
```

**Account Size:**
- Base size: 32 (authority) + 1 (bump) + 8 (upvotes) + 8 (tip_total) + 8 (created_at) + 8 (updated_at) + 4 (String length prefix) = 69 bytes
- Total with discriminator (8 bytes) + max content (1024 bytes) = ~1101 bytes
- Accounts are sized dynamically based on content length

## Testing

### Test Coverage

The test suite comprehensively covers all instructions with both happy path and error scenarios. Tests are located in `anchor_project/onchain_notes/tests/onchain_notes.ts`.

### Test Table

| Test # | Test Name | Instruction | Type | Description | Expected Result |
|--------|-----------|-------------|------|-------------|-----------------|
| 1 | Creates a note | `create_note` | Happy | Creates a new note with valid content | Note account created with correct content and initial values (upvotes=0) |
| 2 | Rejects duplicate note creation | `create_note` | Unhappy | Attempts to create a second note for the same user | Transaction fails with "already in use" error |
| 3 | Updates note content for the author | `update_note` | Happy | Author updates their note content | Note content is successfully updated |
| 4 | Blocks updates from other users | `update_note` | Unhappy | Non-author attempts to update the note | Transaction fails with "ConstraintHasOne" error |
| 5 | Allows fans to upvote | `upvote_note` | Happy | A user (not the author) upvotes the note | Upvote count increments by 1 |
| 6 | Prevents authors from upvoting their own note | `upvote_note` | Unhappy | Author attempts to upvote their own note | Transaction fails with "CannotUpvoteOwnNote" error |
| 7 | Allows tipping from other users | `tip_note` | Happy | A user (not the author) tips the note with SOL | SOL is transferred to author, tip_total is updated |
| 8 | Prevents self-tipping | `tip_note` | Unhappy | Author attempts to tip their own note | Transaction fails with "CannotTipOwnNote" error |
| 9 | Prevents unauthorized deletes | `delete_note` | Unhappy | Non-author attempts to delete the note | Transaction fails with "ConstraintHasOne" error |
| 10 | Allows the author to delete the note | `delete_note` | Happy | Author deletes their note | Note account is closed and deleted |
| 11 | Fails to create a note with empty content | `create_note` | Unhappy | Attempts to create a note with empty string | Transaction fails with "ContentEmpty" error |
| 12 | Fails to tip with amount of zero | `tip_note` | Unhappy | Attempts to tip with 0 lamports | Transaction fails with "InvalidTipAmount" error |

### Test Summary

- **Total Tests**: 12
- **Happy Path Tests**: 5 (tests #1, #3, #5, #7, #10)
- **Unhappy Path Tests**: 7 (tests #2, #4, #6, #8, #9, #11, #12)
- **Instructions Covered**: All 5 instructions (create_note, update_note, delete_note, upvote_note, tip_note)

### Running Tests

To run all tests:

```bash
cd anchor_project/onchain_notes
anchor test
```

Or using the test script:

```bash
yarn test
# or
npm test
```

Tests run against a local validator that is automatically started and stopped by Anchor.

### Test Environment Setup

Before running tests, ensure:
1. You have a Solana wallet configured (in `~/.config/solana/id.json` by default)
2. Your wallet has sufficient SOL for test transactions
3. Anchor can start a local validator (requires Solana CLI installed)

The test suite automatically:
- Starts a local Solana validator
- Deploys the program to the local validator
- Airdrops SOL to test accounts as needed
- Runs all test cases
- Cleans up after completion

### Additional Notes for Evaluators

- **Program ID**: The program is deployed with ID `6CBafYtMRgRdk72FDmcLhHng7zCGfiAGi6bwnvifrsaH`. This ID is declared in the program source code.
- **PDA Implementation**: The program correctly implements PDAs for note accounts, ensuring one note per user.
- **Security**: All access control checks are implemented correctly:
  - Only note authors can update/delete their notes
  - Authors cannot upvote or tip their own notes
  - Content validation prevents empty notes
  - Tip amount validation prevents zero tips
- **Error Handling**: Custom error codes are defined for all validation failures:
  - `ContentEmpty`: Note content cannot be empty
  - `ContentTooLong`: Note content exceeds maximum length
  - `CannotUpvoteOwnNote`: Authors cannot upvote their own notes
  - `CannotTipOwnNote`: Authors cannot tip their own notes
  - `InvalidTipAmount`: Tip amount must be greater than 0
  - `AuthorMismatch`: Note author validation failed
  - `MathOverflow`: Arithmetic overflow occurred
- **Cross-Program Invocation**: The `tip_note` instruction uses CPI (Cross-Program Invocation) to transfer SOL from tipper to note author through the System Program.
- **Test Coverage**: All instructions have both positive and negative test cases, ensuring comprehensive coverage of functionality and error scenarios.
