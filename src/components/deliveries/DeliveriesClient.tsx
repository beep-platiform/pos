"use client";

import { useState } from "react";
import { Bike, MapPin, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { DeliveryOrder } from "@/app/(app)/deliveries/page";
import type { OrderStatus } from "@/types/database.types";

const ACTIVE_STATUSES = ["new", "preparing", "ready", "out_for_delivery"];

export default function DeliveriesClient({
  currency,
  role,
  initialOrders,
  deliveryStaff,
}: {
  currency: string;
  role: string;
  initialOrders: DeliveryOrder[];
  deliveryStaff: { id: string; name: string }[];
}) {
  const supabase = createClient();
  const canAssign = ["owner", "manager", "cashier"].includes(role);
  const [orders, setOrders] = useState<DeliveryOrder[]>(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const past = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  async function assign(order: DeliveryOrder, deliveryPersonId: string) {
    setBusy(order.id);
    setError(null);
    const { error: err } = await supabase.rpc("assign_delivery", {
      p_order_id: order.id,
      p_delivery_person_id: deliveryPersonId || null,
    });
    if (err) {
      setError(getErrorMessage(err, "Unable to assign this delivery."));
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, delivery_person_id: deliveryPersonId || null } : o))
      );
    }
    setBusy(null);
  }

  async function updateStatus(order: DeliveryOrder, status: OrderStatus) {
    setBusy(order.id);
    setError(null);
    const { error: err } = await supabase.rpc("update_order_status", {
      p_order_id: order.id,
      p_new_status: status,
    });
    if (err) {
      setError(getErrorMessage(err, "Unable to update this delivery."));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    }
    setBusy(null);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold mb-1">Deliveries</h1>
      <p className="text-sm text-muted mb-6">Assign drivers and track delivery orders.</p>

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {active.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-muted text-sm mb-6">
          <Bike className="mx-auto mb-3" size={26} />
          No active deliveries.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {active.map((order) => (
            <div key={order.id} className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{order.order_number}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary-dark capitalize">
                  {order.status.replace("_", " ")}
                </span>
              </div>
              {order.customers?.name && <p className="text-sm mb-1">{order.customers.name}</p>}
              {order.customers?.phone && (
                <p className="text-xs text-muted flex items-center gap-1 mb-1">
                  <Phone size={11} /> {order.customers.phone}
                </p>
              )}
              {order.delivery_address && (
                <p className="text-xs text-muted flex items-center gap-1 mb-3">
                  <MapPin size={11} /> {order.delivery_address}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">
                  {currency} {order.total.toLocaleString()}
                </span>

                {canAssign && (
                  <select
                    value={order.delivery_person_id ?? ""}
                    onChange={(e) => assign(order, e.target.value)}
                    disabled={busy === order.id}
                    className="text-xs rounded-lg border border-border px-2 py-1.5 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {deliveryStaff.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}

                {order.status === "ready" && (
                  <button
                    disabled={busy === order.id}
                    onClick={() => updateStatus(order, "out_for_delivery")}
                    className="text-xs font-medium bg-primary-light text-primary-dark px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition disabled:opacity-50"
                  >
                    Out for delivery
                  </button>
                )}
                {order.status === "out_for_delivery" && (
                  <button
                    disabled={busy === order.id}
                    onClick={() => updateStatus(order, "completed")}
                    className="text-xs font-medium bg-primary-light text-primary-dark px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition disabled:opacity-50"
                  >
                    Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Recent</p>
          <div className="space-y-1.5">
            {past.slice(0, 10).map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm bg-surface border border-border rounded-xl px-4 py-2.5">
                <span>{order.order_number}</span>
                <span className="text-muted capitalize">{order.status}</span>
                <span className="font-medium">
                  {currency} {order.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
