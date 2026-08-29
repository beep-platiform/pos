/**
 * Supabase/PostgREST errors are plain objects with a `.message` field —
 * they are NOT instances of the native `Error` class. A naive
 * `err instanceof Error` check silently swallows them. This helper handles
 * both shapes plus generic thrown values.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}
