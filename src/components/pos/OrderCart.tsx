"use client";

import { Banknote, CreditCard, QrCode, Plus, Minus, X, Percent } from "lucide-react";
import type { CartLine, OrderType, PaymentMethod } from "@/types/database.types";
import CustomerPicker, { CustomerOption } from "@/components/pos/CustomerPicker";

export interface TableOption {
  id: string;
  table_number: string;
  status: string;
}

export default function OrderCart({
  orderType,
  onOrderTypeChange,
  tables,
  selectedTableId,
  onSelectTable,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  customerName,
  onCustomerName,
  customerPhone,
  onCustomerPhone,
  deliveryAddress,
  onDeliveryAddress,
  cart,
  onIncrement,
  onDecrement,
  onRemove,
  currency,
  discount,
  onDiscountChange,
  deliveryFee,
  taxRate,
  paymentMethod,
  onPaymentMethod,
  onPlaceOrder,
  placing,
}: {
  orderType: OrderType;
  onOrderTypeChange: (t: OrderType) => void;
  tables: TableOption[];
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  customers: CustomerOption[];
  selectedCustomerId: string | null;
  onSelectCustomer: (c: CustomerOption | null) => void;
  customerName: string;
  onCustomerName: (v: string) => void;
  customerPhone: string;
  onCustomerPhone: (v: string) => void;
  deliveryAddress: string;
  onDeliveryAddress: (v: string) => void;
  cart: CartLine[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  currency: string;
  discount: number;
  onDiscountChange: (v: number) => void;
  deliveryFee: number;
  taxRate: number;
  paymentMethod: PaymentMethod;
  onPaymentMethod: (m: PaymentMethod) => void;
  onPlaceOrder: () => void;
  placing: boolean;
}) {
  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = Math.max(0, (subtotal - discount) * (taxRate / 100));
  const total = Math.max(0, subtotal - discount + tax + (orderType === "delivery" ? deliveryFee : 0));

  return (
    <aside className="w-full max-w-sm shrink-0 bg-surface border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <p className="font-semibold text-sm">
          {orderType === "dine_in" && selectedTableId
            ? `Table ${tables.find((t) => t.id === selectedTableId)?.table_number ?? ""}`
            : orderType === "takeaway"
            ? "Takeaway order"
            : "Delivery order"}
        </p>
        <div className="flex mt-3 bg-background rounded-full p-1 text-xs font-medium">
          {(["dine_in", "takeaway", "delivery"] as OrderType[]).map((t) => (
            <button
              key={t}
              onClick={() => onOrderTypeChange(t)}
              className={`flex-1 py-1.5 rounded-full transition ${
                orderType === t ? "bg-primary text-white" : "text-muted"
              }`}
            >
              {t === "dine_in" ? "Dine in" : t === "takeaway" ? "Take Away" : "Delivery"}
            </button>
          ))}
        </div>

        {orderType === "dine_in" && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTable(t.id)}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  selectedTableId === t.id
                    ? "bg-primary text-white border-primary"
                    : t.status === "occupied"
                    ? "border-warning text-warning"
                    : "border-border text-muted"
                }`}
              >
                {t.table_number}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          <CustomerPicker
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            name={customerName}
            phone={customerPhone}
            onSelectExisting={(c) => {
              onSelectCustomer(c);
              onCustomerName(c.name ?? "");
              onCustomerPhone(c.phone ?? "");
            }}
            onNameChange={onCustomerName}
            onPhoneChange={onCustomerPhone}
            onClear={() => onSelectCustomer(null)}
            placeholderName={orderType === "dine_in" ? "Walk-in customer (optional)" : "Customer name"}
          />
        </div>

        {orderType === "delivery" && (
          <div className="mt-2">
            <input
              placeholder="Delivery address"
              value={deliveryAddress}
              onChange={(e) => onDeliveryAddress(e.target.value)}
              className="w-full text-xs rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {cart.length === 0 && (
          <p className="text-sm text-muted text-center py-10">Cart is empty. Tap items to add them.</p>
        )}
        {cart.map((line) => (
          <div key={line.menu_item_id} className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{line.name}</p>
              {line.note && <p className="text-xs text-muted truncate">Note: {line.note}</p>}
              <p className="text-xs text-primary font-semibold">
                {currency} {(line.price * line.quantity).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onDecrement(line.menu_item_id)}
                className="h-6 w-6 rounded-full border border-border flex items-center justify-center"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm w-4 text-center">{line.quantity}</span>
              <button
                onClick={() => onIncrement(line.menu_item_id)}
                className="h-6 w-6 rounded-full border border-border flex items-center justify-center"
              >
                <Plus size={12} />
              </button>
              <button onClick={() => onRemove(line.menu_item_id)} className="text-muted hover:text-danger ml-1">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Sub Total</span>
          <span className="font-medium">
            {currency} {subtotal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted flex items-center gap-1">
            <Percent size={12} /> Discount
          </span>
          <input
            type="number"
            min={0}
            value={discount || ""}
            onChange={(e) => onDiscountChange(Math.max(0, Number(e.target.value) || 0))}
            placeholder="0"
            className="w-20 text-right text-sm rounded-md border border-border px-2 py-0.5 outline-none"
          />
        </div>
        {taxRate > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Tax {taxRate}%</span>
            <span className="font-medium">
              {currency} {tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {orderType === "delivery" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Delivery fee</span>
            <span className="font-medium">
              {currency} {deliveryFee.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-base font-bold pt-1 border-t border-border">
          <span>Total Amount</span>
          <span>
            {currency} {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          {(
            [
              { m: "cash" as PaymentMethod, label: "Cash", icon: Banknote },
              { m: "card" as PaymentMethod, label: "Credit/Debit", icon: CreditCard },
              { m: "mobile_money" as PaymentMethod, label: "Mobile", icon: QrCode },
            ] as const
          ).map(({ m, label, icon: Icon }) => (
            <button
              key={m}
              onClick={() => onPaymentMethod(m)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition ${
                paymentMethod === m ? "border-primary bg-primary-light text-primary-dark" : "border-border text-muted"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <button
          disabled={cart.length === 0 || placing || (orderType === "dine_in" && !selectedTableId)}
          onClick={onPlaceOrder}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-2"
        >
          {placing ? "Placing order…" : "Place Order"}
        </button>
      </div>
    </aside>
  );
}
