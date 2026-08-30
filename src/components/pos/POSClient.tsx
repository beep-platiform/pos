"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import CategoryBar from "@/components/pos/CategoryBar";
import ProductGrid from "@/components/pos/ProductGrid";
import OrderCart, { TableOption } from "@/components/pos/OrderCart";
import { CustomerOption } from "@/components/pos/CustomerPicker";
import CashModal from "@/components/pos/CashModal";
import ReceiptModal, { ReceiptData } from "@/components/pos/ReceiptModal";
import type { CartLine, OrderType, PaymentMethod } from "@/types/database.types";

interface MenuItemRow {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  image_url: string | null;
  available: boolean;
}
interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export default function POSClient({
  businessId,
  businessName,
  currency,
  taxRate,
  categories,
  items,
  tables,
  customers,
  initialTableId,
}: {
  businessId: string;
  businessName: string;
  currency: string;
  taxRate: number;
  role: string;
  categories: CategoryRow[];
  items: MenuItemRow[];
  tables: TableOption[];
  customers: CustomerOption[];
  initialTableId?: string | null;
}) {
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(initialTableId ?? null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showCashModal, setShowCashModal] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchesCategory = activeCategory ? it.category_id === activeCategory : true;
      const matchesSearch = search.trim()
        ? it.name.toLowerCase().includes(search.trim().toLowerCase())
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, search]);

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    count: items.filter((i) => i.category_id === c.id).length,
  }));

  const quantities: Record<string, number> = {};
  cart.forEach((l) => (quantities[l.menu_item_id] = l.quantity));

  function addToCart(item: MenuItemRow) {
    setCart((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.id);
      if (existing) {
        return prev.map((l) => (l.menu_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }
  function increment(id: string) {
    setCart((prev) => prev.map((l) => (l.menu_item_id === id ? { ...l, quantity: l.quantity + 1 } : l)));
  }
  function decrement(id: string) {
    setCart((prev) =>
      prev
        .map((l) => (l.menu_item_id === id ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );
  }
  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.menu_item_id !== id));
  }

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = Math.max(0, (subtotal - discount) * (taxRate / 100));
  const total = Math.max(0, subtotal - discount + tax + (orderType === "delivery" ? deliveryFee : 0));

  function handlePlaceOrder() {
    setError(null);
    if (paymentMethod === "cash") {
      setShowCashModal(true);
    } else {
      finalizeSale(total, 0);
    }
  }

  async function finalizeSale(amountTendered: number, change: number) {
    setPlacing(true);
    setError(null);
    try {
      const paymentAmount = paymentMethod === "cash" ? total : amountTendered || total;

      const { data, error: rpcError } = await supabase.rpc("complete_sale", {
        p_business_id: businessId,
        p_order_type: orderType,
        p_table_id: orderType === "dine_in" ? selectedTableId : null,
        p_customer_id: null,
        p_items: cart.map((l) => ({
          menu_item_id: l.menu_item_id,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
          note: l.note ?? null,
        })),
        p_payments: [{ method: paymentMethod, amount: paymentAmount, change_given: change }],
        p_discount: discount,
        p_delivery_fee: orderType === "delivery" ? deliveryFee : 0,
        p_tax: tax,
        p_delivery_address: orderType === "delivery" ? deliveryAddress : null,
        p_delivery_notes: null,
        p_notes: null,
      });

      if (rpcError) throw rpcError;

      const result = Array.isArray(data) ? data[0] : data;

      setReceipt({
        orderId: result?.new_order_id ?? "",
        orderNumber: result?.new_order_number ?? "—",
        businessName,
        orderType,
        cart,
        subtotal,
        discount,
        tax,
        deliveryFee: orderType === "delivery" ? deliveryFee : 0,
        total,
        paymentMethod,
        amountPaid: paymentAmount,
        change,
        currency,
        createdAt: new Date().toISOString(),
      });

      // reset cart
      setCart([]);
      setDiscount(0);
      setDeliveryAddress("");
      setSelectedTableId(null);
      setShowCashModal(false);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to complete this sale. Please check your connection and try again.")
      );
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT: menu browsing */}
      <div className="flex-1 min-w-0 flex flex-col p-5 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product…"
              className="w-full bg-surface border border-border rounded-full pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
              online ? "bg-primary-light text-primary-dark" : "bg-red-50 text-danger"
            }`}
          >
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? "Online" : "Offline"}
          </div>
        </div>

        <CategoryBar categories={categoryOptions} active={activeCategory} onSelect={setActiveCategory} />

        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          <ProductGrid
            items={filteredItems.map(({ id, name, price, image_url, available }) => ({
              id,
              name,
              price,
              image_url,
              available,
            }))}
            currency={currency}
            quantities={quantities}
            onAdd={(p) => {
              const full = items.find((i) => i.id === p.id);
              if (full) addToCart(full);
            }}
            onIncrement={increment}
            onDecrement={decrement}
          />
        </div>
      </div>

      {/* RIGHT: cart & checkout */}
      <OrderCart
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        tables={tables}
        selectedTableId={selectedTableId}
        onSelectTable={setSelectedTableId}
        deliveryAddress={deliveryAddress}
        onDeliveryAddress={setDeliveryAddress}
        cart={cart}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={removeLine}
        currency={currency}
        discount={discount}
        onDiscountChange={setDiscount}
        deliveryFee={deliveryFee}
        taxRate={taxRate}
        paymentMethod={paymentMethod}
        onPaymentMethod={setPaymentMethod}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
      />

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-danger text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {showCashModal && (
        <CashModal
          total={total}
          currency={currency}
          onCancel={() => setShowCashModal(false)}
          onConfirm={(tendered) => finalizeSale(tendered, Math.max(0, tendered - total))}
        />
      )}

      {receipt && (
        <ReceiptModal
          data={receipt}
          businessId={businessId}
          customers={customers}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
