"use client";

import { LayoutGrid, Coffee, Soup, Pizza, Utensils, Sandwich } from "lucide-react";

const ICONS = [LayoutGrid, Coffee, Soup, Pizza, Utensils, Sandwich];

export interface CategoryOption {
  id: string;
  name: string;
  count: number;
}

export default function CategoryBar({
  categories,
  active,
  onSelect,
}: {
  categories: CategoryOption[];
  active: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-2xl border transition ${
          active === null ? "bg-primary text-white border-primary" : "bg-surface border-border text-foreground/70"
        }`}
      >
        <LayoutGrid size={20} />
        <span className="text-xs font-medium">All</span>
      </button>
      {categories.map((cat, i) => {
        const Icon = ICONS[(i + 1) % ICONS.length];
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`shrink-0 flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-2xl border transition ${
              isActive ? "bg-primary text-white border-primary" : "bg-surface border-border text-foreground/70"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium truncate max-w-16">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
