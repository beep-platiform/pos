"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Table2,
  Bike,
  UtensilsCrossed,
  Boxes,
  Truck,
  Users,
  Receipt,
  Wallet,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS: { key: string; label: string; href: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { key: "pos", label: "POS / Sell", href: "/pos", icon: ShoppingCart },
  { key: "orders", label: "Orders", href: "/orders", icon: ClipboardList },
  { key: "kitchen", label: "Kitchen", href: "/kitchen", icon: ChefHat },
  { key: "tables", label: "Tables", href: "/tables", icon: Table2 },
  { key: "deliveries", label: "Deliveries", href: "/deliveries", icon: Bike },
  { key: "menu", label: "Menu", href: "/menu", icon: UtensilsCrossed },
  { key: "inventory", label: "Inventory", href: "/inventory", icon: Boxes },
  { key: "purchases", label: "Purchases", href: "/purchases", icon: Truck },
  { key: "customers", label: "Customers", href: "/customers", icon: Users },
  { key: "expenses", label: "Expenses", href: "/expenses", icon: Receipt },
  { key: "cash-register", label: "Cash Register", href: "/cash-register", icon: Wallet },
  { key: "employees", label: "Employees", href: "/employees", icon: UserCog },
  { key: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({
  allowedKeys,
  businessName,
  fullName,
  role,
}: {
  allowedKeys: string[];
  businessName: string;
  fullName: string | null;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = NAV_ITEMS.filter((i) => allowedKeys.includes(i.key));

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
          {businessName?.[0]?.toUpperCase() ?? "P"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{businessName || "My Restaurant"}</p>
          <p className="text-[11px] text-muted capitalize">{role}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/70 hover:bg-primary-light hover:text-primary-dark"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center text-xs font-semibold">
            {(fullName || "U")[0].toUpperCase()}
          </div>
          <p className="text-sm truncate">{fullName || "Staff"}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground/70 hover:text-danger rounded-lg"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
