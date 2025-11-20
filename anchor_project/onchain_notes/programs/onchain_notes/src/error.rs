use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Content must not be empty")]
    ContentEmpty,
    #[msg("Content exceeds maximum length")]
    ContentTooLong,
    #[msg("Note authority does not match the PDA seeds")]
    AuthorMismatch,
    #[msg("Authors cannot upvote their own note")]
    CannotUpvoteOwnNote,
    #[msg("Authors cannot tip their own note")]
    CannotTipOwnNote,
    #[msg("Tip amount must be greater than zero")]
    InvalidTipAmount,
    #[msg("Mathematical operation overflowed")]
    MathOverflow,
}
