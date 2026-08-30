import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import TablesClient from "@/components/tables/TablesClient";

export default async function TablesPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, seats, status, current_order_id")
    .eq("business_id", ctx.businessId)
    .order("table_number");

  const orderIds = (tables ?? []).map((t) => t.current_order_id).filter((id): id is string => !!id);

  let ordersById: Record<string, { order_number: string; total: number; status: string; order_type: string }> = {};
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, total, status, order_type")
      .in("id", orderIds);
    ordersById = Object.fromEntries((orders ?? []).map((o) => [o.id, o]));
  }

  return (
    <TablesClient
      businessId={ctx.businessId}
      currency={ctx.currency}
      role={ctx.role}
      initialTables={tables ?? []}
      ordersById={ordersById}
    />
  );
}
