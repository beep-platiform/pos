import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, ShoppingBag, Wallet, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("id, total, payment_status, status, created_at")
    .eq("business_id", ctx.businessId)
    .gte("created_at", startOfDay.toISOString());

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, order_number, total, status, order_type, created_at")
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false })
    .limit(8);

  const orders = todayOrders ?? [];
  const grossRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalOrders = orders.length;

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  });

  const cards = [
    { label: "Today's Sales", value: `${ctx.currency} ${grossRevenue.toLocaleString()}`, icon: TrendingUp },
    { label: "Orders Today", value: totalOrders.toString(), icon: ShoppingBag },
    { label: "Paid Orders", value: paidOrders.length.toString(), icon: Wallet },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-muted mb-6">Welcome back, {ctx.fullName || "there"}.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">{c.label}</span>
              <c.icon size={18} className="text-primary" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-3">Order status today</h2>
          {totalOrders === 0 ? (
            <p className="text-sm text-muted">No orders yet today.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-foreground/70">{status.replace("_", " ")}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-3">Recent transactions</h2>
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="text-sm text-muted">No transactions yet. Head to POS to create your first sale.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted capitalize">{o.order_type.replace("_", " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {ctx.currency} {Number(o.total).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted capitalize">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalOrders === 0 && (
        <div className="mt-6 flex items-start gap-3 bg-primary-light border border-primary/20 rounded-2xl p-4 text-sm text-primary-dark">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            This dashboard reflects real data from your database — nothing is hard-coded. Once you start taking
            orders on the POS screen, your numbers will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
