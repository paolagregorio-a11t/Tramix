import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase (Frankfurt, UE): accounts and the database. The URL and the anon key are public by design;
 * what protects the data are the row level security rules in supabase/migrations. The secret key never reaches the browser.
 */
/** Cuotio's project (Frankfurt). Public values, kept here so they also reach the installed app and the APK, like the Umami ID. */
const DEFAULT_URL = "https://gtspatmxfdubqzevrmyt.supabase.co";
const DEFAULT_KEY = "sb_publishable_-IuFpxSW6ucETCYGr_LURw_nI1UAakQ";
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_KEY;

export const cuentasActivas = () => !!URL && !!KEY;

let client: Promise<SupabaseClient> | null = null;

/** Loaded on demand so the public pages do not download the Supabase library. */
export function supabase(): Promise<SupabaseClient> {
  if (!cuentasActivas()) return Promise.reject(new Error("Supabase no está configurado"));
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, flowType: "pkce", detectSessionInUrl: true, storageKey: "cuotio-sesion" } }));
  return client;
}
