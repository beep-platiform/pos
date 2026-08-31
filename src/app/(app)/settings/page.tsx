import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, phone, email, address, currency, tax_rate")
    .eq("id", ctx.businessId)
    .single();

  if (!business) return null;

  return <SettingsClient business={business} />;
}
