import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import POSClient from "@/components/pos/POSClient";

export default async function POSPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: categories }, { data: items }, { data: tables }, { data: business }, { data: recipes }] =
    await Promise.all([
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
      supabase
        .from("menu_item_ingredients")
        .select("menu_item_id, quantity_required, inventory_items(quantity_on_hand)")
        .eq("business_id", ctx.businessId),
    ]);

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone")
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  // A menu item is sellable right now if either it has no recipe configured
  // (simple product mode) or every linked ingredient has enough stock for at
  // least one unit. Items that can't currently be fulfilled are excluded from
  // the POS grid entirely, rather than shown and only blocked at checkout.
  const outOfStock = new Set<string>();
  for (const row of recipes ?? []) {
    const onHand = (row as unknown as { inventory_items: { quantity_on_hand: number } | null }).inventory_items
      ?.quantity_on_hand;
    if (onHand === undefined || onHand === null || onHand < row.quantity_required) {
      outOfStock.add(row.menu_item_id);
    }
  }

  const sellableItems = (items ?? []).filter((item) => item.available && !outOfStock.has(item.id));

  return (
    <POSClient
      businessId={ctx.businessId}
      businessName={business?.name ?? ctx.businessName}
      currency={business?.currency ?? "RWF"}
      taxRate={business?.tax_rate ?? 0}
      role={ctx.role}
      categories={categories ?? []}
      items={sellableItems}
      tables={tables ?? []}
      customers={customers ?? []}
    />
  );
}

