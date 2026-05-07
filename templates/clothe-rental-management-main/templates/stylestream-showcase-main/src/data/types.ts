export type ItemStatus = 'READY' | 'RESERVED' | 'ON_RENT' | 'LAUNDRY' | 'MAINTENANCE' | 'DAMAGED' | 'LOST' | 'RETIRED';
export type OrderStatus = 'DRAFT' | 'RESERVED' | 'CONFIRMED' | 'PICKED_UP' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  description: string;
  tags: string[];
  gradient: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  status: ItemStatus;
  condition: string;
  lastUpdated: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  itemId: string;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  deposit: number;
  rentalStart: string;
  rentalEnd: string;
  createdAt: string;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vip: boolean;
  blacklisted: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  type: 'DEPOSIT' | 'RENTAL' | 'REFUND' | 'PENALTY';
  method: 'CASH' | 'TRANSFER' | 'CARD';
  date: string;
  note: string;
}
