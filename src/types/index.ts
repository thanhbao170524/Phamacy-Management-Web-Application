export enum UserRole {
  ADMIN = "admin",
  SALES_STAFF = "sales_staff",
  INVENTORY_STAFF = "inventory_staff",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Medicine {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  expiryDate: string;
  stockAlert: number;
  barcode?: string;
  manufacturer?: string;
}

export interface InventoryRecord {
  id: string;
  medicineId: string;
  medicine?: Medicine;
  type: "import" | "export";
  quantity: number;
  date: string;
  notes?: string;
}

export interface Sale {
  id: string;
  customerId?: string;
  customer?: Member;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  date: string;
  staffId: string;
  staffName?: string;
}

export interface SaleItem {
  medicineId: string;
  medicine?: Medicine;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Alert {
  id: string;
  type: "expiry" | "low_stock" | "system";
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  date: string;
  read: boolean;
}

export interface Report {
  id: string;
  type: "sales" | "inventory" | "expiry";
  title: string;
  data: any;
  date: string;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone: string;
  level: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  medicineCount: number;
}