
import { MenuItem, Order, DeliveryAgent, AdminUser, SystemLog, AnalyticsMetrics, AppConfig, ContactInfo, OrderMessage, SalesMetrics, AgentNotificationSettings, ProofOfDelivery, CartItem } from '../types';
import { ASSETS } from '../assets';

const STORAGE_KEY = 'gourmetai_menu';
const SETTINGS_KEY = 'gourmetai_db_settings';
const BOT_SETTINGS_KEY = 'gourmetai_bot_settings';
const APP_CONFIG_KEY = 'gourmetai_app_config';
const ORDERS_KEY = 'gourmetai_orders';
const ADMINS_KEY = 'gourmetai_admins';
const AGENTS_KEY = 'gourmetai_agents';
const AGENT_NOTIFICATIONS_KEY = 'gourmetai_agent_notifications';
const CONTACT_INFO_KEY = 'gourmetai_contact_info';
const ORDER_CHATS_KEY = 'gourmetai_order_chats';
const INVENTORY_KEY = 'gourmetai_inventory';

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

export interface InventoryItem {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    threshold: number;
    cost: number;
    category: string;
    stockIn?: number; // Mock metric for dashboard
    stockOut?: number; // Mock metric for dashboard
}

// Initial Mock Inventory
const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'inv_beef', name: 'Wagyu Beef', unit: 'kg', quantity: 50, threshold: 10, cost: 45.00, category: 'Meat', stockIn: 100, stockOut: 50 },
    { id: 'inv_bun', name: 'Brioche Bun', unit: 'pcs', quantity: 100, threshold: 20, cost: 0.50, category: 'Bakery', stockIn: 200, stockOut: 100 },
    { id: 'inv_chick', name: 'Chicken Breast', unit: 'kg', quantity: 40, threshold: 10, cost: 12.00, category: 'Meat', stockIn: 80, stockOut: 40 },
    { id: 'inv_rice', name: 'Arborio Rice', unit: 'kg', quantity: 25, threshold: 5, cost: 4.00, category: 'Grains', stockIn: 50, stockOut: 25 },
    { id: 'inv_truffle', name: 'Black Truffle', unit: 'g', quantity: 500, threshold: 50, cost: 2.50, category: 'Produce', stockIn: 1000, stockOut: 500 },
    { id: 'inv_egg', name: 'Free-range Eggs', unit: 'pcs', quantity: 200, threshold: 30, cost: 0.30, category: 'Dairy', stockIn: 400, stockOut: 200 },
    { id: 'inv_avocado', name: 'Hass Avocado', unit: 'pcs', quantity: 60, threshold: 10, cost: 1.20, category: 'Produce', stockIn: 100, stockOut: 40 },
    { id: 'inv_salmon', name: 'Atlantic Salmon', unit: 'kg', quantity: 15, threshold: 5, cost: 22.00, category: 'Seafood', stockIn: 30, stockOut: 15 },
    { id: 'inv_cheese', name: 'Parmesan Cheese', unit: 'kg', quantity: 8, threshold: 3, cost: 18.00, category: 'Dairy', stockIn: 15, stockOut: 7 },
    { id: 'inv_oil', name: 'Truffle Oil', unit: 'L', quantity: 12, threshold: 4, cost: 35.00, category: 'Pantry', stockIn: 20, stockOut: 8 },
];

const DEFAULT_APP_CONFIG: AppConfig = {
  deliveryFee: 10.00,
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

// --- EXPORT UTILS (CSV) ---

export const exportDataAsCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;

    // Get headers
    const headers = Object.keys(data[0]);
    
    // Convert rows
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(fieldName => {
            let val = row[fieldName];
            // Handle objects/arrays by stringifying or simplifying
            if (typeof val === 'object' && val !== null) {
                val = JSON.stringify(val).replace(/"/g, '""'); // Escape quotes
            } else if (val === null || val === undefined) {
                val = '';
            } else {
                val = String(val).replace(/"/g, '""');
            }
            return `"${val}"`;
        }).join(','))
    ].join('\r\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// --- BULK IMPORT (CSV) for POS ---
export const bulkImportOrders = async (csvText: string) => {
    const lines = csvText.split('\n');
    let importedCount = 0;
    
    // Skip header, assuming Date, Item, Quantity, Price, Total structure or similar
    // For simplicity, we create generic "Offline" orders
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Very basic parsing logic, real logic would be robust
        const parts = line.split(',');
        if (parts.length >= 2) {
             const newOrder: Order = {
                id: `IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                customerName: 'Imported Customer',
                phoneNumber: '',
                items: [{ 
                    id: 'imp_item', 
                    name: parts[0] || 'Imported Item', 
                    price: parseFloat(parts[1]) || 0, 
                    quantity: 1,
                    description: 'Imported',
                    category: 'Misc',
                    imageUrl: '',
                    available: true,
                    phoneNumber: '',
                }],
                total: parseFloat(parts[parts.length - 1]) || 0,
                status: 'pending_approval', // Default to pending so admin can review
                timestamp: new Date().toISOString(),
                type: 'dine-in',
                source: 'pos',
                paymentMethod: 'cash',
                paymentStatus: 'paid'
            };
            await createOrder(newOrder);
            importedCount++;
        }
    }
    return importedCount;
}

export const bulkImportMenu = async (csvText: string) => {
    const lines = csvText.split('\n');
    let importedCount = 0;
    
    // Skip header. Assume format: Name, Price, Category, Description
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 2) {
             const newItem: MenuItem = {
                id: `IMP-MENU-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                name: parts[0] || 'Imported Dish',
                price: parseFloat(parts[1]) || 0,
                category: parts[2] || 'Imported',
                description: parts[3] || 'Imported via CSV',
                imageUrl: ASSETS.products.categories.lunch,
                available: true,
                phoneNumber: RESTAURANT_PHONE,
            };
            await syncItem('add', newItem);
            importedCount++;
        }
    }
    return importedCount;
}

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

// --- INITIAL MENU DATA ---
export const INITIAL_MENU: MenuItem[] = [
  { 
    id: '1', 
    name: 'Avocado Sourdough Toast', 
    description: 'Poached eggs, chili flakes, and microgreens on artisan bread.', 
    price: 14, 
    category: 'Breakfast', 
    imageUrl: ASSETS.products.avocado_toast, 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 450,
    allergens: ['Gluten', 'Eggs'],
    dietaryLabels: ['V'],
    ingredients: ['Sourdough Bread', 'Hass Avocado', 'Free-range Eggs', 'Chili Flakes', 'Microgreens', 'Olive Oil'],
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
    imageUrl: ASSETS.products.pancakes, 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 620,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    dietaryLabels: ['V'],
    ingredients: ['Flour', 'Blueberries', 'Maple Syrup', 'Butter', 'Milk', 'Eggs'],
  },
  { 
    id: '3', 
    name: 'Grilled Chicken Caesar', 
    description: 'Romaine hearts, parmesan crisps, and house dressing.', 
    price: 16, 
    category: 'Lunch', 
    imageUrl: ASSETS.products.caesar_salad, 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 380,
    allergens: ['Dairy', 'Fish (Anchovies)'],
    ingredients: ['Chicken Breast', 'Romaine Lettuce', 'Parmesan Cheese', 'Croutons', 'Caesar Dressing'],
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
    imageUrl: ASSETS.products.wagyu_burger, 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 950,
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Wagyu Beef', 'Brioche Bun', 'Aged Cheddar', 'Truffle Oil', 'Potatoes', 'Lettuce', 'Tomato'],
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
    imageUrl: ASSETS.products.truffle_risotto, 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 550,
    allergens: ['Dairy'],
    dietaryLabels: ['V', 'GF'],
    ingredients: ['Arborio Rice', 'Black Truffle', 'Parmesan Cheese', 'Butter', 'Vegetable Stock', 'White Wine'],
  },
  { 
    id: '6', 
    name: 'Pan-Seared Salmon', 
    description: 'Served with asparagus and lemon butter sauce.', 
    price: 26, 
    category: 'Dinner', 
    imageUrl: ASSETS.products.salmon, 
    available: false, 
    phoneNumber: '+971504291207',
    calories: 480,
    allergens: ['Fish', 'Dairy'],
    dietaryLabels: ['GF'],
    ingredients: ['Atlantic Salmon', 'Asparagus', 'Butter', 'Lemon', 'Dill', 'Garlic'],
  },
  { 
    id: '7', 
    name: 'Matcha Cheesecake', 
    description: 'Silky smooth cheesecake with japanese matcha.', 
    price: 10, 
    category: 'Desserts', 
    imageUrl: ASSETS.products.cheesecake, 
    available: true, 
    phoneNumber: '+971504291207',
    calories: 400,
    allergens: ['Dairy', 'Eggs', 'Gluten'],
    ingredients: ['Cream Cheese', 'Matcha Powder', 'Sugar', 'Eggs', 'Graham Cracker Crust'],
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

export const syncItem = async (action: 'add' | 'update' | 'delete', item?: MenuItem, id?: string) => {
  const settings = getSettings();
  const currentMenu: MenuItem[] = await fetchMenu();
  
  let newMenu = [...currentMenu];

  if (action === 'delete' && id) {
    newMenu = newMenu.filter(i => i.id !== id);
  } else if (action === 'add' && item) {
    newMenu.push(item);
  } else if (action === 'update' && item) {
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

export const deleteInventoryItem = async (id: string) => {
    await syncItem('delete', undefined, id);
};

// --- INVENTORY MANAGEMENT ---
export const fetchInventory = (): InventoryItem[] => {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(INITIAL_INVENTORY));
    return INITIAL_INVENTORY;
};

export const updateInventoryCounts = (deductions: { name: string, qty: number }[]) => {
    let inventory = fetchInventory();
    
    // Very simple loose matching logic for demo purposes
    // Real system would use IDs mapped to ingredients
    deductions.forEach(d => {
        const itemIndex = inventory.findIndex(inv => 
            d.name.toLowerCase().includes(inv.name.toLowerCase()) || 
            inv.name.toLowerCase().includes(d.name.toLowerCase())
        );
        
        if (itemIndex > -1) {
            inventory[itemIndex].quantity = Math.max(0, inventory[itemIndex].quantity - d.qty);
            // Add to stockOut metric simulation
            inventory[itemIndex].stockOut = (inventory[itemIndex].stockOut || 0) + d.qty;
        }
    });
    
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    return inventory;
};

export const deductOrderInventory = (items: CartItem[]) => {
    // 1. Break down items into ingredients
    // This uses a naive mapping based on the 'ingredients' array in MenuItem
    // In a real app, MenuItem would have recipe relations (IngredientID, Qty)
    
    const deductions: { name: string, qty: number }[] = [];

    items.forEach(item => {
        if (item.ingredients) {
            item.ingredients.forEach(ingName => {
                // Assume 1 unit (e.g., 0.1kg or 1pc) per item quantity
                // Specific logic: 
                // Beef = 0.2kg per burger
                // Bun = 1 per burger
                let qtyToDeduct = 0.1 * item.quantity; 
                
                if (ingName.includes('Beef') || ingName.includes('Chicken') || ingName.includes('Salmon')) {
                    qtyToDeduct = 0.2 * item.quantity;
                } else if (ingName.includes('Bun') || ingName.includes('Egg') || ingName.includes('Avocado')) {
                    qtyToDeduct = 1 * item.quantity;
                } else if (ingName.includes('Rice')) {
                    qtyToDeduct = 0.15 * item.quantity;
                }

                deductions.push({ name: ingName, qty: qtyToDeduct });
            });
        }
    });

    updateInventoryCounts(deductions);
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
    
    // Trigger Inventory Deduction if completed (POS)
    if (order.source === 'pos' && order.status === 'completed') {
        deductOrderInventory(order.items);
    }
    
    return order;
};

export const updateOrderStatus = async (orderId: string, status: string, agentId?: string, deliveryStatus?: string, pod?: ProofOfDelivery) => {
    const orders = await fetchOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
        // If transitioning to completed/approved for the first time from pending, deduct inventory (for online orders)
        // Note: POS orders deduct on creation
        if (orders[idx].source !== 'pos' && orders[idx].status === 'pending_approval' && status === 'approved') {
            deductOrderInventory(orders[idx].items);
        }

        orders[idx].status = status as any;
        if (agentId !== undefined) orders[idx].deliveryAgentId = agentId;
        if (deliveryStatus !== undefined) orders[idx].deliveryStatus = deliveryStatus as any;
        if (pod !== undefined) orders[idx].proofOfDelivery = pod;
        
        // Auto-generate delivery code if approved
        if (status === 'approved' && !orders[idx].deliveryCode) {
            orders[idx].deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
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

export const returnOrderItem = async (orderId: string, itemIndex: number, quantity: number) => {
    const orders = await fetchOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
        const order = orders[idx];
        const item = order.items[itemIndex];
        
        if (!item.returnedQuantity) item.returnedQuantity = 0;
        
        if (item.returnedQuantity + quantity > item.quantity) {
             throw new Error("Cannot return more than purchased");
        }
        
        item.returnedQuantity += quantity;
        
        // Update status if needed
        const totalReturned = order.items.reduce((sum, i) => sum + (i.returnedQuantity || 0), 0);
        const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
        
        if (totalReturned === totalQty) {
            order.paymentStatus = 'refunded';
        } else if (totalReturned > 0) {
            order.paymentStatus = 'partially_refunded';
        }

        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        
        // Restock inventory? (Simplified: Yes)
        // In real world, cooked food is waste, packaged goods are restock. 
        // We will skip logic for simplicity or can implement `updateInventoryCounts` with negative values to add back.
        
        return order;
    }
    throw new Error("Order not found");
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

export const exportDataToSheet = async (type: 'menu' | 'orders') => {
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
