"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { TableStatus } from "@/types/database.types";

interface TableRow {
  id: string;
  table_number: string;
  seats: number | null;
  status: TableStatus;
  current_order_id: string | null;
}
interface OrderSummary {
  order_number: string;
  total: number;
  status: string;
  order_type: string;
}

const STATUS_STYLES: Record<TableStatus, string> = {
  available: "bg-primary-light border-primary/30 text-primary-dark",
  occupied: "bg-orange-50 border-warning/40 text-warning",
  reserved: "bg-blue-50 border-blue-300 text-blue-700",
  cleaning: "bg-gray-100 border-gray-300 text-gray-500",
};

const STATUS_OPTIONS: TableStatus[] = ["available", "occupied", "reserved", "cleaning"];

export default function TablesClient({
  businessId,
  currency,
  role,
  initialTables,
  ordersById,
}: {
  businessId: string;
  currency: string;
  role: string;
  initialTables: TableRow[];
  ordersById: Record<string, OrderSummary>;
}) {
  const supabase = createClient();
  const canManage = ["owner", "manager", "cashier", "waiter"].includes(role);

  const [tables, setTables] = useState<TableRow[]>(initialTables);
  const [selected, setSelected] = useState<TableRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(table: TableRow, status: TableStatus) {
    const { error: err } = await supabase.from("restaurant_tables").update({ status }).eq("id", table.id);
    if (err) {
      setError(getErrorMessage(err, "Unable to update table status."));
      return;
    }
    setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status } : t)));
    setSelected((prev) => (prev && prev.id === table.id ? { ...prev, status } : prev));
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Tables</h1>
          <p className="text-sm text-muted">Tap a table to see its order or change its status.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
          >
            <Plus size={16} /> Add table
          </button>
        )}
      </div>

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {tables.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-muted text-sm">
          No tables yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tables.map((t) => {
            const order = t.current_order_id ? ordersById[t.current_order_id] : null;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`text-left rounded-2xl border-2 p-4 transition ${STATUS_STYLES[t.status]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{t.table_number}</span>
                  {t.seats && (
                    <span className="flex items-center gap-1 text-xs opacity-80">
                      <Users size={12} /> {t.seats}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium capitalize mb-1">{t.status}</p>
                {order && (
                  <div className="text-xs opacity-90 mt-2 border-t border-current/20 pt-2">
                    <p className="font-medium">{order.order_number}</p>
                    <p>
                      {currency} {order.total.toLocaleString()}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <TableDetailModal
          table={selected}
          order={selected.current_order_id ? ordersById[selected.current_order_id] : null}
          currency={currency}
          canManage={canManage}
          onSetStatus={(status) => setStatus(selected, status)}
          onClose={() => setSelected(null)}
        />
      )}

      {showAdd && (
        <AddTableModal
          businessId={businessId}
          onClose={() => setShowAdd(false)}
          onCreated={(table) => {
            setTables((prev) => [...prev, table].sort((a, b) => a.table_number.localeCompare(b.table_number)));
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function TableDetailModal({
  table,
  order,
  currency,
  canManage,
  onSetStatus,
  onClose,
}: {
  table: TableRow;
  order: OrderSummary | null;
  currency: string;
  canManage: boolean;
  onSetStatus: (status: TableStatus) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-1">Table {table.table_number}</h3>
        <p className="text-sm text-muted capitalize mb-4">{table.status}</p>

        {order ? (
          <div className="bg-background rounded-xl p-4 mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted">Order</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-muted">Status</span>
              <span className="font-medium capitalize">{order.status.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total</span>
              <span className="font-semibold">
                {currency} {order.total.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted mb-4">No active order at this table.</p>
        )}

        {canManage && (
          <>
            <Link
              href={`/pos?table=${table.id}`}
              className="block text-center w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg mb-3"
            >
              {order ? "Add items in POS" : "Start order here"}
            </Link>

            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Set status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSetStatus(s)}
                  className={`text-xs font-medium py-2 rounded-lg border capitalize ${
                    table.status === s ? "bg-primary text-white border-primary" : "border-border text-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddTableModal({
  businessId,
  onClose,
  onCreated,
}: {
  businessId: string;
  onClose: () => void;
  onCreated: (table: TableRow) => void;
}) {
  const supabase = createClient();
  const [tableNumber, setTableNumber] = useState("");
  const [seats, setSeats] = useState("4");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("restaurant_tables")
        .insert({ business_id: businessId, table_number: tableNumber, seats: Number(seats) || 4 })
        .select("id, table_number, seats, status, current_order_id")
        .single();
      if (err) throw err;
      onCreated(data as TableRow);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add this table."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-xs p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-4">Add table</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Table number / name</label>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="T7"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Seats</label>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <button
          disabled={!tableNumber || saving}
          onClick={handleSave}
          className="w-full mt-5 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add table"}
        </button>
      </div>
    </div>
  );
}
