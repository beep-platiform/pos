"use client";

import { useMemo, useState } from "react";
import { Plus, PackageSearch, AlertTriangle, X, History, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { InventoryItem, InventoryMovement } from "@/types/database.types";

const UNITS = ["kg", "g", "l", "ml", "pcs", "unit", "box", "pack"];
const MOVEMENT_LABELS: Record<InventoryMovement, string> = {
  purchase: "Purchase (stock in)",
  return: "Return (stock in)",
  initial_stock: "Initial stock",
  waste: "Waste / spoilage",
  adjustment: "Manual adjustment",
  transfer: "Transfer out",
  sale: "Sale (auto)",
};

function statusOf(item: InventoryItem): "out" | "low" | "normal" {
  if (item.quantity_on_hand <= 0) return "out";
  if (item.quantity_on_hand <= item.min_quantity) return "low";
  return "normal";
}

export default function InventoryClient({
  businessId,
  currency,
  role,
  initialItems,
}: {
  businessId: string;
  currency: string;
  role: string;
  initialItems: InventoryItem[];
}) {
  const supabase = createClient();
  const canManage = role === "owner" || role === "manager";

  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lowStockCount = useMemo(() => items.filter((i) => statusOf(i) !== "normal").length, [items]);
  const stockValue = useMemo(
    () => items.reduce((s, i) => s + i.quantity_on_hand * (i.cost_per_unit ?? 0), 0),
    [items]
  );

  async function archiveItem(item: InventoryItem) {
    if (!confirm(`Archive "${item.name}"? It will disappear from this list but its history is kept.`)) return;
    const { error: err } = await supabase.from("inventory_items").update({ is_archived: true }).eq("id", item.id);
    if (err) {
      setError(getErrorMessage(err, "Unable to archive this item."));
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Inventory</h1>
          <p className="text-sm text-muted">Live stock levels — every change is recorded as a movement.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
          >
            <Plus size={16} /> Add item
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">Items tracked</p>
          <p className="text-xl font-bold">{items.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">Low / out of stock</p>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? "text-danger" : ""}`}>{lowStockCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted mb-1">Stock value</p>
          <p className="text-xl font-bold">
            {currency} {stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
      )}

      {items.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-muted">
          <PackageSearch className="mx-auto mb-3" size={28} />
          <p className="text-sm">No inventory items yet. Add ingredients or stock items to start tracking.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Min</th>
                <th className="px-4 py-3 font-medium">Cost/unit</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = statusOf(item);
                return (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      {item.quantity_on_hand.toLocaleString(undefined, { maximumFractionDigits: 3 })} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.min_quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {currency} {(item.cost_per_unit ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.supplier_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          status === "out"
                            ? "bg-red-50 text-danger"
                            : status === "low"
                            ? "bg-orange-50 text-warning"
                            : "bg-primary-light text-primary-dark"
                        }`}
                      >
                        {status !== "normal" && <AlertTriangle size={11} />}
                        {status === "out" ? "Out of stock" : status === "low" ? "Low stock" : "Normal"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setAdjustingItem(item)}
                          className="text-xs font-medium text-primary-dark hover:underline"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => archiveItem(item)}
                          className="text-xs text-muted hover:text-danger p-1 align-middle"
                          aria-label="Archive"
                        >
                          <Archive size={13} className="inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddItemModal
          businessId={businessId}
          onClose={() => setShowAdd(false)}
          onCreated={(item) => {
            setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
            setShowAdd(false);
          }}
        />
      )}

      {adjustingItem && (
        <AdjustStockModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onAdjusted={(newQty) => {
            setItems((prev) =>
              prev.map((i) => (i.id === adjustingItem.id ? { ...i, quantity_on_hand: newQty } : i))
            );
            setAdjustingItem(null);
          }}
        />
      )}
    </div>
  );
}

function AddItemModal({
  businessId,
  onClose,
  onCreated,
}: {
  businessId: string;
  onClose: () => void;
  onCreated: (item: InventoryItem) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [cost, setCost] = useState("0");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("inventory_items")
        .insert({
          business_id: businessId,
          name,
          unit,
          quantity_on_hand: Number(quantity) || 0,
          min_quantity: Number(minQuantity) || 0,
          cost_per_unit: Number(cost) || 0,
          supplier_name: supplier || null,
        })
        .select("id, business_id, name, unit, quantity_on_hand, min_quantity, cost_per_unit, supplier_name, is_archived, updated_at")
        .single();
      if (err) throw err;
      onCreated(data as InventoryItem);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add this item. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-4">Add inventory item</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chicken, Tomatoes, Bread…"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Starting quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Minimum quantity</label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Cost per unit</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Supplier (optional)</label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <button
          disabled={!name || saving}
          onClick={handleSave}
          className="w-full mt-5 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add item"}
        </button>
      </div>
    </div>
  );
}

function AdjustStockModal({
  item,
  onClose,
  onAdjusted,
}: {
  item: InventoryItem;
  onClose: () => void;
  onAdjusted: (newQuantity: number) => void;
}) {
  const supabase = createClient();
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [movementType, setMovementType] = useState<InventoryMovement>("purchase");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inTypes: InventoryMovement[] = ["purchase", "return", "initial_stock", "adjustment"];
  const outTypes: InventoryMovement[] = ["waste", "transfer", "adjustment"];

  async function handleSave() {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const delta = direction === "in" ? parsed : -parsed;
      const { data, error: err } = await supabase.rpc("adjust_inventory", {
        p_inventory_item_id: item.id,
        p_quantity_change: delta,
        p_movement_type: movementType,
        p_reason: reason || null,
      });
      if (err) throw err;
      const result = Array.isArray(data) ? data[0] : data;
      onAdjusted(Number(result?.new_quantity ?? item.quantity_on_hand));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to adjust stock. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-1">Adjust stock</h3>
        <p className="text-sm text-muted mb-4">
          {item.name} — currently {item.quantity_on_hand.toLocaleString()} {item.unit}
        </p>

        <div className="flex bg-background rounded-full p-1 text-sm font-medium mb-4">
          <button
            onClick={() => {
              setDirection("in");
              setMovementType("purchase");
            }}
            className={`flex-1 py-1.5 rounded-full transition ${
              direction === "in" ? "bg-primary text-white" : "text-muted"
            }`}
          >
            Stock in
          </button>
          <button
            onClick={() => {
              setDirection("out");
              setMovementType("waste");
            }}
            className={`flex-1 py-1.5 rounded-full transition ${
              direction === "out" ? "bg-danger text-white" : "text-muted"
            }`}
          >
            Stock out
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Reason</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as InventoryMovement)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            >
              {(direction === "in" ? inTypes : outTypes).map((t) => (
                <option key={t} value={t}>
                  {MOVEMENT_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Quantity ({item.unit})</label>
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Note (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={direction === "in" ? "e.g. delivery from supplier" : "e.g. spoiled, dropped"}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <button
          disabled={saving}
          onClick={handleSave}
          className={`w-full mt-5 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 ${
            direction === "in" ? "bg-primary hover:bg-primary-dark" : "bg-danger hover:opacity-90"
          }`}
        >
          {saving ? "Saving…" : direction === "in" ? "Add to stock" : "Remove from stock"}
        </button>

        <p className="text-[11px] text-muted mt-3 flex items-center gap-1">
          <History size={11} /> Every adjustment is logged and can be reviewed later.
        </p>
      </div>
    </div>
  );
}
