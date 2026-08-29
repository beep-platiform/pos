import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export interface SessionContext {
  userId: string;
  email: string | null;
  fullName: string | null;
  businessId: string;
  businessName: string;
  currency: string;
  role: UserRole;
}

/**
 * Loads the logged-in user's business membership + role.
 * Returns null if unauthenticated or not yet onboarded (no business_users row).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("business_users")
    .select("business_id, role, businesses ( name, currency )")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const business = membership.businesses as unknown as { name: string; currency: string } | null;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    businessId: membership.business_id as string,
    businessName: business?.name ?? "",
    currency: business?.currency ?? "RWF",
    role: membership.role as UserRole,
  };
}

/** Roles allowed to see each sidebar module (Section 63 of the spec) */
export const ROLE_NAV: Record<UserRole, string[]> = {
  owner: ["dashboard", "pos", "orders", "kitchen", "tables", "deliveries", "menu", "inventory", "purchases", "customers", "expenses", "cash-register", "employees", "reports", "settings"],
  manager: ["dashboard", "pos", "orders", "kitchen", "tables", "deliveries", "menu", "inventory", "purchases", "customers", "expenses", "cash-register", "employees", "reports"],
  cashier: ["dashboard", "pos", "orders", "customers", "cash-register"],
  waiter: ["pos", "orders", "tables"],
  kitchen: ["kitchen"],
  delivery: ["deliveries"],
};
