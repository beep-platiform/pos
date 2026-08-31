import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CustomersClient from "@/components/customers/CustomersClient";

export default async function CustomersPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone, address, notes, created_at")
      .eq("business_id", ctx.businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("customer_id, total, amount_paid, payment_status, created_at")
      .eq("business_id", ctx.businessId)
      .not("customer_id", "is", null),
  ]);

  const stats: Record<string, { totalSpent: number; orderCount: number; lastOrderAt: string; outstanding: number }> = {};
  for (const o of orders ?? []) {
    if (!o.customer_id) continue;
    const s = stats[o.customer_id] ?? { totalSpent: 0, orderCount: 0, lastOrderAt: o.created_at, outstanding: 0 };
    s.totalSpent += Number(o.total);
    s.orderCount += 1;
    if (new Date(o.created_at) > new Date(s.lastOrderAt)) s.lastOrderAt = o.created_at;
    if (o.payment_status !== "paid") s.outstanding += Number(o.total) - Number(o.amount_paid);
    stats[o.customer_id] = s;
  }

  return (
    <CustomersClient
      businessId={ctx.businessId}
      currency={ctx.currency}
      initialCustomers={customers ?? []}
      stats={stats}
    />
  );
}
