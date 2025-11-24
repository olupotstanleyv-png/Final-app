import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Order, DeliveryAgent, AnalyticsMetrics, SystemLog, CartItem, InventoryForecast, Supplier, PurchaseOrder, AppConfig, ContactInfo, SalesMetrics, AgentNotificationSettings, CycleCountSession, InventoryReport, ModifierOption } from '../types';
import { 
  Trash2, Plus, Save, Sparkles, Loader2, Check, 
  Search, ClipboardList, UtensilsCrossed, Settings, LogOut,
  Truck, ShoppingBag, RefreshCw, 
  Activity, Layers, Users, Phone, X,
  CreditCard, UserPlus, Grid, List, ChevronRight,
  Clock, Package, AlertCircle, ArrowRight, DollarSign, Bell, Mail,
  Car, Zap, Bike, Wifi, Database, Server, BarChart3, FileText, Shield,
  LayoutDashboard, Wrench, ShoppingCart, Map as MapIcon, MapPin, UserCog, Sliders, Calendar, Edit2,
  Scan, Banknote, Smartphone, Printer, Minus, Ticket, Flame, ChefHat,
  Megaphone, Target, LifeBuoy, PieChart, Filter, Send
} from 'lucide-react';
import { generateMenuDescription, initChatSession } from '../services/gemini';
import { syncItem, getSettings, fetchOrders, updateOrderStatus, fetchAgents, saveAgent, removeAgent, fetchAnalyticsMetrics, fetchSystemLogs, getBotSettings, saveBotSettings, createOrder, getInventoryAnalytics, fetchSuppliers, fetchPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, getAppConfig, saveAppConfig, getContactInfo, getSalesMetrics, exportDataToSheet, importDataFromSheet, getAgentNotificationSettings, saveAgentNotificationSettings, generateCycleCount, submitCycleCount, getInventoryReport, logInventoryTransaction } from '../services/menuRepository';
import { Link } from 'react-router-dom';

interface AdminProps {
  menu: MenuItem[];
  refreshMenu: () => Promise<void>;
}

// --- Mock Activity Feed Generator ---
const generateMockActivity = (orders: Order[]) => {
    const activities = [];
    // Add recent orders
    orders.slice(0, 3).forEach(o => {
        activities.push({
            id: `act-${o.id}`,
            type: 'order',
            text: `Order #${o.id.slice(-6)} placed by ${o.customerName}`,
            time: new Date(o.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
        });
    });
    // Mock System Alerts
    activities.push({ id: 'sys-1', type: 'system', text: 'Google Sheets Sync Successful', time: '10:00 AM' });
    activities.push({ id: 'sys-2', type: 'alert', text: 'Low Stock: Truffle Oil', time: '09:45 AM' });
    return activities.sort((a,b) => b.time.localeCompare(a.time));
};

// --- Components ---

const KPICard: React.FC<{ title: string, value: string, sub?: string, icon: any, color: string }> = ({ title, value, sub, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-black text-stone-900">{value}</h3>
            {sub && <p className={`text-xs font-bold mt-2 ${sub.includes('+') ? 'text-green-600' : 'text-stone-500'}`}>{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
            <Icon size={20} />
        </div>
    </div>
);

const Admin: React.FC<AdminProps> = ({ menu, refreshMenu }) => {
  // --- Navigation State ---
  const [activeModule, setActiveModule] = useState<'overview' | 'data' | 'orders' | 'fulfillment' | 'admin' | 'pos'>('overview');
  const [subModule, setSubModule] = useState<string>('dashboard');

  // --- Data State ---
  // Menu / Inventory
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ name: '', description: '', price: 0, category: 'Main', stock: 20, imageUrl: '' });
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [orderFilterSearch, setOrderFilterSearch] = useState('');
  const [orderFilterDateStart, setOrderFilterDateStart] = useState('');
  const [orderFilterDateEnd, setOrderFilterDateEnd] = useState('');
  const [orderFilterPayment, setOrderFilterPayment] = useState('all');

  // Fulfillment & Agents
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<DeliveryAgent>>({ name: '', phone: '', vehicleType: 'bike', status: 'offline' });
  const [assignOrderModal, setAssignOrderModal] = useState<string | null>(null); // Agent ID to assign to

  // CRM State
  const [crmSelectedCustomer, setCrmSelectedCustomer] = useState<string | null>(null); // Customer Name
  const [crmNote, setCrmNote] = useState('');
  const [crmActiveTab, setCrmActiveTab] = useState<'dashboard' | 'leads' | 'campaigns'>('dashboard');
  
  // System
  const [systemHealth, setSystemHealth] = useState({ api: true, db: true, latency: 45 });

  // --- POS State ---
  const [posCart, setPosCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCustomer, setPosCustomer] = useState<{name: string, id: string} | null>(null);
  const [posDiscount, setPosDiscount] = useState(0); // Percentage
  const [posPaymentStep, setPosPaymentStep] = useState<'cart' | 'payment' | 'processing' | 'receipt'>('cart');
  const [posTendered, setPosTendered] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [posChangeDue, setPosChangeDue] = useState(0);
  
  const posScannerRef = useRef<HTMLInputElement>(null);

  // Init
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => setNotification(null), 4000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  // POS Barcode Scanner Focus
  useEffect(() => {
      if (activeModule === 'pos' && posPaymentStep === 'cart') {
          posScannerRef.current?.focus();
      }
  }, [activeModule, posPaymentStep, posCart]);

  const loadData = async () => {
      const ords = await fetchOrders();
      setOrders(ords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSalesMetrics(await getSalesMetrics());
      setAgents(fetchAgents());
      // Mock health check randomization
      setSystemHealth(prev => ({ ...prev, latency: Math.floor(Math.random() * 50) + 20 }));
  };

  const updateOrderStatusWithNotify = async (orderId: string, status: string, deliveryStatus?: string, agentId?: string) => {
      await updateOrderStatus(orderId, status as any, agentId, deliveryStatus as any);
      setNotification(`Order status updated. Customer notified 📨`);
      loadData();
  };

  // --- Agent Handlers ---
  const handleSaveAgent = () => {
      if (!newAgent.name || !newAgent.phone) return alert("Name and Phone required");
      
      const agentToSave: DeliveryAgent = {
          id: newAgent.id || `DA-${Date.now()}`,
          name: newAgent.name,
          phone: newAgent.phone,
          vehicleType: newAgent.vehicleType as any,
          status: newAgent.status as any,
          currentLat: newAgent.currentLat || 25.2048,
          currentLng: newAgent.currentLng || 55.2708
      };
      saveAgent(agentToSave);
      setAgents(fetchAgents());
      setIsAgentModalOpen(false);
      setNewAgent({ name: '', phone: '', vehicleType: 'bike', status: 'offline' });
      setNotification("Agent Profile Saved");
  };

  const handleDeleteAgent = (id: string) => {
      if (window.confirm("Are you sure?")) {
          removeAgent(id);
          setAgents(fetchAgents());
      }
  };

  const handleAssignOrderToAgent = async (orderId: string, agentId: string) => {
      await updateOrderStatusWithNotify(orderId, 'approved', 'ready_for_logistics', agentId);
      setAssignOrderModal(null);
      setNotification("Order Assigned Successfully");
  };

  // --- AI Handlers ---
  const handleAutoGenerateDescriptions = async () => {
      if (!window.confirm("Use AI to generate descriptions for items with missing or short descriptions? This may take a few seconds.")) return;
      
      setIsGenerating(true);
      setNotification("AI Agent writing descriptions... 🤖");
      let count = 0;
      try {
          const itemsToUpdate = menu.filter(item => !item.description || item.description.trim().length < 15);
          
          for (const item of itemsToUpdate) {
              const desc = await generateMenuDescription(item.name, item.category);
              if (desc) {
                  await syncItem('update', { ...item, description: desc });
                  count++;
                  // Small delay to respect rate limits
                  await new Promise(r => setTimeout(r, 800));
              }
          }
          
          if (count > 0) {
              await refreshMenu();
              setNotification(`Successfully generated descriptions for ${count} items! ✨`);
          } else {
              setNotification("All items already have descriptions.");
          }
      } catch (e) {
          console.error(e);
          setNotification("Generation interrupted.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleSaveItem = async () => {
      if (!newItem.name || !newItem.price) return alert("Name and Price are required");
      
      const itemToSave = { 
          ...newItem, 
          id: editingId || Date.now().toString(), 
          price: Number(newItem.price), 
          stock: Number(newItem.stock || 0),
          available: true,
          phoneNumber: '+971504291207'
      } as MenuItem;

      await syncItem(editingId ? 'update' : 'add', itemToSave);
      setNewItem({ name: '', description: '', price: 0, category: 'Main', stock: 20, imageUrl: '' });
      setEditingId(null);
      setIsItemModalOpen(false);
      await refreshMenu();
      setNotification(editingId ? "Item updated" : "New item added");
  };

  // --- POS Logic ---
  const addToPosCart = (item: MenuItem) => {
      setPosCart(prev => {
          const existing = prev.find(i => i.item.id === item.id);
          if (existing) {
              return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { item, quantity: 1 }];
      });
      setPosSearch(''); // Clear scanner
  };

  const updatePosQty = (itemId: string, delta: number) => {
      setPosCart(prev => prev.map(i => {
          if (i.item.id === itemId) {
              return { ...i, quantity: Math.max(0, i.quantity + delta) };
          }
          return i;
      }).filter(i => i.quantity > 0));
  };

  const handlePosScanner = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          // Try to find exact match (SKU or Name)
          const match = menu.find(m => 
              m.sku?.toLowerCase() === posSearch.toLowerCase() || 
              m.name.toLowerCase() === posSearch.toLowerCase()
          );
          if (match) {
              addToPosCart(match);
          }
      }
  };

  const getPosTotals = () => {
      const subtotal = posCart.reduce((acc, line) => acc + (line.item.price * line.quantity), 0);
      const discountAmount = subtotal * (posDiscount / 100);
      const tax = (subtotal - discountAmount) * 0.05;
      const total = subtotal - discountAmount + tax;
      return { subtotal, discountAmount, tax, total };
  };

  const handlePosCheckout = async () => {
      const { total } = getPosTotals();
      
      if (posPaymentMethod === 'cash') {
          const tendered = parseFloat(posTendered);
          if (isNaN(tendered) || tendered < total) {
              alert("Insufficient funds tendered.");
              return;
          }
          setPosChangeDue(tendered - total);
      }

      setPosPaymentStep('processing');
      
      // Simulate Card Processing
      if (posPaymentMethod !== 'cash') {
          await new Promise(r => setTimeout(r, 1500));
      }

      // Create Order Record
      const newOrder: Order = {
          id: `POS-${Date.now().toString().slice(-6)}`,
          customerName: posCustomer ? posCustomer.name : 'Walk-in Customer',
          phoneNumber: 'N/A',
          items: posCart.map(line => ({...line.item, quantity: line.quantity, selectedModifiers: []})),
          total: Number(total.toFixed(2)),
          status: 'completed',
          timestamp: new Date().toISOString(),
          type: 'dine-in', // Retail usually implies instant pickup/dine-in
          source: 'pos',
          paymentMethod: posPaymentMethod === 'mobile' ? 'online_link' : posPaymentMethod,
          paymentStatus: 'paid',
          deliveryStatus: 'delivered'
      };

      await createOrder(newOrder);

      // Deduct Inventory
      for (const line of posCart) {
          const updatedStock = Math.max(0, line.item.stock - line.quantity);
          await syncItem('update', { ...line.item, stock: updatedStock });
          logInventoryTransaction(line.item.id, line.item.name, 'sale', -line.quantity, `POS Sale #${newOrder.id}`);
      }

      await refreshMenu();
      setPosPaymentStep('receipt');
  };

  const resetPos = () => {
      setPosCart([]);
      setPosCustomer(null);
      setPosDiscount(0);
      setPosTendered('');
      setPosPaymentStep('cart');
      setPosChangeDue(0);
  };

  // --- Filter Logic ---
  const filteredOrders = orders.filter(order => {
      const matchName = order.customerName.toLowerCase().includes(orderFilterSearch.toLowerCase()) || order.id.toLowerCase().includes(orderFilterSearch.toLowerCase());
      const matchPayment = orderFilterPayment === 'all' || order.paymentMethod === orderFilterPayment;
      
      let matchDate = true;
      if (orderFilterDateStart) {
          matchDate = matchDate && new Date(order.timestamp) >= new Date(orderFilterDateStart);
      }
      if (orderFilterDateEnd) {
          const end = new Date(orderFilterDateEnd);
          end.setHours(23, 59, 59, 999);
          matchDate = matchDate && new Date(order.timestamp) <= end;
      }

      return matchName && matchPayment && matchDate;
  });

  // --- CRM Helper ---
  const getCustomerStats = (name: string) => {
      const customerOrders = orders.filter(o => o.customerName === name);
      const totalSpend = customerOrders.reduce((acc, o) => acc + o.total, 0);
      const lastOrder = customerOrders[0] ? new Date(customerOrders[0].timestamp) : null;
      // Lead Scoring
      let score = 0;
      if (customerOrders.length > 5) score += 40;
      if (totalSpend > 200) score += 40;
      if (lastOrder && (new Date().getTime() - lastOrder.getTime()) < 604800000) score += 20; // Active within 7 days

      return { 
          count: customerOrders.length, 
          totalSpend, 
          lastOrder: lastOrder ? lastOrder.toLocaleDateString() : 'N/A',
          score,
          scoreLabel: score > 80 ? 'VIP' : score > 40 ? 'Warm' : 'Cold',
          history: customerOrders
      };
  };

  // --- Render Helpers ---
  
  const renderSidebar = () => (
      <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col h-full shadow-2xl z-20">
          <div className="p-6 flex items-center gap-3 border-b border-stone-800">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-900/50">
                  <UtensilsCrossed size={18} />
              </div>
              <div>
                  <h1 className="font-bold text-white text-lg leading-none">AdminOS</h1>
                  <span className="text-[10px] uppercase tracking-widest text-stone-600">Enterprise</span>
              </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
              {/* Group 1: Overview */}
              <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">Overview</div>
                  <button 
                    onClick={() => { setActiveModule('overview'); setSubModule('dashboard'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'overview' ? 'bg-stone-800 text-white shadow-inner' : 'hover:bg-stone-800/50 hover:text-stone-200'}`}
                  >
                      <LayoutDashboard size={18} className={activeModule === 'overview' ? 'text-orange-500' : ''}/>
                      <span className="font-medium text-sm">Dashboard Summary</span>
                  </button>
              </div>

              {/* Group 2: Storefront */}
              <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">Storefront</div>
                  <button 
                    onClick={() => { setActiveModule('pos'); setSubModule('terminal'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'pos' ? 'bg-stone-800 text-white shadow-inner' : 'hover:bg-stone-800/50 hover:text-stone-200'}`}
                  >
                      <Scan size={18} className={activeModule === 'pos' ? 'text-green-500' : ''}/>
                      <span className="font-medium text-sm">Retail POS</span>
                  </button>
              </div>

              {/* Group 3: Data Management */}
              <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">Data Management</div>
                  <div className="space-y-1">
                      <button 
                        onClick={() => { setActiveModule('data'); setSubModule('menu'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'data' && subModule === 'menu' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <UtensilsCrossed size={18} /> <span className="font-medium text-sm">Menu & Catalog</span>
                      </button>
                      <button 
                        onClick={() => { setActiveModule('data'); setSubModule('inventory'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'data' && subModule === 'inventory' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <Layers size={18} /> <span className="font-medium text-sm">Inventory & Parts</span>
                      </button>
                  </div>
              </div>

              {/* Group 4: Orders & Sales */}
              <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">Orders & Sales</div>
                  <div className="space-y-1">
                      <button 
                        onClick={() => { setActiveModule('orders'); setSubModule('queue'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'orders' && subModule === 'queue' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <ClipboardList size={18} /> <span className="font-medium text-sm">Order Queue</span>
                      </button>
                      <button 
                        onClick={() => { setActiveModule('orders'); setSubModule('sales'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'orders' && subModule === 'sales' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <BarChart3 size={18} /> <span className="font-medium text-sm">Sales Reports</span>
                      </button>
                  </div>
              </div>

              {/* Group 5: Fulfillment */}
              <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">Fulfillment</div>
                  <div className="space-y-1">
                      <button 
                        onClick={() => { setActiveModule('fulfillment'); setSubModule('kds'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'fulfillment' && subModule === 'kds' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <MonitorIcon size={18} /> <span className="font-medium text-sm">Kitchen Display</span>
                      </button>
                      <button 
                        onClick={() => { setActiveModule('fulfillment'); setSubModule('agents'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'fulfillment' && subModule === 'agents' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <Truck size={18} /> <span className="font-medium text-sm">Fleet & Agents</span>
                      </button>
                  </div>
              </div>

              {/* Group 6: Admin */}
              <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">Admin</div>
                  <div className="space-y-1">
                      <button 
                        onClick={() => { setActiveModule('admin'); setSubModule('crm'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'admin' && subModule === 'crm' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <Users size={18} /> <span className="font-medium text-sm">CRM Suite</span>
                      </button>
                      <button 
                        onClick={() => { setActiveModule('admin'); setSubModule('settings'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeModule === 'admin' && subModule === 'settings' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50'}`}
                      >
                          <Settings size={18} /> <span className="font-medium text-sm">Config & Users</span>
                      </button>
                  </div>
              </div>
          </nav>

          <div className="p-4 border-t border-stone-800">
              <Link to="/" className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-400 transition">
                  <LogOut size={16}/> Exit System
              </Link>
          </div>
      </aside>
  );

  const MonitorIcon = ({size, className}: {size: number, className?: string}) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
  );

  return (
    <div className="flex h-screen bg-stone-50 font-sans overflow-hidden">
      {renderSidebar()}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Toast Notification */}
        {notification && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 border border-stone-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-sm">{notification}</span>
            </div>
        )}

        {/* Top Header - Hide for POS to maximize screen */}
        {activeModule !== 'pos' && (
            <header className="bg-white h-16 border-b border-stone-200 px-8 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                    <span className="capitalize">{activeModule}</span>
                    <ChevronRight size={14}/>
                    <span className="font-bold text-stone-800 capitalize">{subModule.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
                        <div className={`w-2 h-2 rounded-full ${systemHealth.api ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-bold text-stone-600">System {systemHealth.api ? 'Online' : 'Offline'}</span>
                        <span className="text-[10px] text-stone-400 font-mono ml-1">{systemHealth.latency}ms</span>
                    </div>
                    <div className="relative">
                        <Bell size={20} className="text-stone-400"/>
                        {orders.some(o => o.status === 'pending_approval') && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                    </div>
                    <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center font-bold text-stone-600 text-xs">AD</div>
                </div>
            </header>
        )}

        <div className={`flex-1 overflow-hidden ${activeModule !== 'pos' ? 'p-8 overflow-y-auto' : 'bg-stone-100'}`}>
            
            {/* MODULE: DELIVERY AGENTS */}
            {activeModule === 'fulfillment' && subModule === 'agents' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-stone-900">Fleet Management</h2>
                            <p className="text-stone-500 text-sm">Manage delivery agents and assign tasks.</p>
                        </div>
                        <button 
                            onClick={() => { setNewAgent({ name: '', phone: '', vehicleType: 'bike', status: 'offline' }); setIsAgentModalOpen(true); }}
                            className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-stone-800 transition"
                        >
                            <UserPlus size={18}/> Add Agent
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => {
                            const activeTask = orders.find(o => o.deliveryAgentId === agent.id && o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'completed');
                            return (
                                <div key={agent.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 hover:shadow-md transition group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-bold">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-stone-900">{agent.name}</h3>
                                                <p className="text-xs text-stone-500 font-mono">{agent.phone}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            agent.status === 'available' ? 'bg-green-100 text-green-700' : 
                                            agent.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-500'
                                        }`}>
                                            {agent.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 border-t border-stone-100 pt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-stone-500 flex items-center gap-2"><Car size={14}/> Vehicle</span>
                                            <span className="font-bold capitalize">{agent.vehicleType}</span>
                                        </div>
                                        
                                        {activeTask ? (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Current Task</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-blue-900">Order #{activeTask.id.slice(-4)}</span>
                                                    <Link to={`/tracking/${activeTask.id}`} className="text-xs underline text-blue-600">Track</Link>
                                                </div>
                                                <p className="text-xs text-blue-700 mt-1 truncate">{activeTask.deliveryAddress}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-center">
                                                <p className="text-xs text-stone-400 italic">No active tasks</p>
                                                <button 
                                                    onClick={() => setAssignOrderModal(agent.id)}
                                                    className="mt-2 text-xs font-bold text-orange-600 hover:underline flex items-center justify-center gap-1"
                                                >
                                                    <Plus size={12}/> Assign Order
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => handleDeleteAgent(agent.id)}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition text-stone-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODULE: CRM SUITE */}
            {activeModule === 'admin' && subModule === 'crm' && (
                <div className="flex flex-col h-full">
                    {/* CRM Header/Nav */}
                    <div className="flex items-center gap-6 border-b border-stone-200 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                            <Users size={24} className="text-purple-600"/> CRM Strategy
                        </h2>
                        <div className="flex bg-stone-100 p-1 rounded-lg">
                            <button onClick={() => setCrmActiveTab('dashboard')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${crmActiveTab === 'dashboard' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}>Overview</button>
                            <button onClick={() => setCrmActiveTab('leads')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${crmActiveTab === 'leads' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}>Customer List</button>
                            <button onClick={() => setCrmActiveTab('campaigns')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${crmActiveTab === 'campaigns' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}>Campaigns</button>
                        </div>
                    </div>

                    {/* CRM Dashboard */}
                    {crmActiveTab === 'dashboard' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                    <div className="flex items-center gap-3 mb-2 text-purple-700">
                                        <Target size={20}/>
                                        <h3 className="font-bold text-sm uppercase tracking-wide">Lead Scoring</h3>
                                    </div>
                                    <p className="text-3xl font-black text-purple-900">85</p>
                                    <p className="text-xs text-purple-600 mt-1">Avg. Quality Score</p>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-2 text-blue-700">
                                        <LifeBuoy size={20}/>
                                        <h3 className="font-bold text-sm uppercase tracking-wide">Retention</h3>
                                    </div>
                                    <p className="text-3xl font-black text-blue-900">62%</p>
                                    <p className="text-xs text-blue-600 mt-1">Returning Customers</p>
                                </div>
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                    <div className="flex items-center gap-3 mb-2 text-green-700">
                                        <Megaphone size={20}/>
                                        <h3 className="font-bold text-sm uppercase tracking-wide">Active Campaigns</h3>
                                    </div>
                                    <p className="text-3xl font-black text-green-900">3</p>
                                    <p className="text-xs text-green-600 mt-1">Generating Leads</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                    <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><PieChart size={18}/> Customer Segments</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-stone-600">VIP (Spend > $200)</span>
                                            <div className="flex-1 mx-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 w-[15%]"></div>
                                            </div>
                                            <span className="text-xs font-bold">15%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-stone-600">Regulars (5+ Orders)</span>
                                            <div className="flex-1 mx-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-[40%]"></div>
                                            </div>
                                            <span className="text-xs font-bold">40%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-stone-600">New Leads</span>
                                            <div className="flex-1 mx-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[45%]"></div>
                                            </div>
                                            <span className="text-xs font-bold">45%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                    <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Activity size={18}/> Recent Activity</h3>
                                    <div className="space-y-3 overflow-y-auto max-h-40 pr-2">
                                        {generateMockActivity(orders).slice(0,4).map((act: any) => (
                                            <div key={act.id} className="text-xs py-2 border-b border-stone-100 flex justify-between">
                                                <span className="text-stone-600">{act.text}</span>
                                                <span className="text-stone-400">{act.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CRM Customer List */}
                    {crmActiveTab === 'leads' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col flex-1">
                            <div className="p-4 border-b border-stone-200 flex gap-2 bg-stone-50">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                                    <input type="text" placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-purple-500"/>
                                </div>
                                <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 flex items-center gap-2 text-sm font-bold"><Filter size={16}/> Filter</button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-stone-100 text-stone-500 text-xs uppercase font-bold sticky top-0">
                                        <tr>
                                            <th className="p-4">Name</th>
                                            <th className="p-4 text-center">Lead Score</th>
                                            <th className="p-4">Total Spend</th>
                                            <th className="p-4">Last Active</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {Array.from(new Set(orders.map(o => o.customerName))).map((name, idx) => {
                                            const stats = getCustomerStats(name);
                                            return (
                                                <tr key={idx} className="hover:bg-purple-50/50 transition cursor-pointer" onClick={() => setCrmSelectedCustomer(name)}>
                                                    <td className="p-4 font-bold text-stone-800">{name}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            stats.scoreLabel === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                                            stats.scoreLabel === 'Warm' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'
                                                        }`}>
                                                            {stats.score} - {stats.scoreLabel}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-stone-600 font-mono">${stats.totalSpend.toFixed(2)}</td>
                                                    <td className="p-4 text-xs text-stone-400">{stats.lastOrder}</td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-purple-600 text-xs font-bold hover:underline">View 360° Profile</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CRM Campaigns */}
                    {crmActiveTab === 'campaigns' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
                                <h3 className="text-2xl font-bold mb-4">Create New Campaign</h3>
                                <p className="text-purple-200 mb-6">Target specific segments with personalized offers via Email or SMS.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-purple-300 mb-1">Target Segment</label>
                                        <select className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:bg-white/20">
                                            <option className="text-stone-900">VIP Customers (Score > 80)</option>
                                            <option className="text-stone-900">At Risk (Inactive > 30 days)</option>
                                            <option className="text-stone-900">New Leads (This Week)</option>
                                        </select>
                                    </div>
                                    <button className="w-full py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition shadow-lg flex items-center justify-center gap-2">
                                        <Send size={18}/> Launch Campaign
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-stone-800">Active Automations</h3>
                                {[
                                    { name: 'Welcome Sequence', status: 'Active', stats: '45% Open Rate' },
                                    { name: 'Abandoned Cart', status: 'Active', stats: '12% Recovered' },
                                    { name: 'Birthday Promo', status: 'Paused', stats: 'N/A' },
                                ].map((camp, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-stone-200 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-stone-900">{camp.name}</h4>
                                            <p className="text-xs text-stone-500">{camp.stats}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${camp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                                            {camp.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ... (Existing Modules) ... */}
            {/* MODULE: POS ... (Kept as is) */}
            {activeModule === 'pos' && (
                <div className="flex h-full">
                    {/* LEFT: Catalog & Input */}
                    <div className="w-2/3 flex flex-col border-r border-stone-200 bg-white">
                        {/* 1. Scanner / Input Header */}
                        <div className="p-4 border-b border-stone-200 flex gap-4 bg-stone-50">
                            <div className="relative flex-1">
                                <Scan className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20}/>
                                <input 
                                    ref={posScannerRef}
                                    type="text" 
                                    placeholder="Scan Barcode or Search Item..." 
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-200 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none text-lg font-medium"
                                    value={posSearch}
                                    onChange={e => setPosSearch(e.target.value)}
                                    onKeyDown={handlePosScanner}
                                    autoFocus
                                />
                            </div>
                            <button className="p-4 bg-stone-200 rounded-xl text-stone-600 hover:bg-stone-300 transition">
                                <Search size={24}/>
                            </button>
                        </div>

                        {/* 2. Quick Categories */}
                        <div className="p-4 flex gap-2 overflow-x-auto border-b border-stone-100">
                            {['All', 'Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks'].map(cat => (
                                <button key={cat} className="px-6 py-3 bg-stone-100 rounded-lg font-bold text-stone-600 hover:bg-stone-800 hover:text-white transition whitespace-nowrap text-sm">
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* 3. Item Grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 xl:grid-cols-4 gap-4 content-start bg-stone-50/50">
                            {menu.filter(item => item.name.toLowerCase().includes(posSearch.toLowerCase()) || item.sku?.includes(posSearch)).map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => addToPosCart(item)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 hover:border-orange-500 hover:shadow-md transition flex flex-col items-start text-left group h-32 active:scale-95"
                                >
                                    <div className="font-bold text-stone-800 leading-tight mb-1 line-clamp-2 group-hover:text-orange-600">{item.name}</div>
                                    <div className="text-xs text-stone-400 mb-auto">{item.sku || 'NO SKU'}</div>
                                    <div className="w-full flex justify-between items-end mt-2">
                                        <span className="font-bold text-lg text-stone-900">${item.price}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${item.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.stock} Left
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Ticket / Cart */}
                    <div className="w-1/3 flex flex-col bg-stone-50 shadow-xl z-10 relative">
                        {/* Customer Bar */}
                        <div className="p-4 bg-white border-b border-stone-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {posCustomer ? posCustomer.name[0] : <UserPlus size={20}/>}
                                </div>
                                <div>
                                    {posCustomer ? (
                                        <>
                                            <div className="font-bold text-stone-900">{posCustomer.name}</div>
                                            <div className="text-xs text-green-600 font-bold">Loyalty Member</div>
                                        </>
                                    ) : (
                                        <div className="text-stone-400 font-bold text-sm">Walk-in Customer</div>
                                    )}
                                </div>
                            </div>
                            {posCustomer ? (
                                <button onClick={() => setPosCustomer(null)} className="text-red-500 p-2 hover:bg-red-50 rounded"><X size={18}/></button>
                            ) : (
                                <button onClick={() => setPosCustomer({name: 'John Doe', id: '123'})} className="text-blue-600 font-bold text-xs uppercase tracking-wide hover:bg-blue-50 px-3 py-1 rounded">Add Customer</button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {posCart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-stone-300">
                                    <ShoppingBag size={48} className="mb-4 opacity-20"/>
                                    <p className="font-bold">Ticket Empty</p>
                                    <p className="text-sm">Scan item to start</p>
                                </div>
                            )}
                            {posCart.map((line, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="font-bold text-stone-800 text-sm">{line.item.name}</div>
                                        <div className="text-xs text-stone-500">${line.item.price.toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-stone-100 rounded-lg p-1">
                                        <button onClick={() => updatePosQty(line.item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500 font-bold">-</button>
                                        <span className="font-mono font-bold text-sm w-4 text-center">{line.quantity}</span>
                                        <button onClick={() => updatePosQty(line.item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-green-500 font-bold">+</button>
                                    </div>
                                    <div className="w-16 text-right font-bold text-stone-900">
                                        ${(line.item.price * line.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Financials */}
                        <div className="bg-white p-6 border-t border-stone-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between text-stone-500">
                                    <span>Subtotal</span>
                                    <span>${getPosTotals().subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-stone-500">
                                    <span>Tax (5%)</span>
                                    <span>${getPosTotals().tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-stone-500">
                                    <span>Discount ({posDiscount}%)</span>
                                    <span className="text-red-500">-${getPosTotals().discountAmount.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mb-6 pt-4 border-t border-stone-100">
                                <span className="text-stone-500 font-bold uppercase text-sm">Total Due</span>
                                <span className="text-4xl font-black text-stone-900">${getPosTotals().total.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button onClick={() => setPosDiscount(posDiscount === 0 ? 10 : 0)} className={`flex flex-col items-center justify-center py-3 rounded-xl border ${posDiscount > 0 ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-stone-200 text-stone-500'}`}>
                                    <Ticket size={18}/> <span className="text-[10px] font-bold mt-1">Disc.</span>
                                </button>
                                <button className="flex flex-col items-center justify-center py-3 rounded-xl border border-stone-200 text-stone-500">
                                    <FileText size={18}/> <span className="text-[10px] font-bold mt-1">Note</span>
                                </button>
                                <button onClick={() => setPosCart([])} className="flex flex-col items-center justify-center py-3 rounded-xl border border-stone-200 text-red-500 hover:bg-red-50">
                                    <Trash2 size={18}/> <span className="text-[10px] font-bold mt-1">Clear</span>
                                </button>
                            </div>

                            <button 
                                onClick={() => setPosPaymentStep('payment')}
                                disabled={posCart.length === 0}
                                className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-bold text-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Checkout <ArrowRight size={24}/>
                            </button>
                        </div>
                    </div>

                    {/* PAYMENT OVERLAY MODAL */}
                    {posPaymentStep !== 'cart' && (
                        <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
                            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                
                                {/* Modal Header */}
                                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                                    <h2 className="font-black text-2xl text-stone-900">
                                        {posPaymentStep === 'payment' && "Payment Method"}
                                        {posPaymentStep === 'processing' && "Processing..."}
                                        {posPaymentStep === 'receipt' && "Payment Successful"}
                                    </h2>
                                    {posPaymentStep === 'payment' && <button onClick={() => setPosPaymentStep('cart')}><X size={24} className="text-stone-400 hover:text-stone-800"/></button>}
                                </div>

                                {/* Modal Content */}
                                <div className="p-8 flex-1 overflow-y-auto">
                                    
                                    {/* STEP 1: PAYMENT METHOD */}
                                    {posPaymentStep === 'payment' && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-8">
                                                <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mb-2">Total Amount Due</p>
                                                <p className="text-5xl font-black text-stone-900">${getPosTotals().total.toFixed(2)}</p>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <button 
                                                    onClick={() => setPosPaymentMethod('cash')}
                                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition ${posPaymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                                                >
                                                    <Banknote size={32}/> <span className="font-bold">Cash</span>
                                                </button>
                                                <button 
                                                    onClick={() => setPosPaymentMethod('card')}
                                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition ${posPaymentMethod === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                                                >
                                                    <CreditCard size={32}/> <span className="font-bold">Card</span>
                                                </button>
                                                <button 
                                                    onClick={() => setPosPaymentMethod('mobile')}
                                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition ${posPaymentMethod === 'mobile' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                                                >
                                                    <Smartphone size={32}/> <span className="font-bold">App</span>
                                                </button>
                                            </div>

                                            {posPaymentMethod === 'cash' && (
                                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 mt-4 animate-in slide-in-from-top-2">
                                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Amount Tendered</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xl">$</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-full pl-10 pr-4 py-4 rounded-xl border border-stone-300 text-2xl font-bold outline-none focus:ring-2 focus:ring-green-500"
                                                            placeholder="0.00"
                                                            value={posTendered}
                                                            onChange={e => setPosTendered(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 mt-3">
                                                        {[10, 20, 50, 100].map(amt => (
                                                            <button 
                                                                key={amt} 
                                                                onClick={() => setPosTendered(amt.toString())}
                                                                className="flex-1 py-2 bg-white border border-stone-200 rounded-lg font-bold text-stone-600 hover:bg-stone-100"
                                                            >
                                                                ${amt}
                                                            </button>
                                                        ))}
                                                        <button onClick={() => setPosTendered(getPosTotals().total.toFixed(2))} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold">Exact</button>
                                                    </div>
                                                </div>
                                            )}

                                            <button 
                                                onClick={handlePosCheckout}
                                                className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-stone-800 transition mt-4"
                                            >
                                                {posPaymentMethod === 'cash' ? 'Finalize Cash Sale' : 'Authorize Transaction'}
                                            </button>
                                        </div>
                                    )}

                                    {/* STEP 2: PROCESSING */}
                                    {posPaymentStep === 'processing' && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Loader2 size={64} className="text-orange-500 animate-spin mb-6"/>
                                            <h3 className="text-xl font-bold text-stone-800">Connecting to Terminal...</h3>
                                            <p className="text-stone-500 mt-2">Please tap or insert card.</p>
                                        </div>
                                    )}

                                    {/* STEP 3: RECEIPT */}
                                    {posPaymentStep === 'receipt' && (
                                        <div className="text-center space-y-6">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 animate-in zoom-in">
                                                <Check size={40}/>
                                            </div>
                                            
                                            {posChangeDue > 0 && (
                                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                                    <p className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-2">Change Due</p>
                                                    <p className="text-5xl font-black text-stone-900">${posChangeDue.toFixed(2)}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <button className="py-4 border border-stone-200 rounded-xl font-bold text-stone-600 flex flex-col items-center gap-2 hover:bg-stone-50">
                                                    <Printer size={24}/> Print Receipt
                                                </button>
                                                <button className="py-4 border border-stone-200 rounded-xl font-bold text-stone-600 flex flex-col items-center gap-2 hover:bg-stone-50">
                                                    <Mail size={24}/> Email Receipt
                                                </button>
                                            </div>

                                            <button onClick={resetPos} className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-stone-800 transition">
                                                Start New Sale
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODULE 1: OVERVIEW (DASHBOARD) ... (Kept as is) */}
            {/* MODULE 2: DATA ... (Kept as is) */}
            {/* MODULE 3: ORDERS ... (Kept as is) */}
            {/* MODULE 4: FULFILLMENT (KDS) ... (Kept as is) */}
            {/* MODULE 5: CUSTOMERS (Legacy CRM - replaced by new CRM module) */}

        </div>
      </main>

      {/* ITEM MODAL (ADD/EDIT) */}
      {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-stone-900">{editingId ? 'Edit Item' : 'New Item'}</h3>
                      <button onClick={() => setIsItemModalOpen(false)}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Name</label>
                          <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2 border rounded-lg bg-stone-50" autoFocus/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Image URL</label>
                          <input type="text" value={newItem.imageUrl || ''} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg bg-stone-50" placeholder="https://example.com/image.jpg"/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Category</label>
                          <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} className="w-full p-2 border rounded-lg bg-stone-50">
                              <option value="Breakfast">Breakfast</option>
                              <option value="Lunch">Lunch</option>
                              <option value="Dinner">Dinner</option>
                              <option value="Desserts">Desserts</option>
                              <option value="Drinks">Drinks</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Price ($)</label>
                              <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className="w-full p-2 border rounded-lg bg-stone-50"/>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Stock</label>
                              <input type="number" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})} className="w-full p-2 border rounded-lg bg-stone-50"/>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Description (Optional)</label>
                          <textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full p-2 border rounded-lg bg-stone-50 h-20 text-sm" placeholder="Use AI Auto-Desc later if empty..."></textarea>
                      </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setIsItemModalOpen(false)} className="flex-1 py-2.5 bg-stone-100 rounded-xl font-bold text-stone-600 hover:bg-stone-200">Cancel</button>
                      <button onClick={handleSaveItem} className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 shadow-lg">Save Item</button>
                  </div>
              </div>
          </div>
      )}

      {/* AGENT MODAL */}
      {isAgentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-stone-900">New Delivery Agent</h3>
                      <button onClick={() => setIsAgentModalOpen(false)}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Full Name</label>
                          <input type="text" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} className="w-full p-3 border rounded-xl bg-stone-50 outline-none focus:border-orange-500" autoFocus/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Phone Number</label>
                          <input type="tel" value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})} className="w-full p-3 border rounded-xl bg-stone-50 outline-none focus:border-orange-500"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Vehicle</label>
                              <select value={newAgent.vehicleType} onChange={(e: any) => setNewAgent({...newAgent, vehicleType: e.target.value})} className="w-full p-3 border rounded-xl bg-stone-50 outline-none">
                                  <option value="bike">Bike</option>
                                  <option value="scooter">Scooter</option>
                                  <option value="car">Car</option>
                                  <option value="van">Van</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Initial Status</label>
                              <select value={newAgent.status} onChange={(e: any) => setNewAgent({...newAgent, status: e.target.value})} className="w-full p-3 border rounded-xl bg-stone-50 outline-none">
                                  <option value="available">Available</option>
                                  <option value="offline">Offline</option>
                              </select>
                          </div>
                      </div>
                  </div>
                  <button onClick={handleSaveAgent} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 shadow-lg mt-6">Create Profile</button>
              </div>
          </div>
      )}

      {/* ASSIGN ORDER MODAL */}
      {assignOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <h3 className="font-bold text-stone-900">Assign to {agents.find(a => a.id === assignOrderModal)?.name}</h3>
                      <button onClick={() => setAssignOrderModal(null)}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {orders.filter(o => o.status === 'approved' && (!o.deliveryAgentId || o.deliveryAgentId === '')).length === 0 && (
                          <p className="text-center text-stone-400 py-8">No pending orders available.</p>
                      )}
                      {orders.filter(o => o.status === 'approved' && (!o.deliveryAgentId || o.deliveryAgentId === '')).map(order => (
                          <button 
                            key={order.id}
                            onClick={() => handleAssignOrderToAgent(order.id, assignOrderModal!)}
                            className="w-full text-left p-4 border border-stone-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition group"
                          >
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-stone-900">#{order.id.slice(-6)}</span>
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Ready</span>
                              </div>
                              <p className="text-xs text-stone-500 mb-2">{order.customerName} • {order.deliveryAddress || 'Pickup'}</p>
                              <div className="flex gap-2">
                                  {order.items.map((i, idx) => (
                                      <span key={idx} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-600">{i.quantity}x {i.name}</span>
                                  ))}
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* CRM CUSTOMER 360 MODAL */}
      {crmSelectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex">
                  {/* Left Panel: Profile */}
                  <div className="w-1/3 bg-stone-50 border-r border-stone-200 p-6 flex flex-col">
                      <div className="text-center mb-6">
                          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-3xl mx-auto mb-3 border-4 border-white shadow-sm">
                              {crmSelectedCustomer.charAt(0)}
                          </div>
                          <h2 className="text-xl font-bold text-stone-900">{crmSelectedCustomer}</h2>
                          <div className="flex justify-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wide">Auto Service</span>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wide">Restaurant</span>
                          </div>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                              <p className="text-xs text-stone-400 font-bold uppercase mb-2">Contact Info</p>
                              <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2"><Phone size={14} className="text-stone-400"/> +971 50 **** 123</div>
                                  <div className="flex items-center gap-2"><Mail size={14} className="text-stone-400"/> user@example.com</div>
                                  <div className="flex items-center gap-2"><MapPin size={14} className="text-stone-400"/> Downtown Dubai</div>
                              </div>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                              <p className="text-xs text-stone-400 font-bold uppercase mb-2">Lifetime Value</p>
                              <p className="text-3xl font-black text-stone-900">${getCustomerStats(crmSelectedCustomer).totalSpend.toFixed(2)}</p>
                          </div>
                      </div>

                      <button onClick={() => setCrmSelectedCustomer(null)} className="mt-4 text-stone-500 hover:text-stone-800 font-bold text-sm">Close Profile</button>
                  </div>

                  {/* Right Panel: Activity & History */}
                  <div className="flex-1 flex flex-col bg-white">
                      <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                          <h3 className="font-bold text-stone-900 flex items-center gap-2"><Activity size={18}/> 360° Activity View</h3>
                          <div className="flex gap-2">
                              <button className="p-2 hover:bg-stone-100 rounded-lg text-stone-500"><Phone size={18}/></button>
                              <button className="p-2 hover:bg-stone-100 rounded-lg text-stone-500"><Mail size={18}/></button>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          {/* Auto Service Mock */}
                          <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Wrench size={14}/></div>
                                  <div className="w-0.5 h-full bg-stone-100 mt-2"></div>
                              </div>
                              <div className="pb-6">
                                  <p className="text-xs font-bold text-stone-400 mb-1">Auto Service • 2 Weeks Ago</p>
                                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-sm">
                                      <p className="font-bold text-stone-800">Full Service Car Wash & Oil Change</p>
                                      <p className="text-stone-500">Mileage: 45,000km. Next service due in 6 months.</p>
                                  </div>
                              </div>
                          </div>

                          {/* Restaurant Orders */}
                          {getCustomerStats(crmSelectedCustomer).history.map(order => (
                              <div key={order.id} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><UtensilsCrossed size={14}/></div>
                                      <div className="w-0.5 h-full bg-stone-100 mt-2"></div>
                                  </div>
                                  <div className="pb-6">
                                      <p className="text-xs font-bold text-stone-400 mb-1">Dining • {new Date(order.timestamp).toLocaleDateString()}</p>
                                      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm text-sm">
                                          <div className="flex justify-between mb-1">
                                              <span className="font-bold text-stone-800">Order #{order.id.slice(-4)}</span>
                                              <span className="font-bold text-green-600">${order.total}</span>
                                          </div>
                                          <p className="text-stone-500 text-xs">{order.items.map(i => i.name).join(', ')}</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Activity Input */}
                      <div className="p-4 border-t border-stone-100 bg-stone-50">
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={crmNote}
                                onChange={e => setCrmNote(e.target.value)}
                                placeholder="Add a note or log activity..." 
                                className="flex-1 p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-purple-500"
                              />
                              <button onClick={() => { setCrmNote(''); setNotification("Activity Logged"); }} className="bg-stone-900 text-white p-3 rounded-xl hover:bg-stone-800"><Send size={18}/></button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Admin;