import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import POSClient from "@/components/pos/POSClient";

export default async function POSPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: categories }, { data: items }, { data: tables }, { data: business }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, icon, sort_order")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, category_id, name, price, image_url, available, is_archived")
      .eq("business_id", ctx.businessId)
      .eq("is_archived", false)
      .order("name"),
    supabase
      .from("restaurant_tables")
      .select("id, table_number, status, current_order_id")
      .eq("business_id", ctx.businessId)
      .order("table_number"),
    supabase.from("businesses").select("tax_rate, currency, name").eq("id", ctx.businessId).single(),
  ]);

  return (
    <POSClient
      businessId={ctx.businessId}
      businessName={business?.name ?? ctx.businessName}
      currency={business?.currency ?? "RWF"}
      taxRate={business?.tax_rate ?? 0}
      role={ctx.role}
      categories={categories ?? []}
      items={items ?? []}
      tables={tables ?? []}
    />
  );
}
