use anchor_lang::prelude::*;

#[account]
pub struct Note {
    pub authority: Pubkey,
    pub bump: u8,
    pub upvotes: u64,
    pub tip_total: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub content: String,
}

impl Note {
    pub const BASE_SIZE: usize = 32 + 1 + 8 + 8 + 8 + 8 + 4;

    pub const fn max_space() -> usize {
        8 + Self::BASE_SIZE + crate::MAX_CONTENT_LENGTH
    }

    pub fn space_for(content_len: usize) -> usize {
        8 + Self::BASE_SIZE + content_len
    }
}
