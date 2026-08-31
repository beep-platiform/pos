import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import KitchenClient from "@/components/kitchen/KitchenClient";

export default async function KitchenPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, order_type, status, notes, created_at, restaurant_tables(table_number)")
    .eq("business_id", ctx.businessId)
    .in("status", ["new", "preparing"])
    .order("created_at", { ascending: true });

  const orderIds = (orders ?? []).map((o) => o.id);
  let itemsByOrder: Record<string, { name_snapshot: string; quantity: number; note: string | null }[]> = {};
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, name_snapshot, quantity, note")
      .in("order_id", orderIds);
    itemsByOrder = {};
    for (const it of items ?? []) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push(it);
    }
  }

  return (
    <KitchenClient
      initialOrders={(orders ?? []) as unknown as KitchenOrder[]}
      itemsByOrder={itemsByOrder}
    />
  );
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  restaurant_tables: { table_number: string } | null;
}
