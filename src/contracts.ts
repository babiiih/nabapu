export const TOKEN = {
  /** $NRWA — Nara RWA Index (vibes launch) */
  nrwa: "0x67e891ebe485fd76060befb105d6a28e2ab46be0",
  /** $TRWA — TestRWAShare (RWA provenance contract) */
  trwa: "0x149eDc08F046053ECb486acE7248e9DB35c33aDD",
  /** Curve pair for NRWA/ETH trading */
  pair: "0xcafDc5F55C44fe5eA4343c3FC3c7600CAD47d5c5",
  /** Launch factory */
  factory: "0x40f1be6faf8DAB9C143cce1a0A04c2075Fb2DF59",
} as const;

export const CHAIN = {
  id: 46630,
  explorer: "https://explorer.testnet.chain.robinhood.com",
  rpcRead: "https://testnet.vibevibe.fun/rpc",
  api: "https://testnet.vibevibe.fun/api/v1/chains/46630",
} as const;

export const ISSUER = "0x35F76E0d2D955beED6e3752F24b4c2570e481B04";

/** $NB1000 — Nabapu 1000 free-mint ERC-721 v2 (RANDOM rarity pool, Robinhood Chain Testnet). */
export const NFT_COLLECTION = "0xcA58B07830cFc271feA19E8BfA3Bb7dcE48d469D";
