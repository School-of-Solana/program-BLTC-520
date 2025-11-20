use anchor_lang::{prelude::*, system_program};

use crate::{error::ErrorCode, Note, NOTE_SEED};

#[derive(Accounts)]
pub struct TipNote<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,
    #[account(mut)]
    pub note_author: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [NOTE_SEED, note_author.key().as_ref()],
        bump = note.bump
    )]
    pub note: Account<'info, Note>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<TipNote>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidTipAmount);

    let tipper = &ctx.accounts.tipper;
    let note_author = &ctx.accounts.note_author;
    let note = &mut ctx.accounts.note;

    require_keys_eq!(note.authority, note_author.key(), ErrorCode::AuthorMismatch);
    require_keys_neq!(note.authority, tipper.key(), ErrorCode::CannotTipOwnNote);

    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: tipper.to_account_info(),
            to: note_author.to_account_info(),
        },
    );
    system_program::transfer(transfer_ctx, amount)?;

    note.tip_total = note
        .tip_total
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    note.updated_at = Clock::get()?.unix_timestamp;

    Ok(())
}
