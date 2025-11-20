use anchor_lang::prelude::*;

use crate::{error::ErrorCode, Note, NOTE_SEED};

#[derive(Accounts)]
pub struct UpvoteNote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    /// CHECK: PDA seed + key comparison enforces correctness
    pub note_author: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [NOTE_SEED, note_author.key().as_ref()],
        bump = note.bump
    )]
    pub note: Account<'info, Note>,
}

pub fn handler(ctx: Context<UpvoteNote>) -> Result<()> {
    let voter = &ctx.accounts.voter;
    let note_author = &ctx.accounts.note_author;
    let note = &mut ctx.accounts.note;

    require_keys_eq!(note.authority, note_author.key(), ErrorCode::AuthorMismatch);
    require_keys_neq!(note.authority, voter.key(), ErrorCode::CannotUpvoteOwnNote);

    note.upvotes = note.upvotes.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
    note.updated_at = Clock::get()?.unix_timestamp;

    Ok(())
}
