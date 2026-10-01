/**
 * Shim package Solana untuk Privy/x402 (peer opsional yang TIDAK di-install).
 * App ini murni EVM Robinhood Chain Testnet — path Solana tidak pernah jalan.
 * Semua export = Proxy yang tidak pernah melempar error saat module init.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === Symbol.toPrimitive) return () => "solana-shim";
    if (prop === "then") return undefined;
    return chain;
  },
  apply: () => chain,
});

export const address = (a: unknown) => a;
export const isAddress = () => false;
export const isSome = () => false;
export const pipe = (...args: any[]) =>
  args.reduce((acc: any, fn: any) => (typeof fn === "function" ? fn(acc) : acc), args[0]);
export const SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED = chain;
export const appendTransactionMessageInstruction = chain;
export const appendTransactionMessageInstructions = chain;
export const assertIsInstructionWithAccounts = chain;
export const assertIsInstructionWithData = chain;
export const assertIsTransactionMessageWithBlockhashLifetime = chain;
export const blockhash = chain;
export const compileTransaction = chain;
export const createKeyPairSignerFromBytes = chain;
export const createKeyPairSignerFromPrivateKeyBytes = chain;
export const createSolanaRpc = chain;
export const createSolanaRpcSubscriptions = chain;
export const createTransactionMessage = chain;
export const decompileTransactionMessage = chain;
export const decompileTransactionMessageFetchingLookupTables = chain;
export const devnet = chain;
export const fetchAddressesForLookupTables = chain;
export const fetchEncodedAccount = chain;
export const fetchEncodedAccounts = chain;
export const getAddressEncoder = chain;
export const getBase58Decoder = chain;
export const getBase58Encoder = chain;
export const getBase64Decoder = chain;
export const getBase64EncodedWireTransaction = chain;
export const getBase64Encoder = chain;
export const getCompiledTransactionMessageDecoder = chain;
export const getProgramDerivedAddress = chain;
export const getSignatureFromTransaction = chain;
export const getTransactionDecoder = chain;
export const getTransactionEncoder = chain;
export const getU64Encoder = chain;
export const getUtf8Encoder = chain;
export const isSolanaError = chain;
export const isTransactionModifyingSigner = chain;
export const isTransactionPartialSigner = chain;
export const isTransactionSigner = chain;
export const mainnet = chain;
export const partiallySignTransactionMessageWithSigners = chain;
export const prependTransactionMessageInstruction = chain;
export const setTransactionMessageFeePayer = chain;
export const setTransactionMessageFeePayerSigner = chain;
export const setTransactionMessageLifetimeUsingBlockhash = chain;

export default chain;
