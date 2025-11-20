pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use state::*;

pub use instructions::*;

declare_id!("6CBafYtMRgRdk72FDmcLhHng7zCGfiAGi6bwnvifrsaH");

#[program]
pub mod onchain_notes {
    use super::*;

    pub fn create_note(ctx: Context<CreateNote>, content: String) -> Result<()> {
        create_note::handler(ctx, content)
    }

    pub fn update_note(ctx: Context<UpdateNote>, content: String) -> Result<()> {
        update_note::handler(ctx, content)
    }

    pub fn delete_note(ctx: Context<DeleteNote>) -> Result<()> {
        delete_note::handler(ctx)
    }

    pub fn upvote_note(ctx: Context<UpvoteNote>) -> Result<()> {
        upvote_note::handler(ctx)
    }

    pub fn tip_note(ctx: Context<TipNote>, amount: u64) -> Result<()> {
        tip_note::handler(ctx, amount)
    }
}
