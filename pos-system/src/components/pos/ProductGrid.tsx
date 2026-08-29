"use client";

import { Plus, Minus, ImageOff } from "lucide-react";

export interface ProductCardItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  available: boolean;
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
        return (
          <div
            key={item.id}
            className={`bg-surface rounded-2xl border p-2.5 flex flex-col transition ${
              qty > 0 ? "border-primary ring-1 ring-primary/40" : "border-border"
            } ${!item.available ? "opacity-50" : ""}`}
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
            </div>
            <p className="text-sm font-medium leading-tight line-clamp-2 min-h-9">{item.name}</p>
            <p className="text-primary font-semibold text-sm mt-1 mb-2">
              {currency} {item.price.toLocaleString()}
            </p>

            {qty === 0 ? (
              <button
                disabled={!item.available}
                onClick={() => onAdd(item)}
                className="mt-auto w-full bg-primary-light text-primary-dark text-xs font-semibold py-2 rounded-full hover:bg-primary hover:text-white transition disabled:opacity-50"
              >
                {item.available ? "Add to Dish" : "Unavailable"}
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
                  onClick={() => onIncrement(item.id)}
                  className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white"
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
