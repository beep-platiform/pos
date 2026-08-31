"use client";

import { useMemo, useState } from "react";
import { Clock, ChevronRight, X, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { OrderWithRelations } from "@/app/(app)/orders/page";
import type { OrderItemRow, OrderStatus } from "@/types/database.types";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  preparing: "bg-orange-50 text-warning",
  ready: "bg-primary-light text-primary-dark",
  out_for_delivery: "bg-purple-50 text-purple-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-danger",
};

function nextAction(order: OrderWithRelations): { label: string; status: OrderStatus } | null {
  if (order.status === "new") return { label: "Accept", status: "preparing" };
  if (order.status === "preparing") return { label: "Mark ready", status: "ready" };
  if (order.status === "ready" && order.order_type === "delivery")
    return { label: "Send out", status: "out_for_delivery" };
  if (order.status === "ready") return { label: "Complete", status: "completed" };
  if (order.status === "out_for_delivery") return { label: "Mark delivered", status: "completed" };
  return null;
}

export default function OrdersClient({
  currency,
  initialOrders,
}: {
  businessId: string;
  currency: string;
  role: string;
  initialOrders: OrderWithRelations[];
}) {
  const supabase = createClient();
  const [orders, setOrders] = useState<OrderWithRelations[]>(initialOrders);
  const [filter, setFilter] = useState("all");
  const [detailOrder, setDetailOrder] = useState<OrderWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  async function advance(order: OrderWithRelations, status: OrderStatus) {
    setUpdating(order.id);
    setError(null);
    const { error: err } = await supabase.rpc("update_order_status", {
      p_order_id: order.id,
      p_new_status: status,
    });
    if (err) {
      setError(getErrorMessage(err, "Unable to update this order."));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      setDetailOrder((prev) => (prev && prev.id === order.id ? { ...prev, status } : prev));
    }
    setUpdating(null);
  }

  async function cancelOrder(order: OrderWithRelations) {
    if (!confirm(`Cancel order ${order.order_number}? This cannot be undone.`)) return;
    await advance(order, "cancelled");
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold mb-1">Orders</h1>
      <p className="text-sm text-muted mb-4">Live order queue for this restaurant.</p>

      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              filter === f.key ? "bg-primary text-white border-primary" : "border-border text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-muted text-sm">
          <ShoppingBag className="mx-auto mb-3" size={26} />
          No orders here.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const action = nextAction(order);
            return (
              <div
                key={order.id}
                className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/40"
                onClick={() => setDetailOrder(order)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{order.order_number}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted flex items-center gap-1.5">
                    <Clock size={11} /> {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    <span className="capitalize">· {order.order_type.replace("_", " ")}</span>
                    {order.restaurant_tables && <span>· Table {order.restaurant_tables.table_number}</span>}
                    {order.customers?.name && <span>· {order.customers.name}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-sm">
                    {currency} {order.total.toLocaleString()}
                  </span>
                  {action && (
                    <button
                      disabled={updating === order.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        advance(order, action.status);
                      }}
                      className="text-xs font-medium bg-primary-light text-primary-dark px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition disabled:opacity-50"
                    >
                      {updating === order.id ? "…" : action.label}
                    </button>
                  )}
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          currency={currency}
          onClose={() => setDetailOrder(null)}
          onAdvance={(status) => advance(detailOrder, status)}
          onCancel={() => cancelOrder(detailOrder)}
          updating={updating === detailOrder.id}
        />
      )}
    </div>
  );
}

function OrderDetailModal({
  order,
  currency,
  onClose,
  onAdvance,
  onCancel,
  updating,
}: {
  order: OrderWithRelations;
  currency: string;
  onClose: () => void;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
  updating: boolean;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<OrderItemRow[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    supabase
      .from("order_items")
      .select("id, order_id, name_snapshot, quantity, price_snapshot, note")
      .eq("order_id", order.id)
      .then(({ data }: { data: OrderItemRow[] | null }) => setItems(data ?? []));
  }

  const action = nextAction(order);
  const canCancel = order.status !== "completed" && order.status !== "cancelled";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-1">{order.order_number}</h3>
        <p className="text-sm text-muted capitalize mb-4">
          {order.status.replace("_", " ")} · {order.order_type.replace("_", " ")}
        </p>

        <div className="space-y-1.5 mb-4">
          {items === null ? (
            <p className="text-sm text-muted">Loading items…</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span>
                  {it.name_snapshot} × {it.quantity}
                </span>
                <span>
                  {currency} {(it.price_snapshot * it.quantity).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between font-semibold text-sm border-t border-border pt-3 mb-4">
          <span>Total</span>
          <span>
            {currency} {order.total.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2">
          {action && (
            <button
              disabled={updating}
              onClick={() => onAdvance(action.status)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
            >
              {updating ? "Updating…" : action.label}
            </button>
          )}
          {canCancel && (
            <button
              disabled={updating}
              onClick={onCancel}
              className="w-full border border-danger text-danger font-medium py-2.5 rounded-lg disabled:opacity-50"
            >
              Cancel order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
