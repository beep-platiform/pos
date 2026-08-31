import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import POSClient from "@/components/pos/POSClient";

export default async function POSPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const { table: initialTableId } = await searchParams;
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

  // A menu item only ever appears on the POS if it's a real, inventory-backed
  // product (has at least one recipe link) — no recipe means it's not really
  // sellable yet. maxQuantity is how many more times this dish can be sold
  // right now, computed across every linked ingredient (whichever runs out
  // first caps it) — the cart uses this to stop staff from adding more than
  // physically exists, instead of only finding out at checkout.
  const hasRecipe = new Set<string>();
  const maxQuantityByItem = new Map<string, number>();
  for (const row of recipes ?? []) {
    hasRecipe.add(row.menu_item_id);
    const onHand = (row as unknown as { inventory_items: { quantity_on_hand: number } | null }).inventory_items
      ?.quantity_on_hand;
    const possible = onHand === undefined || onHand === null ? 0 : Math.floor(onHand / row.quantity_required);
    const current = maxQuantityByItem.get(row.menu_item_id);
    maxQuantityByItem.set(row.menu_item_id, current === undefined ? possible : Math.min(current, possible));
  }

  const sellableItems = (items ?? [])
    .filter((item) => hasRecipe.has(item.id))
    .map((item) => {
      const maxQuantity = maxQuantityByItem.get(item.id) ?? 0;
      return { ...item, inStock: maxQuantity > 0, maxQuantity };
    });

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
      initialTableId={initialTableId ?? null}
    />
  );
}

