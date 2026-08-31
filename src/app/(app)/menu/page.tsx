import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MenuClient from "@/components/menu/MenuClient";

export default async function MenuPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: categories }, { data: items }, { data: inventoryItems }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, business_id, category_id, name, description, price, cost_price, available, is_archived, prep_time_minutes")
      .eq("business_id", ctx.businessId)
      .eq("is_archived", false)
      .order("name"),
    supabase
      .from("inventory_items")
      .select("id, name, unit, quantity_on_hand")
      .eq("business_id", ctx.businessId)
      .eq("is_archived", false)
      .order("name"),
  ]);

  return (
    <MenuClient
      businessId={ctx.businessId}
      currency={ctx.currency}
      role={ctx.role}
      categories={categories ?? []}
      initialItems={items ?? []}
      inventoryItems={inventoryItems ?? []}
    />
  );
}
