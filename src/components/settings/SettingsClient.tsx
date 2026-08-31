"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";

interface Business {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  tax_rate: number;
}

export default function SettingsClient({ business }: { business: Business }) {
  const supabase = createClient();
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone ?? "");
  const [email, setEmail] = useState(business.email ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [currency, setCurrency] = useState(business.currency);
  const [taxRate, setTaxRate] = useState(String(business.tax_rate));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { error: err } = await supabase
        .from("businesses")
        .update({
          name,
          phone: phone || null,
          email: email || null,
          address: address || null,
          currency,
          tax_rate: Number(taxRate) || 0,
        })
        .eq("id", business.id);
      if (err) throw err;
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save your settings."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted mb-6">Business details used across receipts and reports.</p>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/80">Restaurant name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground/80">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground/80">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground/80">Currency</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80">Tax rate (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && (
          <p className="text-sm text-primary-dark flex items-center gap-1.5">
            <Check size={14} /> Saved.
          </p>
        )}

        <button
          disabled={saving || !name}
          onClick={handleSave}
          className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
