
export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection?: number;
  maxSelection?: number; // 1 for radio, >1 for checkbox
  options: ModifierOption[];
}

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
  // New Fields for Advanced Ordering
  modifierGroups?: ModifierGroup[];
  dietaryLabels?: ('VG' | 'V' | 'GF' | 'Spicy')[]; 
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

export interface OrderMessage {
  id: string;
  orderId: string;
  sender: 'customer' | 'agent';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline' | 'on_break';
  vehicleType: 'car' | 'bike' | 'scooter' | 'van';
  currentLat: number;
  currentLng: number;
}

export interface AgentNotificationSettings {
  enabled: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  recipients: {
    email: string;
    phone: string;
  };
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
  source?: 'web_manual' | 'web_chat' | 'whatsapp' | 'pos';
  
  // Payment & Delivery
  paymentMethod: 'cash' | 'card' | 'online_link';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentLink?: string;
  
  deliveryAgentId?: string;
  deliveryStatus?: 'pending' | 'preparing' | 'ready_for_logistics' | 'picking' | 'packing' | 'picked_up' | 'on_way' | 'delivered';
  deliveryLocation?: { lat: number; lng: number };
  deliveryAddress?: string;
  pickupTime?: string; // New field for Pickup Orders
  
  // Security & Verification
  deliveryCode?: string; // 4-Digit PIN for customer verification
  proofOfDelivery?: ProofOfDelivery;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff' | 'Sales manager' | 'Delivery agents';
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

export interface SalesMetrics {
  dailyTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
  orderCountToday: number;
  dailyRevenueChart: number[]; // Last 7 days
  posDailyTotal: number;
}

export interface AppState {
  menu: MenuItem[];
  cart: { itemId: string; quantity: number }[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  modifiers?: string; // Legacy string format
  selectedModifiers?: ModifierOption[]; // New structured format
  specialInstructions?: string;
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
  status: 'draft' | 'ordered' | 'in_transit' | 'partially_received' | 'received' | 'cancelled';
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
  // Receiving Details
  batchNumber?: string;
  expiryDate?: string;
  binLocation?: string;
}

export interface InventoryForecast {
  itemId: string;
  name: string;
  currentStock: number;
  dailyUsageRate: number; // Calculated from sales
  suggestedReorder: number;
  status: 'ok' | 'low' | 'critical' | 'overstock';
  // New Analytics Fields
  calculatedROP: number;
  budgetRequired: number;
  leadTime: number;
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
  batchNumber?: string;
  expiryDate?: string;
}

// Cycle Counting & Auditing
export interface CycleCountSession {
  id: string;
  status: 'in_progress' | 'completed';
  items: CycleCountItem[];
  createdAt: string;
  completedAt?: string;
  performedBy: string;
}

export interface CycleCountItem {
  itemId: string;
  name: string;
  systemQty: number;
  actualQty: number | null;
  variance: number;
  binLocation: string;
}

export interface InventoryReport {
  totalValuation: number; // Sum of (Cost * Stock)
  turnoverRate: number; // Sales / Avg Inventory
  deadStockCandidates: MenuItem[]; // Items with stock > 0 but low movement
  shrinkageValue: number; // Value of lost items
  lowStockItems: MenuItem[]; // Items below reorder point
}

export interface AppConfig {
  deliveryFee: number;
  maxRetries: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  resourceLimit: number;
}

export interface ContactInfo {
  // Primary
  phone: string;
  email: string;
  address: string;
  // Digital
  website: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  hoursWeekdays: string;
  hoursWeekends: string;
  // Location
  mapLink: string;
  timezone: string;
  preferredMethod: string;
}

// Extend Window interface for AI Studio helper and AudioContext
declare global {
  // AIStudio types are defined in the environment
  interface Window {
    webkitAudioContext: typeof AudioContext;
    // aistudio is already defined in environment types, re-declaring it as any causes conflict
  }
}