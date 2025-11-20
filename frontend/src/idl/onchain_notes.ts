export const ONCHAIN_NOTES_IDL = {
  address: "4zNGgpwSFSS8gZSU4FgA9nmaM2UT6kpBS3V672Rwnuzs",
  metadata: {
    name: "onchain_notes",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "create_note",
      discriminator: [103, 2, 208, 242, 86, 156, 151, 107],
      accounts: [
        { name: "authority", writable: true, signer: true },
        {
          name: "note",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [110, 111, 116, 101] },
              { kind: "account", path: "authority" },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [{ name: "content", type: "string" }],
    },
    {
      name: "delete_note",
      discriminator: [182, 211, 115, 229, 163, 88, 108, 217],
      accounts: [
        {
          name: "authority",
          writable: true,
          signer: true,
          relations: ["note"],
        },
        {
          name: "note",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [110, 111, 116, 101] },
              { kind: "account", path: "authority" },
            ],
          },
        },
      ],
      args: [],
    },
    {
      name: "tip_note",
      discriminator: [164, 249, 79, 14, 170, 169, 191, 216],
      accounts: [
        { name: "tipper", writable: true, signer: true },
        { name: "note_author", writable: true },
        {
          name: "note",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [110, 111, 116, 101] },
              { kind: "account", path: "note_author" },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "update_note",
      discriminator: [103, 129, 251, 34, 33, 154, 210, 148],
      accounts: [
        {
          name: "authority",
          writable: true,
          signer: true,
          relations: ["note"],
        },
        {
          name: "note",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [110, 111, 116, 101] },
              { kind: "account", path: "authority" },
            ],
          },
        },
      ],
      args: [{ name: "content", type: "string" }],
    },
    {
      name: "upvote_note",
      discriminator: [160, 26, 60, 78, 89, 4, 209, 207],
      accounts: [
        { name: "voter", writable: true, signer: true },
        { name: "note_author" },
        {
          name: "note",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [110, 111, 116, 101] },
              { kind: "account", path: "note_author" },
            ],
          },
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Note",
      discriminator: [203, 75, 252, 196, 81, 210, 122, 126],
    },
  ],
  errors: [
    { code: 6000, name: "ContentEmpty", msg: "Content must not be empty" },
    {
      code: 6001,
      name: "ContentTooLong",
      msg: "Content exceeds maximum length",
    },
    {
      code: 6002,
      name: "AuthorMismatch",
      msg: "Note authority does not match the PDA seeds",
    },
    {
      code: 6003,
      name: "CannotUpvoteOwnNote",
      msg: "Authors cannot upvote their own note",
    },
    {
      code: 6004,
      name: "CannotTipOwnNote",
      msg: "Authors cannot tip their own note",
    },
    {
      code: 6005,
      name: "InvalidTipAmount",
      msg: "Tip amount must be greater than zero",
    },
    {
      code: 6006,
      name: "MathOverflow",
      msg: "Mathematical operation overflowed",
    },
  ],
  types: [
    {
      name: "Note",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "bump", type: "u8" },
          { name: "upvotes", type: "u64" },
          { name: "tip_total", type: "u64" },
          { name: "created_at", type: "i64" },
          { name: "updated_at", type: "i64" },
          { name: "content", type: "string" },
        ],
      },
    },
  ],
} as const;

export type OnchainNotesIdl = typeof ONCHAIN_NOTES_IDL;





