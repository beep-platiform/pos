import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DeliveriesClient from "@/components/deliveries/DeliveriesClient";

export default async function DeliveriesPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: orders }, { data: staff }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, status, delivery_address, delivery_notes, delivery_person_id, total, created_at, customers(name, phone)"
      )
      .eq("business_id", ctx.businessId)
      .eq("order_type", "delivery")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("business_users")
      .select("user_id, role, profiles(full_name)")
      .eq("business_id", ctx.businessId)
      .eq("role", "delivery")
      .eq("active", true),
  ]);

  const deliveryStaff = (staff ?? []).map((s) => ({
    id: s.user_id,
    // @ts-expect-error - joined shape from PostgREST
    name: s.profiles?.full_name ?? "Delivery staff",
  }));

  return (
    <DeliveriesClient
      currency={ctx.currency}
      role={ctx.role}
      initialOrders={(orders ?? []) as unknown as DeliveryOrder[]}
      deliveryStaff={deliveryStaff}
    />
  );
}

export interface DeliveryOrder {
  id: string;
  order_number: string;
  status: string;
  delivery_address: string | null;
  delivery_notes: string | null;
  delivery_person_id: string | null;
  total: number;
  created_at: string;
  customers: { name: string | null; phone: string | null } | null;
}
