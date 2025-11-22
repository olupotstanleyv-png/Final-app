

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  phoneNumber: string;
  // Extended Product Details
  calories?: number;
  allergens?: string[];
  ingredients?: string[];
  // Inventory & IMS
  stock: number;
  sku?: string;
  costPrice?: number; // For budgeting
  supplierId?: string;
  reorderPoint?: number; // ROP
  safetyStock?: number;
  leadTime?: number; // Days
  binLocation?: string; // e.g., "A-12-04"
}

export interface Review {
  id: string;
  itemId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  currentLat: number;
  currentLng: number;
}

export interface ProofOfDelivery {
  type: 'signature' | 'photo' | 'code';
  data: string; // Base64 string or the code verified
  timestamp: string;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  items: CartItem[];
  total: number;
  status: 'pending_approval' | 'approved' | 'cancelled' | 'completed';
  timestamp: string;
  type: OrderType;
  source?: 'web_manual' | 'web_chat' | 'whatsapp';
  
  // Payment & Delivery
  paymentMethod: 'cash' | 'card' | 'online_link';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentLink?: string;
  
  deliveryAgentId?: string;
  deliveryStatus?: 'pending' | 'preparing' | 'ready_for_logistics' | 'picking' | 'packing' | 'picked_up' | 'on_way' | 'delivered';
  deliveryLocation?: { lat: number; lng: number };
  deliveryAddress?: string;
  
  // Security & Verification
  deliveryCode?: string; // 4-Digit PIN for customer verification
  proofOfDelivery?: ProofOfDelivery;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  event: string;
  details: string;
  source: 'Bot' | 'OrderSystem' | 'Database' | 'Auth' | 'IMS';
}

export interface AnalyticsMetrics {
  conversionRate: number; // %
  abandonmentRate: number; // %
  avgResponseTime: number; // ms
  activeConversations: number;
  topIntents: { label: string; count: number }[];
  fallOffPoints: { step: string; drop: number }[];
}

export interface AppState {
  menu: MenuItem[];
  cart: { itemId: string; quantity: number }[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  modifiers?: string;
}

export type OrderType = 'delivery' | 'pickup' | 'dine-in';

export enum ProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// IMS Interfaces
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  rating: number; // 1-5
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'draft' | 'ordered' | 'in_transit' | 'received' | 'cancelled';
  items: POItem[];
  totalCost: number;
  createdAt: string;
  expectedDate?: string;
  receivedDate?: string;
}

export interface POItem {
  itemId: string;
  name: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  costPrice: number;
}

export interface InventoryForecast {
  itemId: string;
  name: string;
  currentStock: number;
  dailyUsageRate: number; // Calculated from sales
  suggestedReorder: number;
  status: 'ok' | 'low' | 'critical' | 'overstock';
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'sale' | 'receipt' | 'adjustment' | 'return';
  quantityChange: number;
  reason?: string; // e.g., "Shrinkage", "Expired", "Cycle Count"
  timestamp: string;
  performedBy?: string;
}

// Extend Window interface for AI Studio helper and AudioContext
declare global {
  // AIStudio types are defined in the environment
  interface Window {
    webkitAudioContext: typeof AudioContext;
    // aistudio is already defined in environment types, re-declaring it as any causes conflict
  }
}