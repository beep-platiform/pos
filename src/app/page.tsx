import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const ctx = await getSessionContext();
  if (ctx) redirect("/pos");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/onboarding" : "/login");
}
