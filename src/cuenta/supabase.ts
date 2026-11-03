import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase (Frankfurt, UE): accounts and the database. The URL and the anon key are public by design;
 * what protects the data are the row level security rules in supabase/migrations. The secret key never reaches the browser.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cuentasActivas = () => !!URL && !!KEY;

let client: Promise<SupabaseClient> | null = null;

/** Loaded on demand so the public pages do not download the Supabase library. */
export function supabase(): Promise<SupabaseClient> {
  if (!cuentasActivas()) return Promise.reject(new Error("Supabase no está configurado"));
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "cuotio-sesion" } }));
  return client;
}
