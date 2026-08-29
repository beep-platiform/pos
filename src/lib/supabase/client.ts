import { createBrowserClient } from "@supabase/ssr";

// Singleton: creating a fresh client on every render/component mount causes
// multiple GoTrueClient instances to compete over the same session storage,
// which can intermittently drop the auth token (seen as requests being sent
// as `anon` instead of `authenticated`, tripping RLS policies). Reuse one
// instance for the lifetime of the tab instead.
type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;
let browserClient: BrowserSupabaseClient | null = null;

export function createClient(): BrowserSupabaseClient {
  if (browserClient === null) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
