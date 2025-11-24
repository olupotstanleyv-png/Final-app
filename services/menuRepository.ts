
import { MenuItem, Order, DeliveryAgent, AdminUser, SystemLog, AnalyticsMetrics, CartItem, Supplier, PurchaseOrder, InventoryForecast, POItem, InventoryTransaction, ProofOfDelivery, AppConfig, ContactInfo, OrderMessage, SalesMetrics, AgentNotificationSettings, CycleCountSession, InventoryReport } from '../types';

const STORAGE_KEY = 'gourmetai_menu';
const SETTINGS_KEY = 'gourmetai_db_settings';
const BOT_SETTINGS_KEY = 'gourmetai_bot_settings';
const APP_CONFIG_KEY = 'gourmetai_app_config';
const ORDERS_KEY = 'gourmetai_orders';
const ADMINS_KEY = 'gourmetai_admins';
const AGENTS_KEY = 'gourmetai_agents';
const AGENT_NOTIFICATIONS_KEY = 'gourmetai_agent_notifications';
const SUPPLIERS_KEY = 'gourmetai_suppliers';
const PO_KEY = 'gourmetai_pos';
const TRANSACTIONS_KEY = 'gourmetai_inv_transactions';
const CONTACT_INFO_KEY = 'gourmetai_contact_info';
const ORDER_CHATS_KEY = 'gourmetai_order_chats';
const CYCLE_COUNTS_KEY = 'gourmetai_cycle_counts';

const RESTAURANT_PHONE = '971504291207'; 

export const COUNTRY_CODES = [
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+1', country: 'USA/CAN', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'IND', flag: '🇮🇳' },
    { code: '+86', country: 'CHN', flag: '🇨🇳' },
    { code: '+33', country: 'FRA', flag: '🇫🇷' },
    { code: '+49', country: 'DEU', flag: '🇩🇪' },
    { code: '+966', country: 'KSA', flag: '🇸🇦' },
];

export interface DBSettings {
  type: 'local' | 'googlesheet';
  sheetUrl?: string;
  editorUrl?: string;
  lastSync?: string;
}

export interface BotSettings {
  systemInstruction: string;
  temperature: number;
}

const DEFAULT_APP_CONFIG: AppConfig = {
  deliveryFee: 15.00,
  maxRetries: 3,
  logLevel: 'info',
  resourceLimit: 100
};

const DEFAULT_CONTACT_INFO: ContactInfo = {
    phone: '+971 50 429 1207',
    email: 'support@stanleys.com',
    address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai, UAE',
    website: 'www.stanleys-restaurant.com',
    whatsapp: 'https://wa.me/971504291207',
    facebook: '@stanleys_dubai',
    instagram: '@stanleys_fine_dining',
    hoursWeekdays: '09:00 AM - 10:00 PM',
    hoursWeekends: '10:00 AM - 11:00 PM',
    mapLink: 'https://maps.google.com/?q=Downtown+Dubai',
    timezone: 'Gulf Standard Time (GST)',
    preferredMethod: 'WhatsApp for Orders, Email for Catering'
};

const DEFAULT_AGENT_NOTIFICATIONS: AgentNotificationSettings = {
    enabled: true,
    channels: {
        email: true,
        sms: false,
        inApp: true
    },
    recipients: {
        email: 'manager@stanleys.com',
        phone: '+97150000000'
    }
};

export const getAppConfig = (): AppConfig => {
  const stored = localStorage.getItem(APP_CONFIG_KEY);
  if (stored) return JSON.parse(stored);
  return DEFAULT_APP_CONFIG;
};

export const saveAppConfig = (config: AppConfig) => {
  localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
};

export const getContactInfo = (): ContactInfo => {
    const stored = localStorage.getItem(CONTACT_INFO_KEY);
    if (stored) return JSON.parse(stored);
    return DEFAULT_CONTACT_INFO;
};

export const saveContactInfo = (info: ContactInfo) => {
    localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(info));
};

export const getAgentNotificationSettings = (): AgentNotificationSettings => {
    const stored = localStorage.getItem(AGENT_NOTIFICATIONS_KEY);
    if (stored) return JSON.parse(stored);
    return DEFAULT_AGENT_NOTIFICATIONS;
};

export const saveAgentNotificationSettings = (settings: AgentNotificationSettings) => {
    localStorage.setItem(AGENT_NOTIFICATIONS_KEY, JSON.stringify(settings));
};

// Helper: Fetch with Retry logic from AppConfig
const fetchWithRetry = async (url: string, options?: RequestInit): Promise<Response> => {
    const config = getAppConfig();
    let retries = config.maxRetries || 3;
    let lastError;

    while (retries >= 0) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (e) {
            lastError = e;
            retries--;
            if (retries >= 0) await new Promise(res => setTimeout(res, 1000));
        }
    }
    throw lastError;
};

// --- PRIVACY UTILS ---
export const maskPhoneNumber = (phone: string): string => {
    if (!phone) return 'Unknown';
    // Clean string, remove spaces
    const clean = phone.replace(/\s/g, '');
    if (clean.length < 8) return phone;
    // Show first 4 chars, mask middle, show last 3
    const prefix = clean.slice(0, 5); // e.g. +9715
    const suffix = clean.slice(-3);
    return `${prefix} **** ${suffix}`;
};

// --- INITIAL IMS DATA ---

export const INITIAL_SUPPLIERS: Supplier[] = [
    { id: 'SUP-001', name: 'Fresh Farms Ltd', contactPerson: 'John Green', email: 'orders@freshfarms.com', phone: '+971501234567', leadTimeDays: 2, rating: 4.8 },
    { id: 'SUP-002', name: 'Global Foods Import', contactPerson: 'Sarah Lee', email: 'sarah@globalfoods.com', phone: '+971509876543', leadTimeDays: 14, rating: 4.2 },
    { id: 'SUP-003', name: 'Bakery Supplies Co', contactPerson: 'Mike Dough', email: 'mike@bakerysupplies.com', phone: '+971505555555', leadTimeDays: 3, rating: 4.5 },
];

// Extend Initial Menu with IMS Data
export const INITIAL_MENU: MenuItem[] = [
  { 
    id: '1', 
    name: 'Avocado Sourdough Toast', 
    description: 'Poached eggs, chili flakes, and microgreens on artisan bread.', 
    price: 14, 
    category: 'Breakfast', 
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=400&q=80', 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 450,
    allergens: ['Gluten', 'Eggs'],
    dietaryLabels: ['V'],
    ingredients: ['Sourdough Bread', 'Hass Avocado', 'Free-range Eggs', 'Chili Flakes', 'Microgreens', 'Olive Oil'],
    stock: 50,
    sku: 'BRK-AVO-001',
    costPrice: 4.50,
    supplierId: 'SUP-003',
    reorderPoint: 20,
    safetyStock: 10,
    leadTime: 3,
    binLocation: 'A-01-01',
    modifierGroups: [
        {
            id: 'bread',
            name: 'Bread Choice',
            required: true,
            maxSelection: 1,
            options: [
                { id: 'sourdough', name: 'Sourdough', price: 0, available: true },
                { id: 'multigrain', name: 'Multigrain', price: 0, available: true },
                { id: 'gf', name: 'Gluten Free Bread', price: 2, available: true }
            ]
        },
        {
            id: 'extras',
            name: 'Add-ons',
            required: false,
            maxSelection: 3,
            options: [
                { id: 'ex_egg', name: 'Extra Poached Egg', price: 3, available: true },
                { id: 'smk_salmon', name: 'Smoked Salmon', price: 5, available: true },
                { id: 'feta', name: 'Feta Cheese', price: 2, available: true }
            ]
        }
    ]
  },
  { 
    id: '2', 
    name: 'Blueberry Pancakes', 
    description: 'Fluffy stack with maple syrup and whipped butter.', 
    price: 12, 
    category: 'Breakfast', 
    imageUrl: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=400&q=80', 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 620,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    dietaryLabels: ['V'],
    ingredients: ['Flour', 'Blueberries', 'Maple Syrup', 'Butter', 'Milk', 'Eggs'],
    stock: 35,
    sku: 'BRK-PAN-002',
    costPrice: 3.20,
    supplierId: 'SUP-003',
    reorderPoint: 15,
    safetyStock: 5,
    leadTime: 3,
    binLocation: 'A-01-02'
  },
  { 
    id: '3', 
    name: 'Grilled Chicken Caesar', 
    description: 'Romaine hearts, parmesan crisps, and house dressing.', 
    price: 16, 
    category: 'Lunch', 
    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80', 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 380,
    allergens: ['Dairy', 'Fish (Anchovies)'],
    ingredients: ['Chicken Breast', 'Romaine Lettuce', 'Parmesan Cheese', 'Croutons', 'Caesar Dressing'],
    stock: 20,
    sku: 'LUN-CES-001',
    costPrice: 6.00,
    supplierId: 'SUP-001',
    reorderPoint: 25, // Currently below ROP
    safetyStock: 10,
    leadTime: 2,
    binLocation: 'B-02-01',
    modifierGroups: [
        {
            id: 'dressing',
            name: 'Dressing Style',
            required: true,
            maxSelection: 1,
            options: [
                { id: 'tossed', name: 'Tossed', price: 0, available: true },
                { id: 'side', name: 'On the Side', price: 0, available: true }
            ]
        },
        {
            id: 'protein',
            name: 'Extra Protein',
            required: false,
            maxSelection: 2,
            options: [
                { id: 'dbl_chicken', name: 'Double Chicken', price: 5, available: true },
                { id: 'bacon', name: 'Beef Bacon Bits', price: 3, available: true }
            ]
        }
    ]
  },
  { 
    id: '4', 
    name: 'Wagyu Burger', 
    description: 'Premium beef patty with aged cheddar and truffle fries.', 
    price: 22, 
    category: 'Lunch', 
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 950,
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Wagyu Beef', 'Brioche Bun', 'Aged Cheddar', 'Truffle Oil', 'Potatoes', 'Lettuce', 'Tomato'],
    stock: 15,
    sku: 'LUN-WAG-002',
    costPrice: 12.50,
    supplierId: 'SUP-002',
    reorderPoint: 20, // Low stock
    safetyStock: 8,
    leadTime: 14,
    binLocation: 'C-05-01',
    modifierGroups: [
        {
            id: 'temp',
            name: 'Cook Temperature',
            required: true,
            maxSelection: 1,
            options: [
                { id: 'rare', name: 'Rare', price: 0, available: true },
                { id: 'med_rare', name: 'Medium Rare', price: 0, available: true },
                { id: 'med', name: 'Medium', price: 0, available: true },
                { id: 'well', name: 'Well Done', price: 0, available: true }
            ]
        },
        {
            id: 'sides',
            name: 'Side Dish',
            required: true,
            maxSelection: 1,
            options: [
                { id: 'truffle_fries', name: 'Truffle Fries', price: 0, available: true },
                { id: 'sweet_potato', name: 'Sweet Potato Fries', price: 2, available: true },
                { id: 'salad', name: 'Green Salad', price: 0, available: true }
            ]
        },
        {
            id: 'removals',
            name: 'Removals',
            required: false,
            maxSelection: 5,
            options: [
                { id: 'no_onion', name: 'No Onions', price: 0, available: true },
                { id: 'no_tomato', name: 'No Tomato', price: 0, available: true },
                { id: 'no_pickle', name: 'No Pickles', price: 0, available: true }
            ]
        }
    ]
  },
  { 
    id: '5', 
    name: 'Truffle Risotto', 
    description: 'Creamy arborio rice with black truffle shavings.', 
    price: 28, 
    category: 'Dinner', 
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=400&q=80', 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 550,
    allergens: ['Dairy'],
    dietaryLabels: ['V', 'GF'],
    ingredients: ['Arborio Rice', 'Black Truffle', 'Parmesan Cheese', 'Butter', 'Vegetable Stock', 'White Wine'],
    stock: 8,
    sku: 'DIN-RIS-001',
    costPrice: 9.00,
    supplierId: 'SUP-002',
    reorderPoint: 15, // Critical
    safetyStock: 5,
    leadTime: 14,
    binLocation: 'B-03-04'
  },
  { 
    id: '6', 
    name: 'Pan-Seared Salmon', 
    description: 'Served with asparagus and lemon butter sauce.', 
    price: 26, 
    category: 'Dinner', 
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=400&q=80', 
    available: false, 
    phoneNumber: '+971504291207',
    calories: 480,
    allergens: ['Fish', 'Dairy'],
    dietaryLabels: ['GF'],
    ingredients: ['Atlantic Salmon', 'Asparagus', 'Butter', 'Lemon', 'Dill', 'Garlic'],
    stock: 0,
    sku: 'DIN-SAL-002',
    costPrice: 11.00,
    supplierId: 'SUP-001',
    reorderPoint: 10,
    safetyStock: 5,
    leadTime: 2,
    binLocation: 'F-01-01'
  },
  { 
    id: '7', 
    name: 'Matcha Cheesecake', 
    description: 'Silky smooth cheesecake with japanese matcha.', 
    price: 10, 
    category: 'Desserts', 
    imageUrl: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=400&q=80',
    available: true, 
    phoneNumber: '+971504291207',
    calories: 400,
    allergens: ['Dairy', 'Eggs', 'Gluten'],
    ingredients: ['Cream Cheese', 'Matcha Powder', 'Sugar', 'Eggs', 'Graham Cracker Crust'],
    stock: 12,
    sku: 'DES-MAT-001',
    costPrice: 3.50,
    supplierId: 'SUP-003',
    reorderPoint: 15,
    safetyStock: 5,
    leadTime: 3,
    binLocation: 'A-02-05'
  }
];

// Delivery Agents Data
export const INITIAL_AGENTS: DeliveryAgent[] = [
  { id: 'DA1', name: 'Mike Ross', phone: '+97150000001', status: 'available', vehicleType: 'bike', currentLat: 25.1972, currentLng: 55.2744 },
  { id: 'DA2', name: 'Harvey Specter', phone: '+97150000002', status: 'busy', vehicleType: 'car', currentLat: 25.2048, currentLng: 55.2708 },
  { id: 'DA3', name: 'Louis Litt', phone: '+97150000003', status: 'available', vehicleType: 'scooter', currentLat: 25.1860, currentLng: 55.2600 },
];

const INITIAL_ADMINS: AdminUser[] = [
  { id: '1', name: 'Stanley Chef', email: 'chef@stanleys.com', role: 'super_admin', status: 'active', lastLogin: new Date().toISOString() },
  { id: '2', name: 'Floor Manager', email: 'manager@stanleys.com', role: 'manager', status: 'active', lastLogin: new Date(Date.now() - 86400000).toISOString() }
];

export const getSettings = (): DBSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) return JSON.parse(stored);
  return { type: 'local' };
};

export const saveSettings = (settings: DBSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getBotSettings = (): BotSettings => {
  const stored = localStorage.getItem(BOT_SETTINGS_KEY);
  if (stored) return JSON.parse(stored);
  return {
    systemInstruction: `You are Stanley, an intelligent and friendly AI Waiter for 'Stanley's Restaurant'.
    
    *** CORE PROTOCOLS ***
    1. Identify INTENT: OrderFood, InquireMenu, ChitChat.
    2. Remember user's name and context.
    3. Keep responses short and punchy like WhatsApp.
    4. If item is sold out, suggest alternatives.
    `,
    temperature: 0.7
  };
};

export const saveBotSettings = (settings: BotSettings) => {
  localStorage.setItem(BOT_SETTINGS_KEY, JSON.stringify(settings));
};

export const fetchMenu = async (): Promise<MenuItem[]> => {
  const settings = getSettings();
  
  if (settings.type === 'googlesheet' && settings.sheetUrl) {
    try {
      // Use retry logic for robustness
      const res = await fetchWithRetry(`${settings.sheetUrl}?action=get_menu`);
      const data = await res.json();
      
      const mapped = data.map((item: any) => ({
        ...item,
        price: Number(item.price),
        available: item.available === 'Yes' || item.available === true,
        phoneNumber: item.phoneNumber ? String(item.phoneNumber) : '+971504291207',
        stock: item.stock ? Number(item.stock) : 0,
        costPrice: item.costPrice ? Number(item.costPrice) : 0,
        reorderPoint: item.reorderPoint ? Number(item.reorderPoint) : 0,
        modifierGroups: item.modifierGroups ? JSON.parse(item.modifierGroups) : undefined,
        dietaryLabels: item.dietaryLabels ? JSON.parse(item.dietaryLabels) : undefined
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      return mapped;
    } catch (e) {
      console.error("Failed to fetch from sheet, falling back to local", e);
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MENU));
  return INITIAL_MENU;
};

// --- TRANSACTION LOGGING ---
export const logInventoryTransaction = (
    itemId: string,
    itemName: string,
    type: InventoryTransaction['type'],
    quantityChange: number,
    reason?: string,
    batchNumber?: string
) => {
    const transaction: InventoryTransaction = {
        id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId,
        itemName,
        type,
        quantityChange,
        reason,
        timestamp: new Date().toISOString(),
        batchNumber
    };
    const stored = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([transaction, ...stored]));
};

export const getInventoryTransactions = (): InventoryTransaction[] => {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
};

export const syncItem = async (action: 'add' | 'update' | 'delete', item?: MenuItem, id?: string) => {
  const settings = getSettings();
  const currentMenu: MenuItem[] = await fetchMenu();
  
  let newMenu = [...currentMenu];

  if (action === 'delete' && id) {
    newMenu = newMenu.filter(i => i.id !== id);
  } else if (action === 'add' && item) {
    // Force availability based on stock
    item.available = item.stock > 0;
    newMenu.push(item);
  } else if (action === 'update' && item) {
    const oldItem = newMenu.find(i => i.id === item.id);
    if (oldItem && oldItem.stock !== item.stock) {
        logInventoryTransaction(item.id, item.name, 'adjustment', item.stock - oldItem.stock, 'Manual Admin Update');
    }
    
    // Auto toggle availability if stock hits 0, but respect manual overrides if stock > 0
    if (item.stock <= 0) item.available = false;
    
    newMenu = newMenu.map(i => i.id === item.id ? item : i);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newMenu));

  if (settings.type === 'googlesheet' && settings.sheetUrl) {
    try {
        await fetchWithRetry(settings.sheetUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'manage_menu',
                subAction: action,
                data: item,
                id: id
            })
        });
    } catch(e) {
        console.error("Failed to sync with sheet", e);
    }
  }
};

// --- STOCK & IMS FUNCTIONS ---

export const fetchSuppliers = (): Supplier[] => {
    const stored = localStorage.getItem(SUPPLIERS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(INITIAL_SUPPLIERS));
    return INITIAL_SUPPLIERS;
};

export const fetchPurchaseOrders = (): PurchaseOrder[] => {
    const stored = localStorage.getItem(PO_KEY);
    if (stored) return JSON.parse(stored);
    return [];
};

export const createPurchaseOrder = (po: PurchaseOrder) => {
    const pos = fetchPurchaseOrders();
    pos.push(po);
    localStorage.setItem(PO_KEY, JSON.stringify(pos));
    return po;
};

export const updatePurchaseOrder = (po: PurchaseOrder) => {
    const pos = fetchPurchaseOrders();
    const updated = pos.map(p => p.id === po.id ? po : p);
    localStorage.setItem(PO_KEY, JSON.stringify(updated));
    return updated;
};

// Receive PO: Updates Stock Levels, Bin Locations, and handles Batch Tracking
export const receivePurchaseOrder = async (poId: string, receivedItems: Record<string, { qty: number, bin?: string, batch?: string, expiry?: string }>) => {
    const pos = fetchPurchaseOrders();
    const poIndex = pos.findIndex(p => p.id === poId);
    if (poIndex === -1) throw new Error("PO not found");
    
    const po = pos[poIndex];
    
    // Update PO Item Counts
    po.items = po.items.map(item => {
        const receivedData = receivedItems[item.itemId];
        if (receivedData) {
            return {
                ...item,
                quantityReceived: item.quantityReceived + receivedData.qty,
                binLocation: receivedData.bin || item.binLocation,
                batchNumber: receivedData.batch || item.batchNumber,
                expiryDate: receivedData.expiry || item.expiryDate
            };
        }
        return item;
    });
    
    // Check if fully received
    const allReceived = po.items.every(i => i.quantityReceived >= i.quantityOrdered);
    const anyReceived = po.items.some(i => i.quantityReceived > 0);
    
    if (allReceived) {
        po.status = 'received';
        po.receivedDate = new Date().toISOString();
    } else if (anyReceived) {
        po.status = 'partially_received';
    }

    // Update Stock Levels in Menu
    const menu = await fetchMenu();
    let menuUpdated = false;

    po.items.forEach(item => {
        const receivedData = receivedItems[item.itemId];
        if (receivedData && receivedData.qty > 0) {
            const menuItem = menu.find(m => m.id === item.itemId);
            if (menuItem) {
                menuItem.stock += receivedData.qty;
                menuItem.binLocation = receivedData.bin || menuItem.binLocation;
                // Log Transaction
                logInventoryTransaction(item.itemId, item.name, 'receipt', receivedData.qty, `PO Receipt: ${po.id}`, receivedData.batch);
                menuUpdated = true;
            }
        }
    });

    if (menuUpdated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
    }

    localStorage.setItem(PO_KEY, JSON.stringify(pos));
    return po;
};

export const getInventoryAnalytics = async (): Promise<InventoryForecast[]> => {
    const menu = await fetchMenu();
    // In a real app, calculate daily usage rate from order history
    return menu.map(item => ({
        itemId: item.id,
        name: item.name,
        currentStock: item.stock,
        dailyUsageRate: Math.floor(Math.random() * 5), // Mock
        suggestedReorder: Math.max(0, (item.reorderPoint || 10) - item.stock),
        status: item.stock === 0 ? 'critical' : item.stock < (item.reorderPoint || 10) ? 'low' : item.stock > 100 ? 'overstock' : 'ok',
        calculatedROP: item.reorderPoint || 10,
        budgetRequired: Math.max(0, (item.reorderPoint || 10) - item.stock) * (item.costPrice || 0),
        leadTime: item.leadTime || 1
    }));
};

export const performCycleCount = async (counts: Record<string, number>) => {
    const menu = await fetchMenu();
    const updatedMenu = menu.map(item => {
        if (counts[item.id] !== undefined) {
            const diff = counts[item.id] - item.stock;
            if (diff !== 0) {
                logInventoryTransaction(item.id, item.name, 'adjustment', diff, 'Cycle Count Adjustment');
            }
            return { ...item, stock: counts[item.id] };
        }
        return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMenu));
};

// --- CYCLE COUNTING & REPORTING ---

export const generateCycleCount = async (numItems: number = 5): Promise<CycleCountSession> => {
    const menu = await fetchMenu();
    // Shuffle and pick random items
    const shuffled = menu.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numItems);

    const session: CycleCountSession = {
        id: `CC-${Date.now()}`,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        performedBy: 'Admin',
        items: selected.map(item => ({
            itemId: item.id,
            name: item.name,
            systemQty: item.stock,
            actualQty: null,
            variance: 0,
            binLocation: item.binLocation || 'N/A'
        }))
    };

    const storedCounts = JSON.parse(localStorage.getItem(CYCLE_COUNTS_KEY) || '[]');
    localStorage.setItem(CYCLE_COUNTS_KEY, JSON.stringify([...storedCounts, session]));
    return session;
};

export const submitCycleCount = async (sessionId: string, items: { itemId: string, actualQty: number }[]) => {
    const storedCounts = JSON.parse(localStorage.getItem(CYCLE_COUNTS_KEY) || '[]');
    const sessionIdx = storedCounts.findIndex((s: CycleCountSession) => s.id === sessionId);
    
    if (sessionIdx === -1) throw new Error("Cycle count session not found");
    const session = storedCounts[sessionIdx];
    
    // Update session
    session.items = session.items.map((i: any) => {
        const update = items.find(u => u.itemId === i.itemId);
        if (update) {
            return {
                ...i,
                actualQty: update.actualQty,
                variance: update.actualQty - i.systemQty
            };
        }
        return i;
    });
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    
    // Apply updates to main inventory
    const countsMap: Record<string, number> = {};
    session.items.forEach((i: any) => {
        if (i.actualQty !== null) countsMap[i.itemId] = i.actualQty;
    });
    await performCycleCount(countsMap); // This handles stock updates and logging

    storedCounts[sessionIdx] = session;
    localStorage.setItem(CYCLE_COUNTS_KEY, JSON.stringify(storedCounts));
    return session;
};

export const getInventoryReport = async (): Promise<InventoryReport> => {
    const menu = await fetchMenu();
    const valuation = menu.reduce((acc, item) => acc + (item.stock * (item.costPrice || 0)), 0);
    
    // Mock Sales Calculation for turnover (Sales / Avg Inventory)
    // In real app, sum transaction log 'sale' type
    const transactions = getInventoryTransactions();
    const salesQty = transactions.filter(t => t.type === 'sale').reduce((acc, t) => acc + Math.abs(t.quantityChange), 0);
    const avgInventory = menu.reduce((acc, item) => acc + item.stock, 0) || 1; 
    const turnover = salesQty / avgInventory;

    // Shrinkage: Sum of negative cycle count adjustments
    const shrinkage = transactions
        .filter(t => t.type === 'adjustment' && t.quantityChange < 0 && t.reason?.includes('Cycle Count'))
        .reduce((acc, t) => {
             const item = menu.find(m => m.id === t.itemId);
             return acc + (Math.abs(t.quantityChange) * (item?.costPrice || 0));
        }, 0);

    // Dead Stock: Items with stock > 0 but low movement (Mocked by checking if updated recently or simply low forecasted usage)
    const deadStock = menu.filter(item => item.stock > 0 && Math.random() > 0.8); // Random mock for demo

    return {
        totalValuation: valuation,
        turnoverRate: turnover,
        shrinkageValue: shrinkage,
        deadStockCandidates: deadStock,
        lowStockItems: menu.filter(item => item.stock <= (item.reorderPoint || 0))
    };
};

// --- AGENTS ---
export const fetchAgents = (): DeliveryAgent[] => {
    const stored = localStorage.getItem(AGENTS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(AGENTS_KEY, JSON.stringify(INITIAL_AGENTS));
    return INITIAL_AGENTS;
};

export const saveAgent = (agent: DeliveryAgent) => {
    const agents = fetchAgents();
    const idx = agents.findIndex(a => a.id === agent.id);
    if (idx >= 0) agents[idx] = agent;
    else agents.push(agent);
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
};

export const removeAgent = (id: string) => {
    let agents = fetchAgents();
    agents = agents.filter(a => a.id !== id);
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
};

// --- ORDER MANAGEMENT ---

export const fetchOrders = async (): Promise<Order[]> => {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) return JSON.parse(stored);
    return [];
};

export const createOrder = async (order: Order): Promise<Order> => {
    const orders = await fetchOrders();
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
};

export const updateOrderStatus = async (orderId: string, status: string, agentId?: string, deliveryStatus?: string, pod?: ProofOfDelivery) => {
    const orders = await fetchOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
        orders[idx].status = status as any;
        if (agentId !== undefined) orders[idx].deliveryAgentId = agentId;
        if (deliveryStatus !== undefined) orders[idx].deliveryStatus = deliveryStatus as any;
        if (pod !== undefined) orders[idx].proofOfDelivery = pod;
        
        // Auto-generate delivery code if approved
        if (status === 'approved' && !orders[idx].deliveryCode) {
            orders[idx].deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
        }
        
        // Deduct Inventory on Completion/Approval (depending on workflow, let's say Approval)
        if (status === 'approved' && orders[idx].status !== 'approved') {
             orders[idx].items.forEach(orderItem => {
                 syncItem('update', { ...orderItem, stock: Math.max(0, orderItem.stock - orderItem.quantity) } as MenuItem);
                 logInventoryTransaction(orderItem.id, orderItem.name, 'sale', -orderItem.quantity, `Order #${orderId}`);
             });
        }

        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
};

export const updateOrderPickupTime = async (orderId: string, time: string) => {
    const orders = await fetchOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
        orders[idx].pickupTime = time;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
};

// --- ORDER CHAT ---

export const fetchOrderMessages = (orderId: string): OrderMessage[] => {
    const allChats = JSON.parse(localStorage.getItem(ORDER_CHATS_KEY) || '{}');
    return allChats[orderId] || [];
};

export const sendOrderMessage = (orderId: string, text: string, sender: 'customer' | 'agent' | 'admin') => {
    const allChats = JSON.parse(localStorage.getItem(ORDER_CHATS_KEY) || '{}');
    const messages = allChats[orderId] || [];
    const newMessage: OrderMessage = {
        id: Date.now().toString(),
        orderId,
        sender: sender as any,
        text,
        timestamp: new Date().toISOString(),
        read: false
    };
    allChats[orderId] = [...messages, newMessage];
    localStorage.setItem(ORDER_CHATS_KEY, JSON.stringify(allChats));
};

// --- ANALYTICS & LOGS ---

export const fetchAnalyticsMetrics = (): AnalyticsMetrics => {
    // Mock analytics for demo
    return {
        conversionRate: 3.5,
        abandonmentRate: 45,
        avgResponseTime: 120, // seconds
        activeConversations: 12,
        topIntents: [
            { label: 'Check Menu', count: 150 },
            { label: 'Order Status', count: 80 },
            { label: 'Business Hours', count: 45 }
        ],
        fallOffPoints: [
            { step: 'Menu View', drop: 0 },
            { step: 'Add to Cart', drop: 30 },
            { step: 'Checkout', drop: 60 }
        ]
    };
};

export const getSalesMetrics = async (): Promise<SalesMetrics> => {
    const orders = await fetchOrders();
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === today);
    const dailyTotal = todayOrders.reduce((acc, o) => acc + o.total, 0);
    
    // Mock historical data for chart
    const dailyRevenueChart = [150, 230, 180, 290, 200, 310, dailyTotal || 100]; 

    return {
        dailyTotal,
        weeklyTotal: dailyTotal * 7, // mock
        monthlyTotal: dailyTotal * 30, // mock
        yearlyTotal: dailyTotal * 365, // mock
        orderCountToday: todayOrders.length,
        dailyRevenueChart,
        posDailyTotal: todayOrders.filter(o => o.source === 'pos').reduce((acc, o) => acc + o.total, 0)
    };
};

export const fetchSystemLogs = (): SystemLog[] => {
    return [
        { id: '1', timestamp: new Date().toISOString(), level: 'info', event: 'System Start', details: 'Application initialized', source: 'OrderSystem' },
        { id: '2', timestamp: new Date(Date.now() - 10000).toISOString(), level: 'warning', event: 'High Latency', details: 'Menu fetch took > 2s', source: 'Database' }
    ];
};

export const exportDataToSheet = async (type: 'menu' | 'orders' | 'inventory') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Exported ${type} to Google Sheet`);
    return true;
};

export const importDataFromSheet = async (type: 'menu') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Imported ${type} from Google Sheet`);
    return true;
};

// --- WHATSAPP UTILS ---

export const generateWhatsAppLinkWithContext = (contextMessage: string = '', orderData?: any) => {
    const phone = RESTAURANT_PHONE;
    let text = "Hi Stanley's! 👋 I'd like to place an order.";
    
    if (orderData) {
        const itemsList = orderData.items.map((i: any) => {
            let line = `- ${i.quantity}x ${i.name}`;
            // Format modifiers for WhatsApp
            if (i.selectedModifiers && i.selectedModifiers.length > 0) {
                const mods = i.selectedModifiers.map((m:any) => m.name).join(', ');
                line += ` (${mods})`;
            }
            if (i.specialInstructions) line += ` [Note: ${i.specialInstructions}]`;
            return line;
        }).join('\n');
        text += `\n\nI have a draft order:\n${itemsList}\n\nTotal: $${orderData.total.toFixed(2)}`;
    } else if (contextMessage) {
        text += `\n\nContext: ${contextMessage}`;
    }
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

export const generateWhatsAppOrderMessage = (order: Order) => {
    const phone = RESTAURANT_PHONE;
    const itemsList = order.items.map(i => {
        let line = `- ${i.quantity}x ${i.name}`;
        if (i.selectedModifiers && i.selectedModifiers.length > 0) {
            const mods = i.selectedModifiers.map((m:any) => m.name).join(', ');
            line += ` (${mods})`;
        }
        return line;
    }).join('\n');
    
    const text = `NEW ORDER #${order.id}\n\nCustomer: ${order.customerName}\nPhone: ${order.phoneNumber}\n\nItems:\n${itemsList}\n\nTotal: $${order.total.toFixed(2)}\n\nType: ${order.type.toUpperCase()}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

// --- ADMIN UTILS ---

export const fetchAdmins = (): AdminUser[] => {
    const stored = localStorage.getItem(ADMINS_KEY);
    if (stored) return JSON.parse(stored);
    return INITIAL_ADMINS;
};

export const addAdmin = (admin: AdminUser) => {
    const admins = fetchAdmins();
    admins.push(admin);
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};

export const removeAdmin = (id: string) => {
    let admins = fetchAdmins();
    admins = admins.filter(a => a.id !== id);
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};