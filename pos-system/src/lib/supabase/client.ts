import { createBrowserClient } from "@supabase/ssr";

// Not parameterized with generated Database types yet (run `supabase gen types
// typescript` against the project and wire it in once the schema stabilizes
// across all phases). Application-level types in `@/types/database.types`
// are used for props/state instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
