/**
 * Penerjemah error wallet → pesan yang bisa dimengerti user.
 *
 * Fakta kunci: viem memetakan JSON-RPC code -32002 (MetaMask: "sudah ada
 * request/popup tertunda") ke ResourceUnavailableRpcError dengan shortMessage
 * "Requested resource not available." — user panik lihat frasa itu.
 * Kode wrapper (TransactionExecutionError) TIDAK selalu bawa `code`, jadi
 * telusuri .cause + cek .message penuh juga.
 */

const PENDING_PHRASE = "Requested resource not available";

function isPendingRequestError(e: unknown): boolean {
  let cur = e as { code?: number; cause?: unknown; shortMessage?: string; message?: string } | null;
  for (let depth = 0; cur && depth < 6; depth++) {
    if (cur.code === -32002) return true;
    const msg = `${cur.shortMessage || ""} ${cur.message || ""}`;
    if (msg.includes(PENDING_PHRASE)) return true;
    cur = cur.cause as typeof cur;
  }
  return false;
}

const HINT_ID =
  "⚠️ MetaMask masih punya permintaan tertunda. Buka popup MetaMask-nya (cek ikon extension, biasanya ada badge merah) — approve atau batal dulu — lalu coba lagi. Kalau gak ada popup: tutup tab ini, restart browser, lalu coba.";
const HINT_EN =
  "⚠️ MetaMask still has a pending request. Open the MetaMask popup (check the extension icon — usually a red badge) and approve or dismiss it first, then retry. If no popup appears: close this tab, restart the browser, and try again.";

/** Pesan error yang manusiawi; fallback ke potongan aman dari error asli. */
export function humanWalletError(e: unknown, lang: "id" | "en" = "en"): string {
  if (isPendingRequestError(e)) return lang === "id" ? HINT_ID : HINT_EN;
  const t = e as { shortMessage?: string; message?: string };
  const raw = t.shortMessage || t.message || (e instanceof Error ? e.message : "transaction failed");
  return raw.replace(/\s+/g, " ").slice(0, 180);
}
