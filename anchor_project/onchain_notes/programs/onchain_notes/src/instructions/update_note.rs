use anchor_lang::prelude::*;

use crate::{error::ErrorCode, Note, MAX_CONTENT_LENGTH, NOTE_SEED};

#[derive(Accounts)]
pub struct UpdateNote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [NOTE_SEED, note.authority.as_ref()],
        bump = note.bump,
        has_one = authority
    )]
    pub note: Account<'info, Note>,
}

pub fn handler(ctx: Context<UpdateNote>, content: String) -> Result<()> {
    require!(!content.is_empty(), ErrorCode::ContentEmpty);
    require!(
        content.len() <= MAX_CONTENT_LENGTH,
        ErrorCode::ContentTooLong
    );

    let note = &mut ctx.accounts.note;
    note.content = content;
    note.updated_at = Clock::get()?.unix_timestamp;
    Ok(())
}
