// Hand-written types matching the Supabase schema.
// (Run `supabase gen types typescript` later to auto-generate & replace this.)

export type UserRole = "owner" | "manager" | "cashier" | "waiter" | "kitchen" | "delivery";
export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus = "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "mobile_money" | "card" | "bank" | "credit" | "other";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  tax_rate: number;
  created_at: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  active: boolean;
}

export interface MenuCategory {
  id: string;
  business_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  image_url: string | null;
  sku: string | null;
  available: boolean;
  is_archived: boolean;
  prep_time_minutes: number | null;
}

export interface RestaurantTable {
  id: string;
  business_id: string;
  table_number: string;
  seats: number | null;
  status: TableStatus;
  current_order_id: string | null;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

export interface Order {
  id: string;
  business_id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  customer_id: string | null;
  waiter_id: string | null;
  cashier_id: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  note: string | null;
  subtotal: number;
}

export interface Payment {
  id: string;
  business_id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  change_given: number | null;
  created_at: string;
}

// Cart line item used client-side before checkout
export interface CartLine {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}



export type InventoryMovement =
  | "purchase"
  | "sale"
  | "return"
  | "waste"
  | "adjustment"
  | "transfer"
  | "initial_stock";

export interface InventoryItem {
  id: string;
  business_id: string;
  name: string;
  unit: string;
  quantity_on_hand: number;
  min_quantity: number;
  cost_per_unit: number | null;
  supplier_name: string | null;
  is_archived: boolean;
  updated_at: string;
}

export interface MenuItemFull {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  available: boolean;
  is_archived: boolean;
  prep_time_minutes: number | null;
}

export interface RecipeLine {
  inventory_item_id: string;
  quantity_required: number;
}

export interface OrderRow {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  customer_id: string | null;
  delivery_person_id: string | null;
  delivery_address: string | null;
  total: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  name_snapshot: string;
  quantity: number;
  price_snapshot: number;
  note: string | null;
}

export interface StaffMember {
  id: string;
  user_id: string;
  role: UserRole;
  active: boolean;
  email: string | null;
  full_name: string | null;
}
