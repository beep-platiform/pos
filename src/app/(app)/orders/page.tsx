import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import OrdersClient from "@/components/orders/OrdersClient";

export default async function OrdersPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, order_type, status, table_id, customer_id, delivery_person_id, delivery_address, total, payment_status, amount_paid, created_at, restaurant_tables(table_number), customers(name, phone)"
    )
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <OrdersClient
      businessId={ctx.businessId}
      currency={ctx.currency}
      role={ctx.role}
      initialOrders={(orders ?? []) as unknown as OrderWithRelations[]}
    />
  );
}

export interface OrderWithRelations {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  table_id: string | null;
  customer_id: string | null;
  delivery_person_id: string | null;
  delivery_address: string | null;
  total: number;
  payment_status: string;
  amount_paid: number;
  created_at: string;
  restaurant_tables: { table_number: string } | null;
  customers: { name: string | null; phone: string | null } | null;
}
