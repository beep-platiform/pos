"use client";

import { useMemo, useState } from "react";
import { Search, User, X, ChevronDown } from "lucide-react";

export interface CustomerOption {
  id: string;
  name: string | null;
  phone: string | null;
}

export default function CustomerPicker({
  customers,
  selectedCustomerId,
  name,
  phone,
  onSelectExisting,
  onNameChange,
  onPhoneChange,
  onClear,
  placeholderName = "Walk-in customer",
}: {
  customers: CustomerOption[];
  selectedCustomerId: string | null;
  name: string;
  phone: string;
  onSelectExisting: (c: CustomerOption) => void;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onClear: () => void;
  placeholderName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) => (c.name ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q))
      .slice(0, 8);
  }, [customers, query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <label className="text-[11px] font-medium text-muted uppercase tracking-wide">Customer</label>
        <div className="relative mt-1">
          <input
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value);
              setQuery(e.target.value);
              if (!open) setOpen(true);
              if (selectedCustomerId) onClear();
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholderName}
            className="w-full text-xs rounded-lg border border-border pl-3 pr-16 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {name && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  onNameChange("");
                  onPhoneChange("");
                  setQuery("");
                }}
                className="text-muted hover:text-danger p-1"
                aria-label="Clear customer"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-muted hover:text-foreground p-1"
              aria-label="Show recent customers"
            >
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
              <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-muted border-b border-border">
                <Search size={12} /> Frequent customers
              </div>
              {matches.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted">
                  {customers.length === 0 ? "No saved customers yet." : "No matches — type a new name to add one."}
                </p>
              )}
              {matches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectExisting(c);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-primary-light transition ${
                    selectedCustomerId === c.id ? "bg-primary-light" : ""
                  }`}
                >
                  <div className="h-6 w-6 rounded-full bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                    <User size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name || "Unnamed customer"}</p>
                    {c.phone && <p className="text-muted truncate">{c.phone}</p>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <input
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="w-full text-xs rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
