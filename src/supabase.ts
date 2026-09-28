// Supabase client for nabapu — RWA provenance ledger (off-chain index of
// on-chain ValuationUpdated events + issuer attestations).
//
// Project: nabapu (nthzbjrvfohdpmrhkfrn, ap-southeast-2)
// The publishable/anon key is safe to ship in the client bundle. The
// service_role key stays in api-penting/supabase.txt and is only ever read
// server-side by the /api routes.

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://nthzbjrvfohdpmrhkfrn.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_oRouAHDzE-1g7CzJ_2lUXg_g9Rzb0BO";
