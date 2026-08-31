"use client";

import { useState } from "react";
import { Plus, X, ChefHat, Archive, PackageCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { MenuItemFull, RecipeLine } from "@/types/database.types";

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}
interface InventoryOption {
  id: string;
  name: string;
  unit: string;
  quantity_on_hand: number;
}

export default function MenuClient({
  businessId,
  currency,
  role,
  categories,
  initialItems,
  inventoryItems,
}: {
  businessId: string;
  currency: string;
  role: string;
  categories: CategoryRow[];
  initialItems: MenuItemFull[];
  inventoryItems: InventoryOption[];
}) {
  const supabase = createClient();
  const canManage = role === "owner" || role === "manager";

  const [items, setItems] = useState<MenuItemFull[]>(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [recipeItem, setRecipeItem] = useState<MenuItemFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  async function toggleAvailable(item: MenuItemFull) {
    const { error: err } = await supabase
      .from("menu_items")
      .update({ available: !item.available })
      .eq("id", item.id);
    if (err) {
      setError(getErrorMessage(err, "Unable to update availability."));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i)));
  }

  async function archiveItem(item: MenuItemFull) {
    if (!confirm(`Archive "${item.name}"? Past orders keep referencing it, but it disappears from the POS.`)) return;
    const { error: err } = await supabase.from("menu_items").update({ is_archived: true }).eq("id", item.id);
    if (err) {
      setError(getErrorMessage(err, "Unable to archive this item."));
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function deleteItem(item: MenuItemFull) {
    if (!confirm(`Permanently delete "${item.name}"? A backup copy is kept, but it will disappear everywhere immediately.`))
      return;
    const { error: err } = await supabase.rpc("delete_menu_item", { p_id: item.id });
    if (err) {
      setError(getErrorMessage(err, "Unable to delete this item."));
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Menu</h1>
          <p className="text-sm text-muted">
            A dish only shows up on the POS once it&apos;s linked to real inventory — click <strong>Recipe</strong> to connect it, and selling it will automatically deduct stock.
          </p>
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

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {items.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-muted text-sm">
          No menu items yet. Add your first dish to get started.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Available</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted">{categoryName(item.category_id)}</td>
                  <td className="px-4 py-3">
                    {currency} {item.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={!canManage}
                      onClick={() => toggleAvailable(item)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        item.available ? "bg-primary-light text-primary-dark" : "bg-red-50 text-danger"
                      } disabled:opacity-60`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setRecipeItem(item)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-dark hover:underline"
                      >
                        <ChefHat size={13} /> Recipe
                      </button>
                      <button
                        onClick={() => archiveItem(item)}
                        className="text-muted hover:text-foreground p-1 align-middle"
                        aria-label="Archive"
                        title="Archive"
                      >
                        <Archive size={13} className="inline" />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="text-muted hover:text-danger p-1 align-middle"
                        aria-label="Delete"
                        title="Delete permanently"
                      >
                        <Trash2 size={13} className="inline" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddMenuItemModal
          businessId={businessId}
          categories={categories}
          onClose={() => setShowAdd(false)}
          onCreated={(item) => {
            setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
            setShowAdd(false);
          }}
        />
      )}

      {recipeItem && (
        <RecipeModal
          businessId={businessId}
          menuItem={recipeItem}
          inventoryItems={inventoryItems}
          onClose={() => setRecipeItem(null)}
        />
      )}
    </div>
  );
}

function AddMenuItemModal({
  businessId,
  categories,
  onClose,
  onCreated,
}: {
  businessId: string;
  categories: CategoryRow[];
  onClose: () => void;
  onCreated: (item: MenuItemFull) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("0");
  const [prepTime, setPrepTime] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("menu_items")
        .insert({
          business_id: businessId,
          category_id: categoryId || null,
          name,
          price: Number(price) || 0,
          cost_price: Number(cost) || 0,
          prep_time_minutes: Number(prepTime) || null,
        })
        .select("id, business_id, category_id, name, description, price, cost_price, available, is_archived, prep_time_minutes")
        .single();
      if (err) throw err;
      onCreated(data as MenuItemFull);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add this menu item."));
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
        <h3 className="font-semibold text-lg mb-4">Add menu item</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Cost price</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Prep time (minutes)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <button
          disabled={!name || !price || saving}
          onClick={handleSave}
          className="w-full mt-5 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add item"}
        </button>
      </div>
    </div>
  );
}

function RecipeModal({
  businessId,
  menuItem,
  inventoryItems,
  onClose,
}: {
  businessId: string;
  menuItem: MenuItemFull;
  inventoryItems: InventoryOption[];
  onClose: () => void;
}) {
  const supabase = createClient();
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    supabase
      .from("menu_item_ingredients")
      .select("inventory_item_id, quantity_required")
      .eq("menu_item_id", menuItem.id)
      .then(({ data }: { data: RecipeLine[] | null }) => {
        setLines(data ?? []);
        setLoading(false);
      });
  }

  function addLine(inventoryItemId: string) {
    if (!inventoryItemId) return;
    setLines((prev) => [...prev, { inventory_item_id: inventoryItemId, quantity_required: 1 }]);
  }

  function updateLine(index: number, patch: Partial<RecipeLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from("menu_item_ingredients")
        .delete()
        .eq("menu_item_id", menuItem.id);
      if (delErr) throw delErr;

      const validLines = lines.filter((l) => l.inventory_item_id && l.quantity_required > 0);
      if (validLines.length > 0) {
        const { error: insErr } = await supabase.from("menu_item_ingredients").insert(
          validLines.map((l) => ({
            business_id: businessId,
            menu_item_id: menuItem.id,
            inventory_item_id: l.inventory_item_id,
            quantity_required: l.quantity_required,
          }))
        );
        if (insErr) throw insErr;
      }
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save this recipe."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-1">Recipe for {menuItem.name}</h3>
        <p className="text-xs text-muted mb-4 flex items-center gap-1">
          <PackageCheck size={13} /> Selling this dish will auto-deduct these ingredients. Quantity is how much
          <strong> one sale</strong> uses — not your total stock.
        </p>

        {loading ? (
          <p className="text-sm text-muted py-6 text-center">Loading…</p>
        ) : inventoryItems.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">
            No inventory items yet — add some on the Inventory page first.
          </p>
        ) : (
          <div className="space-y-3">
            {lines.map((line, idx) => {
              const invItem = inventoryItems.find((i) => i.id === line.inventory_item_id);
              const usedElsewhere = new Set(lines.filter((_, i) => i !== idx).map((l) => l.inventory_item_id));
              return (
                <div key={idx}>
                  <div className="flex items-center gap-2">
                    <select
                      value={line.inventory_item_id}
                      onChange={(e) => updateLine(idx, { inventory_item_id: e.target.value })}
                      className="flex-1 rounded-lg border border-border px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {inventoryItems
                        .filter((i) => i.id === line.inventory_item_id || !usedElsewhere.has(i.id))
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} — {i.quantity_on_hand.toLocaleString()} {i.unit} in stock
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.quantity_required}
                      onChange={(e) => updateLine(idx, { quantity_required: Number(e.target.value) || 0 })}
                      className="w-20 rounded-lg border border-border px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-muted w-8">{invItem?.unit}</span>
                    <button onClick={() => removeLine(idx)} className="text-muted hover:text-danger p-1">
                      <X size={13} />
                    </button>
                  </div>
                  {invItem && (
                    <p className="text-[11px] text-muted mt-1 ml-0.5">
                      Uses {line.quantity_required || 0} {invItem.unit} per sale · {invItem.quantity_on_hand.toLocaleString()}{" "}
                      {invItem.unit} currently in stock → sellable{" "}
                      <strong>
                        {line.quantity_required > 0 ? Math.floor(invItem.quantity_on_hand / line.quantity_required) : 0}
                      </strong>{" "}
                      more times
                    </p>
                  )}
                </div>
              );
            })}

            {lines.length < inventoryItems.length && (
              <select
                value=""
                onChange={(e) => addLine(e.target.value)}
                className="w-full text-xs font-medium text-primary-dark border border-dashed border-primary/40 rounded-lg px-2 py-2 outline-none bg-primary-light/40"
              >
                <option value="">+ Add ingredient…</option>
                {inventoryItems
                  .filter((i) => !lines.some((l) => l.inventory_item_id === i.id))
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {i.quantity_on_hand.toLocaleString()} {i.unit} in stock
                    </option>
                  ))}
              </select>
            )}

            {lines.length === 0 && (
              <p className="text-xs text-muted">
                No ingredients linked yet — this dish won&apos;t appear on the POS until you add at least one.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <button
          disabled={saving || loading}
          onClick={handleSave}
          className="w-full mt-5 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save recipe"}
        </button>
      </div>
    </div>
  );
}
