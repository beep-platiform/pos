"use client";

import { useState } from "react";
import { Clock, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { KitchenOrder } from "@/app/(app)/kitchen/page";

export default function KitchenClient({
  initialOrders,
  itemsByOrder,
}: {
  initialOrders: KitchenOrder[];
  itemsByOrder: Record<string, { name_snapshot: string; quantity: number; note: string | null }[]>;
}) {
  const supabase = createClient();
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function advance(order: KitchenOrder) {
    const nextStatus = order.status === "new" ? "preparing" : "ready";
    setUpdating(order.id);
    setError(null);
    const { error: err } = await supabase.rpc("update_order_status", {
      p_order_id: order.id,
      p_new_status: nextStatus,
    });
    if (err) {
      setError(getErrorMessage(err, "Unable to update this order."));
      setUpdating(null);
      return;
    }
    if (nextStatus === "ready") {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
    }
    setUpdating(null);
  }

  const newOrders = orders.filter((o) => o.status === "new");
  const preparing = orders.filter((o) => o.status === "preparing");

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-semibold mb-1">Kitchen</h1>
      <p className="text-sm text-muted mb-6">Orders appear here the moment they&apos;re placed.</p>

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center text-muted">
          <ChefHat className="mx-auto mb-3" size={28} />
          <p className="text-sm">No orders in the queue. New orders will show up here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...newOrders, ...preparing].map((order) => (
            <div
              key={order.id}
              className={`bg-surface border-2 rounded-2xl p-4 ${
                order.status === "new" ? "border-blue-300" : "border-warning/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{order.order_number}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    order.status === "new" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-warning"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5 mb-3">
                <Clock size={11} /> {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                <span className="capitalize">
                  · {order.order_type.replace("_", " ")}
                  {order.restaurant_tables ? ` · Table ${order.restaurant_tables.table_number}` : ""}
                </span>
              </p>

              <div className="space-y-1 mb-3">
                {(itemsByOrder[order.id] ?? []).map((item, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">
                      {item.name_snapshot} × {item.quantity}
                    </span>
                    {item.note && <p className="text-xs text-muted italic">Note: {item.note}</p>}
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="text-xs bg-background rounded-lg px-2 py-1.5 mb-3 italic">&ldquo;{order.notes}&rdquo;</p>
              )}

              <button
                disabled={updating === order.id}
                onClick={() => advance(order)}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
              >
                {updating === order.id ? "Updating…" : order.status === "new" ? "Accept" : "Mark ready"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
