use anchor_lang::prelude::*;

use crate::{error::ErrorCode, Note, NOTE_SEED};

#[derive(Accounts)]
#[instruction(content: String)]
pub struct CreateNote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Note::space_for(content.len()),
        seeds = [NOTE_SEED, authority.key().as_ref()],
        bump
    )]
    pub note: Account<'info, Note>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateNote>, content: String) -> Result<()> {
    require!(
        content.len() <= crate::MAX_CONTENT_LENGTH,
        ErrorCode::ContentTooLong
    );
    require!(!content.is_empty(), ErrorCode::ContentEmpty);

    let clock = Clock::get()?;
    let note = &mut ctx.accounts.note;
    note.authority = ctx.accounts.authority.key();
    note.bump = ctx.bumps.note;
    note.content = content;
    note.upvotes = 0;
    note.tip_total = 0;
    note.created_at = clock.unix_timestamp;
    note.updated_at = clock.unix_timestamp;

    Ok(())
}
