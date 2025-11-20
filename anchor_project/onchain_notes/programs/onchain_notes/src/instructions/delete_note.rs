use anchor_lang::prelude::*;

use crate::{Note, NOTE_SEED};

#[derive(Accounts)]
pub struct DeleteNote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority,
        seeds = [NOTE_SEED, note.authority.as_ref()],
        bump = note.bump,
        has_one = authority
    )]
    pub note: Account<'info, Note>,
}

pub fn handler(_ctx: Context<DeleteNote>) -> Result<()> {
    Ok(())
}
