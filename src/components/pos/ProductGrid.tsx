"use client";

import { Plus, Minus, ImageOff, PackageX } from "lucide-react";

export interface ProductCardItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  available: boolean;
  inStock: boolean;
  maxQuantity: number;
}

export default function ProductGrid({
  items,
  currency,
  quantities,
  onAdd,
  onIncrement,
  onDecrement,
}: {
  items: ProductCardItem[];
  currency: string;
  quantities: Record<string, number>;
  onAdd: (item: ProductCardItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted py-20">
        <ImageOff size={28} className="mb-2" />
        <p className="text-sm">No menu items here yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const qty = quantities[item.id] ?? 0;
        const sellable = item.available && item.inStock;
        const atLimit = qty >= item.maxQuantity;
        return (
          <div
            key={item.id}
            className={`relative bg-surface rounded-2xl border p-2.5 flex flex-col transition ${
              qty > 0 ? "border-primary ring-1 ring-primary/40" : "border-border"
            } ${!sellable ? "opacity-60" : ""}`}
          >
            <div className="relative aspect-[4/3] rounded-xl bg-primary-light overflow-hidden mb-2">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-dark/40 text-3xl font-semibold">
                  {item.name[0]}
                </div>
              )}
              {!item.inStock && item.available && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="flex items-center gap-1 bg-white/95 text-danger text-[11px] font-semibold px-2 py-1 rounded-full">
                    <PackageX size={12} /> Out of stock
                  </span>
                </div>
              )}
              {item.inStock && item.maxQuantity <= 5 && (
                <span className="absolute top-1.5 right-1.5 bg-white/95 text-warning text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {item.maxQuantity} left
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-tight line-clamp-2 min-h-9">{item.name}</p>
            <p className="text-primary font-semibold text-sm mt-1 mb-2">
              {currency} {item.price.toLocaleString()}
            </p>

            {qty === 0 ? (
              <button
                disabled={!sellable}
                onClick={() => onAdd(item)}
                className="mt-auto w-full bg-primary-light text-primary-dark text-xs font-semibold py-2 rounded-full hover:bg-primary hover:text-white transition disabled:opacity-50 disabled:hover:bg-primary-light disabled:hover:text-primary-dark"
              >
                {!item.available ? "Unavailable" : !item.inStock ? "Out of stock" : "Add to Dish"}
              </button>
            ) : (
              <div className="mt-auto flex items-center justify-between bg-primary rounded-full px-1 py-1">
                <button
                  onClick={() => onDecrement(item.id)}
                  className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white"
                >
                  <Minus size={14} />
                </button>
                <span className="text-white text-sm font-semibold">{qty}</span>
                <button
                  disabled={!sellable || atLimit}
                  onClick={() => onIncrement(item.id)}
                  className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white disabled:opacity-40"
                  title={atLimit ? "No more in stock" : undefined}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
