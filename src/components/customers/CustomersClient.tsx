"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X, Users, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}
interface Stat {
  totalSpent: number;
  orderCount: number;
  lastOrderAt: string;
  outstanding: number;
}

export default function CustomersClient({
  businessId,
  currency,
  initialCustomers,
  stats,
}: {
  businessId: string;
  currency: string;
  initialCustomers: Customer[];
  stats: Record<string, Stat>;
}) {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => (c.name ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q)
    );
  }, [customers, search]);

  async function deleteCustomer(c: Customer) {
    if (!confirm(`Delete ${c.name || "this customer"}? A backup copy is kept, but they'll disappear from this list.`))
      return;
    const { error: err } = await supabase.rpc("delete_customer", { p_id: c.id });
    if (err) {
      setError(getErrorMessage(err, "Unable to delete this customer."));
      return;
    }
    setCustomers((prev) => prev.filter((x) => x.id !== c.id));
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Customers</h1>
          <p className="text-sm text-muted">Everyone who&apos;s ordered, with spend and outstanding balance.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} /> Add customer
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or phone…"
          className="w-full bg-surface border border-border rounded-full pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-muted text-sm">
          <Users className="mx-auto mb-3" size={26} />
          No customers yet.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Total spent</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const s = stats[c.id];
                return (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{c.name || "Unnamed"}</td>
                    <td className="px-4 py-3 text-muted">{c.phone || "—"}</td>
                    <td className="px-4 py-3">{s?.orderCount ?? 0}</td>
                    <td className="px-4 py-3">
                      {currency} {(s?.totalSpent ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {s && s.outstanding > 0 ? (
                        <span className="text-danger font-medium">
                          {currency} {s.outstanding.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteCustomer(c)}
                        className="text-muted hover:text-danger p-1"
                        aria-label="Delete"
                        title="Delete permanently"
                      >
                        <Trash2 size={13} className="inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddCustomerModal
          businessId={businessId}
          onClose={() => setShowAdd(false)}
          onCreated={(c) => {
            setCustomers((prev) => [c, ...prev]);
            setShowAdd(false);
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function AddCustomerModal({
  businessId,
  onClose,
  onCreated,
  onError,
}: {
  businessId: string;
  onClose: () => void;
  onCreated: (c: Customer) => void;
  onError: (msg: string) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setLocalError(null);
    try {
      const { data, error: err } = await supabase
        .from("customers")
        .insert({ business_id: businessId, name: name || null, phone: phone || null, address: address || null })
        .select("id, name, phone, address, notes, created_at")
        .single();
      if (err) throw err;
      onCreated(data as Customer);
    } catch (err) {
      const msg = getErrorMessage(err, "Unable to add this customer.");
      setLocalError(msg);
      onError(msg);
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
        <h3 className="font-semibold text-lg mb-4">Add customer</h3>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (optional)"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {localError && <p className="text-sm text-danger mt-3">{localError}</p>}

        <button
          disabled={(!name && !phone) || saving}
          onClick={handleSave}
          className="w-full mt-5 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add customer"}
        </button>
      </div>
    </div>
  );
}
