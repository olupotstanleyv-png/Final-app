
import { MenuItem, Order, DeliveryAgent, AdminUser, SystemLog, AnalyticsMetrics, CartItem, Supplier, PurchaseOrder, InventoryForecast, POItem, InventoryTransaction, ProofOfDelivery } from '../types';

const STORAGE_KEY = 'gourmetai_menu';
const SETTINGS_KEY = 'gourmetai_db_settings';
const BOT_SETTINGS_KEY = 'gourmetai_bot_settings';
const ORDERS_KEY = 'gourmetai_orders';
const ADMINS_KEY = 'gourmetai_admins';
const AGENTS_KEY = 'gourmetai_agents';
const SUPPLIERS_KEY = 'gourmetai_suppliers';
const PO_KEY = 'gourmetai_pos';
const TRANSACTIONS_KEY = 'gourmetai_inv_transactions';

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
    ingredients: ['Sourdough Bread', 'Hass Avocado', 'Free-range Eggs', 'Chili Flakes', 'Microgreens', 'Olive Oil'],
    stock: 50,
    sku: 'BRK-AVO-001',
    costPrice: 4.50,
    supplierId: 'SUP-003',
    reorderPoint: 20,
    safetyStock: 10,
    leadTime: 3,
    binLocation: 'A-01-01'
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
    binLocation: 'B-02-01'
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
    binLocation: 'C-05-01'
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
  { id: 'DA1', name: 'Mike Ross', phone: '+97150000001', status: 'available', currentLat: 25.1972, currentLng: 55.2744 },
  { id: 'DA2', name: 'Harvey Specter', phone: '+97150000002', status: 'busy', currentLat: 25.2048, currentLng: 55.2708 },
  { id: 'DA3', name: 'Louis Litt', phone: '+97150000003', status: 'available', currentLat: 25.1860, currentLng: 55.2600 },
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
      const res = await fetch(`${settings.sheetUrl}?action=get_menu`);
      const data = await res.json();
      
      const mapped = data.map((item: any) => ({
        ...item,
        price: Number(item.price),
        available: item.available === 'Yes' || item.available === true,
        phoneNumber: item.phoneNumber ? String(item.phoneNumber) : '+971504291207',
        stock: item.stock ? Number(item.stock) : 0,
        costPrice: item.costPrice ? Number(item.costPrice) : 0,
        reorderPoint: item.reorderPoint ? Number(item.reorderPoint) : 0
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
    reason?: string
) => {
    const transaction: InventoryTransaction = {
        id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId,
        itemName,
        type,
        quantityChange,
        reason,
        timestamp: new Date().toISOString()
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
    
    // Force availability based on stock
    item.available = item.stock > 0;
    
    newMenu = newMenu.map(i => i.id === item.id ? item : i);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newMenu));

  if (settings.type === 'googlesheet' && settings.sheetUrl) {
    try {
        await fetch(settings.sheetUrl, {
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

// Receive PO: Updates Stock Levels
export const receivePurchaseOrder = async (poId: string, receivedItems: Record<string, number>) => {
    const pos = fetchPurchaseOrders();
    const poIndex = pos.findIndex(p => p.id === poId);
    if (poIndex === -1) throw new Error("PO not found");
    
    const po = pos[poIndex];
    
    // Update PO Item Counts
    po.items = po.items.map(item => ({
        ...item,
        quantityReceived: item.quantityReceived + (receivedItems[item.itemId] || 0)
    }));
    
    // Check if fully received
    const allReceived = po.items.every(i => i.quantityReceived >= i.quantityOrdered);
    if (allReceived) {
        po.status = 'received';
        po.receivedDate = new Date().toISOString();
    }

    pos[poIndex] = po;
    localStorage.setItem(PO_KEY, JSON.stringify(pos));

    // UPDATE MENU STOCK AND LOG
    const menu = await fetchMenu();
    for (const [itemId, qty] of Object.entries(receivedItems)) {
        if (qty > 0) {
            const menuItem = menu.find(m => m.id === itemId);
            if (menuItem) {
                // We bypass syncItem logging here to avoid double logging or generic 'Manual Update' reason
                // We manually log 'receipt'
                const oldStock = menuItem.stock || 0;
                menuItem.stock = oldStock + qty;
                menuItem.available = menuItem.stock > 0;
                
                // Save direct to storage
                const newMenu = menu.map(m => m.id === itemId ? menuItem : m);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newMenu));
                
                logInventoryTransaction(itemId, menuItem.name, 'receipt', qty, `PO #${poId}`);
            }
        }
    }
};

// Generate Forecast & Reorder Advice
export const getInventoryAnalytics = async (): Promise<InventoryForecast[]> => {
    const menu = await fetchMenu();
    const forecasts: InventoryForecast[] = menu.map(item => {
        // Simulate usage rate (Mock: random between 1 and 5 per day)
        const dailyUsage = Math.floor(Math.random() * 4) + 1; 
        const rop = item.reorderPoint || 20;
        
        let status: 'ok' | 'low' | 'critical' | 'overstock' = 'ok';
        if (item.stock <= 0) status = 'critical';
        else if (item.stock < rop) status = 'low';
        else if (item.stock > rop * 3) status = 'overstock';

        const suggestedReorder = item.stock < rop ? (rop * 2) - item.stock : 0;

        return {
            itemId: item.id,
            name: item.name,
            currentStock: item.stock,
            dailyUsageRate: dailyUsage,
            suggestedReorder: suggestedReorder,
            status: status
        };
    });
    return forecasts;
};


export const updateInventory = async (itemsSold: CartItem[]) => {
    const currentMenu = await fetchMenu();
    let updatedMenu = [...currentMenu];

    itemsSold.forEach(soldItem => {
        const idx = updatedMenu.findIndex(i => i.id === soldItem.id);
        if (idx >= 0) {
            const currentStock = updatedMenu[idx].stock || 0;
            const newStock = Math.max(0, currentStock - soldItem.quantity);
            
            // Log Sale
            logInventoryTransaction(soldItem.id, soldItem.name, 'sale', -soldItem.quantity, 'Order Fulfillment');

            updatedMenu[idx] = {
                ...updatedMenu[idx],
                stock: newStock,
                available: newStock > 0 // Auto mark out of stock if 0
            };
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMenu));

    const settings = getSettings();
    if (settings.type === 'googlesheet' && settings.sheetUrl) {
         // Batch update mock
    }
};

// Used for Audit / Cycle Counting
export const performCycleCount = async (itemId: string, actualCount: number, reason: string) => {
    const menu = await fetchMenu();
    const item = menu.find(i => i.id === itemId);
    if (!item) return;

    const diff = actualCount - item.stock;
    if (diff === 0) return;

    item.stock = actualCount;
    item.available = actualCount > 0; // Ensure availability reflects stock
    
    // Log Adjustment
    logInventoryTransaction(item.id, item.name, 'adjustment', diff, reason);

    const newMenu = menu.map(i => i.id === itemId ? item : i);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMenu));
};

// --- ADMIN MANAGEMENT ---

export const fetchAdmins = (): AdminUser[] => {
  const stored = localStorage.getItem(ADMINS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(INITIAL_ADMINS));
  return INITIAL_ADMINS;
};

export const addAdmin = (admin: AdminUser) => {
  const admins = fetchAdmins();
  const newAdmins = [...admins, admin];
  localStorage.setItem(ADMINS_KEY, JSON.stringify(newAdmins));
  return newAdmins;
};

export const removeAdmin = (id: string) => {
  const admins = fetchAdmins();
  const newAdmins = admins.filter(a => a.id !== id);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(newAdmins));
  return newAdmins;
};

// --- DELIVERY AGENT MANAGEMENT ---

export const fetchAgents = (): DeliveryAgent[] => {
  const stored = localStorage.getItem(AGENTS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(AGENTS_KEY, JSON.stringify(INITIAL_AGENTS));
  return INITIAL_AGENTS;
};

export const saveAgent = (agent: Partial<DeliveryAgent>) => {
  const agents = fetchAgents();
  const index = agents.findIndex(a => a.id === agent.id);
  let newAgents;
  
  // If adding a new agent without an ID, generate one
  const finalAgent: DeliveryAgent = {
      id: agent.id || `DA${Date.now()}`,
      name: agent.name || 'Unknown Agent',
      phone: agent.phone || '',
      status: agent.status || 'offline',
      currentLat: agent.currentLat || 25.2048,
      currentLng: agent.currentLng || 55.2708
  };

  if (index >= 0) {
    newAgents = [...agents];
    newAgents[index] = finalAgent;
  } else {
    newAgents = [...agents, finalAgent];
  }
  localStorage.setItem(AGENTS_KEY, JSON.stringify(newAgents));
  return newAgents;
};

export const deleteAgent = (id: string) => {
    const agents = fetchAgents();
    const newAgents = agents.filter(a => a.id !== id);
    localStorage.setItem(AGENTS_KEY, JSON.stringify(newAgents));
    return newAgents;
};

export const autoAssignAgent = async (orderId: string) => {
    const agents = fetchAgents();
    // Simple algo: Find first available agent. 
    // In a real DMS, this would check distance/route.
    const available = agents.filter(a => a.status === 'available');
    
    if(available.length === 0) {
        console.log("No agents available for auto-assignment");
        return null;
    }
    
    const bestAgent = available[0]; // Naive logic: Pick first available
    
    // Mark order status
    await updateOrderStatus(orderId, 'approved', bestAgent.id, 'ready_for_logistics');
    
    // Mark agent as busy (optional, but good for workflow)
    saveAgent({...bestAgent, status: 'busy'});

    return bestAgent;
};

// --- ORDER MANAGEMENT SYSTEM ---

export const generatePaymentLink = (orderId: string, amount: number) => {
    return `https://pay.stanleys.com/checkout/${orderId}?amt=${amount}`;
};

export const createOrder = async (order: Order): Promise<Order> => {
    const settings = getSettings();
    let finalOrder = { ...order };
    
    // Security: Generate Verification Code for Delivery
    finalOrder.deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Set default source if not provided
    if (!finalOrder.source) finalOrder.source = 'web_manual';

    if (order.paymentMethod === 'online_link') {
        finalOrder.paymentLink = generatePaymentLink(order.id, order.total);
    }

    await updateInventory(order.items);

    const storedOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    localStorage.setItem(ORDERS_KEY, JSON.stringify([...storedOrders, finalOrder]));

    if (settings.type === 'googlesheet' && settings.sheetUrl) {
        try {
            await fetch(settings.sheetUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create_order',
                    data: finalOrder
                })
            });
        } catch(e) {
            console.error("Failed to sync order to sheet", e);
        }
    }

    return finalOrder;
};

export const fetchOrders = async (): Promise<Order[]> => {
    const settings = getSettings();
    const localOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');

    if (settings.type === 'googlesheet' && settings.sheetUrl) {
        try {
            const res = await fetch(`${settings.sheetUrl}?action=get_orders`);
            const data = await res.json();
            const cloudOrders = data.map((o: any) => ({
                ...o,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
            }));
            localStorage.setItem(ORDERS_KEY, JSON.stringify(cloudOrders));
            return cloudOrders;
        } catch (e) {
            console.error("Error fetching cloud orders, using local", e);
            return localOrders;
        }
    }
    return localOrders;
};

export const updateOrderStatus = async (
    orderId: string, 
    status: string, 
    agentId?: string, 
    deliveryStatus?: string, 
    proofOfDelivery?: ProofOfDelivery
) => {
    const orders = await fetchOrders();
    const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
            // Logic for delivery status transitions
            let newDeliveryStatus = o.deliveryStatus;
            if (deliveryStatus) {
                newDeliveryStatus = deliveryStatus as any;
            } else if (agentId && !o.deliveryAgentId) {
                // If agent is newly assigned, move to logistics queue
                newDeliveryStatus = 'ready_for_logistics';
            }

            return {
                ...o,
                status: status as any,
                deliveryAgentId: agentId || o.deliveryAgentId,
                deliveryStatus: newDeliveryStatus,
                proofOfDelivery: proofOfDelivery || o.proofOfDelivery
            };
        }
        return o;
    });
    
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    
    // If completing delivery, free up the agent
    if (status === 'completed' && agentId) {
        const agents = fetchAgents();
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
            saveAgent({...agent, status: 'available'});
        }
    }

    const settings = getSettings();
    if (settings.type === 'googlesheet' && settings.sheetUrl) {
         // Cloud update hook
    }
    return updatedOrders;
};

export const generateWhatsAppOrderMessage = (order: Order) => {
  const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name} ${i.modifiers ? `(${i.modifiers})` : ''}`).join('\n');
  const text = `*New Order Alert!* 🍽️\n\nOrder ID: ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.phoneNumber}\nType: ${order.type.toUpperCase()}\n\n*Items:*\n${itemsList}\n\n*Total: $${order.total}*\nPayment: ${order.paymentMethod}\n\nPlease approve this order in the system.`;
  
  return `https://wa.me/${RESTAURANT_PHONE}?text=${encodeURIComponent(text)}`;
};

export const generateWhatsAppChatOrder = (items: any[], customerName: string) => {
    const itemsList = items.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
    const text = `*Hi Stanley's!* 👋\n\nI'd like to place an order via WhatsApp Chat.\n\n*Customer:* ${customerName}\n\n*My Order:*\n${itemsList}\n\nPlease confirm total and delivery time.`;
    return `https://wa.me/${RESTAURANT_PHONE}?text=${encodeURIComponent(text)}`;
};

export const generateWhatsAppLinkWithContext = (messageContext?: string, draftOrder?: { items: any[], customerName?: string }) => {
    let text = "";
    
    if (draftOrder && draftOrder.items.length > 0) {
        const itemsList = draftOrder.items.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
        text = `*Hi! I was chatting on your website.* 👋\n\nI'd like to finalize this order on WhatsApp:\n\n*Items:*\n${itemsList}\n\n*Name:* ${draftOrder.customerName || 'Guest'}`;
    } else if (messageContext) {
        text = `*Hi! I was chatting on your website.* 👋\n\nHere is my last question:\n"${messageContext}"`;
    } else {
        text = `*Hi Stanley's!* 👋\n\nI'd like to order or ask a question.`;
    }

    return `https://wa.me/${RESTAURANT_PHONE}?text=${encodeURIComponent(text)}`;
};

export const generateWhatsAppApprovalMessage = (order: Order) => {
  let prepTime = 45; 
  if (order.type === 'pickup') prepTime = 20;
  if (order.type === 'dine-in') prepTime = 15;

  const eta = new Date(Date.now() + prepTime * 60000);
  const timeStr = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const text = `Hello ${order.customerName}! 👋\n\nYour order *${order.id}* has been APPROVED! ✅\n\n🕒 *Estimated Time:* ${timeStr}\n\nWe are preparing it now. You can track your live status here:\n${window.location.origin}/#/tracking/${order.id}\n\nThank you for choosing Stanley's!`;
  
  const cleanPhone = order.phoneNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export const fetchSystemLogs = (): SystemLog[] => {
    return [
        { id: 'L1', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), level: 'info', event: 'Menu Synced', details: 'Menu cached successfully from Google Sheet', source: 'Database' },
        { id: 'L2', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'info', event: 'System Healthy', details: 'All services operational', source: 'Bot' },
        { id: 'L3', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), level: 'info', event: 'Payment Verified', details: 'Payment gateway connected successfully', source: 'OrderSystem' },
        { id: 'L4', timestamp: new Date(Date.now() - 1000 * 3600).toISOString(), level: 'security', event: 'Auth Check', details: 'Admin login authorized', source: 'Auth' },
        { id: 'L5', timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(), level: 'info', event: 'Backup', details: 'Daily snapshot completed', source: 'Database' },
    ];
};

export const fetchAnalyticsMetrics = (): AnalyticsMetrics => {
    return {
        conversionRate: 24.5,
        abandonmentRate: 35.2,
        avgResponseTime: 450,
        activeConversations: 12,
        topIntents: [
            { label: 'Order Food', count: 450 },
            { label: 'Check Hours', count: 120 },
            { label: 'Dietary Query', count: 85 },
            { label: 'Reservation', count: 45 },
        ],
        fallOffPoints: [
            { step: 'Menu View', drop: 0 },
            { step: 'Add to Cart', drop: 25 },
            { step: 'Checkout Start', drop: 45 },
            { step: 'Payment', drop: 60 },
        ]
    };
};
