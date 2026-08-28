"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function CashModal({
  total,
  currency,
  onCancel,
  onConfirm,
}: {
  total: number;
  currency: string;
  onCancel: () => void;
  onConfirm: (tendered: number) => void;
}) {
  const [tendered, setTendered] = useState<string>("");
  const tenderedNum = Number(tendered) || 0;
  const change = tenderedNum - total;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-1">Cash payment</h3>
        <p className="text-sm text-muted mb-4">
          Total due: <span className="font-semibold text-foreground">{currency} {total.toLocaleString()}</span>
        </p>

        <label className="text-sm font-medium text-foreground/80">Amount received</label>
        <input
          type="number"
          autoFocus
          min={0}
          value={tendered}
          onChange={(e) => setTendered(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-lg outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="0"
        />

        <div className="mt-3 flex items-center justify-between text-sm bg-background rounded-lg px-3 py-2.5">
          <span className="text-muted">Change</span>
          <span className={`font-semibold ${change < 0 ? "text-danger" : "text-primary"}`}>
            {currency} {Math.max(0, change).toLocaleString()}
          </span>
        </div>

        <button
          disabled={tenderedNum < total}
          onClick={() => onConfirm(tenderedNum)}
          className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          Confirm payment
        </button>
      </div>
    </div>
  );
}
