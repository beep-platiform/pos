"use client";

import { X, Printer, CheckCircle2 } from "lucide-react";
import type { CartLine, OrderType, PaymentMethod } from "@/types/database.types";

export interface ReceiptData {
  orderNumber: string;
  businessName: string;
  orderType: OrderType;
  cart: CartLine[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  currency: string;
  createdAt: string;
}

export default function ReceiptModal({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 print:bg-white">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative print:shadow-none">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground print:hidden">
          <X size={18} />
        </button>

        <div className="text-center mb-4">
          <CheckCircle2 className="mx-auto text-primary mb-2" size={32} />
          <p className="font-semibold text-lg">{data.businessName}</p>
          <p className="text-xs text-muted">Receipt #{data.orderNumber}</p>
          <p className="text-xs text-muted">{new Date(data.createdAt).toLocaleString()}</p>
          <p className="text-xs text-muted capitalize mt-1">{data.orderType.replace("_", " ")}</p>
        </div>

        <div className="border-t border-dashed border-border py-3 space-y-1.5">
          {data.cart.map((l) => (
            <div key={l.menu_item_id} className="flex justify-between text-sm">
              <span>
                {l.name} × {l.quantity}
              </span>
              <span>
                {data.currency} {(l.price * l.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-border pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{data.currency} {data.subtotal.toLocaleString()}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span>-{data.currency} {data.discount.toLocaleString()}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span>{data.currency} {data.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {data.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span>{data.currency} {data.deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-border pt-1 mt-1">
            <span>Total</span>
            <span>{data.currency} {data.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span className="capitalize">Paid via {data.paymentMethod.replace("_", " ")}</span>
            <span>{data.currency} {data.amountPaid.toLocaleString()}</span>
          </div>
          {data.change > 0 && (
            <div className="flex justify-between text-muted">
              <span>Change</span>
              <span>{data.currency} {data.change.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium"
          >
            New order
          </button>
        </div>
      </div>
    </div>
  );
}
