import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EmployeesClient from "@/components/employees/EmployeesClient";

export default async function EmployeesPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: staff }, { data: invites }] = await Promise.all([
    supabase.rpc("list_staff"),
    supabase
      .from("invites")
      .select("id, email, role, accepted, created_at")
      .eq("business_id", ctx.businessId)
      .eq("accepted", false)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <EmployeesClient
      role={ctx.role}
      currentUserId={ctx.userId}
      initialStaff={staff ?? []}
      initialInvites={invites ?? []}
    />
  );
}
