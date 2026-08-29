import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import InventoryClient from "@/components/inventory/InventoryClient";

export default async function InventoryPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, business_id, name, unit, quantity_on_hand, min_quantity, cost_per_unit, supplier_name, is_archived, updated_at")
    .eq("business_id", ctx.businessId)
    .eq("is_archived", false)
    .order("name");

  return (
    <InventoryClient
      businessId={ctx.businessId}
      currency={ctx.currency}
      role={ctx.role}
      initialItems={items ?? []}
    />
  );
}
