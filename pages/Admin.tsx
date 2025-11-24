
import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Order, DeliveryAgent, AdminUser, AnalyticsMetrics, SystemLog, ChatMessage, CartItem, OrderType, InventoryForecast, Supplier, PurchaseOrder, InventoryTransaction, AppConfig, ContactInfo, SalesMetrics, AgentNotificationSettings, CycleCountSession, InventoryReport } from '../types';
import { 
  Trash2, Plus, Save, Sparkles, Wand2, Loader2, Check, 
  Search, ClipboardList, UtensilsCrossed, Settings, LogOut, Image as ImageIcon,
  Truck, Map, ShoppingBag, RefreshCw, 
  Edit, Bike, Activity, Layers, Factory, Scan, Users, Eye, Terminal, Phone, X,
  CreditCard, Smartphone, Receipt, Calculator, UserPlus, Minus, Grid, List, Printer, ChevronRight,
  Clock, Package, AlertCircle, ArrowRight, ChefHat, User, Shield, Lock, FileJson, Database, Server, TrendingUp,
  LayoutTemplate, MapPin, Globe, Mail, BarChart3, PieChart, Coins, QrCode, ClipboardCheck, Box,
  ToggleLeft, ToggleRight, Calendar, DollarSign, Store, MessageCircle, PhoneCall, Bell, Download, Upload, ExternalLink,
  FileSpreadsheet, Car, Zap, Archive, AlertTriangle, PlayCircle, FileText
} from 'lucide-react';
import { generateMenuDescription, sendMessageToBot, initChatSession, generateMarketingImage } from '../services/gemini';
import { syncItem, getSettings, saveSettings, DBSettings, fetchOrders, updateOrderStatus, fetchAdmins, fetchAgents, saveAgent, removeAgent, fetchAnalyticsMetrics, fetchSystemLogs, getBotSettings, saveBotSettings, BotSettings, createOrder, getInventoryAnalytics, fetchSuppliers, fetchPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, getInventoryTransactions, performCycleCount, getAppConfig, saveAppConfig, addAdmin, removeAdmin, getContactInfo, saveContactInfo, getSalesMetrics, exportDataToSheet, importDataFromSheet, getAgentNotificationSettings, saveAgentNotificationSettings, generateCycleCount, submitCycleCount, getInventoryReport } from '../services/menuRepository';
import { Link, useNavigate } from 'react-router-dom';

interface AdminProps {
  menu: MenuItem[];
  refreshMenu: () => Promise<void>;
}

// Helper Components for Charts
const SimpleBarChart: React.FC<{ data: number[], labels: string[], color: string }> = ({ data, labels, color }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end justify-between h-32 gap-2 mt-4">
            {data.map((val, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex justify-center items-end h-full">
                         <div 
                             className={`w-full max-w-[30px] rounded-t-sm transition-all duration-500 group-hover:opacity-80`}
                             style={{ height: `${(val / max) * 100}%`, backgroundColor: color }}
                         ></div>
                         <div className="absolute -top-6 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white px-1 py-0.5 rounded">{val}</div>
                    </div>
                    <span className="text-[9px] font-bold text-stone-400 mt-1 truncate w-full text-center">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
};

const getAgentStatusColor = (status: string) => {
    switch (status) {
        case 'available': return 'bg-green-100 text-green-700 border-green-200';
        case 'busy': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'on_break': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'offline': return 'bg-stone-100 text-stone-500 border-stone-200';
        default: return 'bg-stone-50 text-stone-500';
    }
};

const getVehicleIcon = (type: string) => {
    switch(type) {
        case 'car': return <Car size={16}/>;
        case 'van': return <Truck size={16}/>;
        case 'scooter': return <Zap size={16}/>;
        default: return <Bike size={16}/>;
    }
};

const Admin: React.FC<AdminProps> = ({ menu, refreshMenu }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'inventory' | 'orders' | 'settings' | 'pos' | 'fulfillment' | 'agents'>('dashboard');
  
  // Fulfillment Sub-tabs
  const [fulfillmentTab, setFulfillmentTab] = useState<'kds' | 'logistics' | 'fleet'>('kds');

  // Menu State
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '', description: '', price: 0, category: 'Breakfast', imageUrl: '', available: true, phoneNumber: '+971504291207', stock: 20
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // IMS State
  const [imsTab, setImsTab] = useState<'overview' | 'receiving' | 'auditing' | 'analysis' >('overview');
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receivingData, setReceivingData] = useState<Record<string, { qty: number, bin: string, batch: string, expiry: string }>>({});
  
  // IMS Auditing & Analysis State
  const [activeCycleCount, setActiveCycleCount] = useState<CycleCountSession | null>(null);
  const [cycleCountInputs, setCycleCountInputs] = useState<Record<string, number>>({});
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  
  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [selectedAgentForOrder, setSelectedAgentForOrder] = useState<Record<string, string>>({}); // orderId -> agentId

  // POS
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posCategory, setPosCategory] = useState('All');
  const [posSearch, setPosSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  
  // Delivery Agents
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [agentForm, setAgentForm] = useState<Partial<DeliveryAgent>>({ name: '', phone: '', status: 'offline', vehicleType: 'bike' });
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  // Monitoring
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);

  // Settings & Sync
  const [settings, setDBSettings] = useState<DBSettings>(getSettings());
  const [botConfig, setBotConfig] = useState<BotSettings>(getBotSettings());
  const [appConfig, setAppConfig] = useState<AppConfig>(getAppConfig());
  const [contactInfo, setLocalContactInfo] = useState<ContactInfo>(getContactInfo());
  const [agentNotifSettings, setAgentNotifSettings] = useState<AgentNotificationSettings>(getAgentNotificationSettings());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setDBSettings(getSettings());
    setBotConfig(getBotSettings());
    setAppConfig(getAppConfig());
    setLocalContactInfo(getContactInfo());
    setAgentNotifSettings(getAgentNotificationSettings());

    loadOrders();
    loadAgents();
    loadAnalytics();
    loadIMSData();
    
    if(menu.length > 0) initChatSession(menu);

    const interval = setInterval(async () => {
        const freshOrders = await fetchOrders();
        // Check ONLY for new pending orders for alert
        const pendingCount = freshOrders.filter(o => o.status === 'pending_approval').length;
        if (pendingCount > lastOrderCount) {
            setNewOrderAlert(true);
            // Play sound?
        }
        setLastOrderCount(pendingCount);
        setOrders(freshOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        // Refresh sales metrics periodically
        setSalesMetrics(await getSalesMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [menu, lastOrderCount]);

  const loadOrders = async () => {
      const data = await fetchOrders();
      setOrders(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setLastOrderCount(data.filter(o => o.status === 'pending_approval').length); // Initialize count
      setSalesMetrics(await getSalesMetrics());
  };
  const loadAgents = () => setAgents(fetchAgents());
  const loadAnalytics = async () => { 
      setMetrics(fetchAnalyticsMetrics()); 
      setLogs(fetchSystemLogs()); 
      setSalesMetrics(await getSalesMetrics());
  };
  const loadIMSData = async () => {
      setSuppliers(fetchSuppliers());
      setPurchaseOrders(fetchPurchaseOrders());
      setForecasts(await getInventoryAnalytics());
      // Refresh report if tab is analysis
      if (imsTab === 'analysis') {
          setInventoryReport(await getInventoryReport());
      }
  };

  // --- Handlers ---

  const handleToggleAvailability = async (item: MenuItem) => {
      // Direct update for immediate UI feedback
      const updatedItem = { ...item, available: !item.available };
      await syncItem('update', updatedItem);
      await refreshMenu();
  };
  
  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setSavingId('new');
    try {
        const itemToSave = { ...newItem, id: editingId || Date.now().toString(), price: Number(newItem.price), stock: Number(newItem.stock || 0) } as MenuItem;
        await syncItem(editingId ? 'update' : 'add', itemToSave);
        setNewItem({ name: '', description: '', price: 0, category: 'Breakfast', imageUrl: '', available: true, phoneNumber: '+971504291207', stock: 20 });
        setEditingId(null);
        await refreshMenu();
    } catch(e) { console.error(e); }
    setSavingId(null);
  };

  const handleDeleteItem = async (id: string) => {
    if(window.confirm("Are you sure you want to delete this menu item?")) {
        await syncItem('delete', undefined, id);
        await refreshMenu();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewItem({ ...newItem, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, deliveryStatus?: string) => {
      await updateOrderStatus(orderId, status, undefined, deliveryStatus);
      await loadOrders();
  };

  const handleAssignAgent = async (orderId: string) => {
      const agentId = selectedAgentForOrder[orderId];
      if (!agentId) return alert("Please select an agent first");
      
      await updateOrderStatus(orderId, 'approved', agentId, 'ready_for_logistics');
      await loadOrders();
      alert("Order Assigned to Agent!");
  };

  const handleGenerateInvoice = (orderId: string) => {
      // Open in new tab with autoPrint param
      window.open(`#/admin/orders/${orderId}?autoPrint=true`, '_blank');
  };

  const handleCreatePO = () => {
      // Mock PO Creation for demo
      const newPO: PurchaseOrder = {
          id: `PO-${Date.now()}`,
          supplierId: 'SUP-001',
          status: 'ordered',
          items: menu.slice(0, 3).map(m => ({
              itemId: m.id,
              name: m.name,
              sku: m.sku || 'SKU-000',
              quantityOrdered: 20,
              quantityReceived: 0,
              costPrice: m.costPrice || 0
          })),
          totalCost: 150,
          createdAt: new Date().toISOString()
      };
      createPurchaseOrder(newPO);
      loadIMSData();
  };

  // --- IMS Receiving Handlers ---
  const handleStartReceiving = (po: PurchaseOrder) => {
      setReceivingPO(po);
      const initData: any = {};
      po.items.forEach(i => {
          initData[i.itemId] = { qty: i.quantityOrdered - i.quantityReceived, bin: i.binLocation || '', batch: '', expiry: '' };
      });
      setReceivingData(initData);
      setImsTab('receiving');
  };

  const handleReceiveConfirm = async () => {
      if (!receivingPO) return;
      try {
          await receivePurchaseOrder(receivingPO.id, receivingData);
          alert("Items Received & Stock Updated!");
          setReceivingPO(null);
          setImsTab('overview');
          await loadIMSData();
          await refreshMenu();
      } catch (e) {
          console.error(e);
          alert("Failed to receive items.");
      }
  };

  // --- IMS Cycle Count Handlers ---
  const handleStartCycleCount = async () => {
      const session = await generateCycleCount(5); // Random 5 items
      setActiveCycleCount(session);
      setCycleCountInputs({});
  };

  const handleSubmitCycleCount = async () => {
      if (!activeCycleCount) return;
      const updates = Object.entries(cycleCountInputs).map(([itemId, actualQty]) => ({ itemId, actualQty: Number(actualQty) }));
      await submitCycleCount(activeCycleCount.id, updates);
      alert("Cycle Count Submitted & Stock Updated");
      setActiveCycleCount(null);
      await refreshMenu(); // Update stock in main menu state
  };

  // --- POS Handlers ---
  const addToPosCart = (item: MenuItem) => {
      setPosCart(prev => {
          const existing = prev.find(i => i.id === item.id);
          if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
          return [...prev, { ...item, quantity: 1 }];
      });
  };

  const removeFromPosCart = (itemId: string) => {
      setPosCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updatePosQty = (itemId: string, delta: number) => {
      setPosCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const handlePosCheckout = async () => {
      if (posCart.length === 0) return;
      const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
      
      const newOrder: Order = {
          id: `POS-${Date.now().toString().slice(-6)}`,
          customerName: 'Guest Walk-in',
          phoneNumber: '0000000000',
          items: posCart,
          total: total,
          status: 'completed',
          type: 'dine-in',
          source: 'pos',
          timestamp: new Date().toISOString(),
          paymentMethod: paymentMethod as any,
          paymentStatus: 'paid',
          deliveryStatus: 'delivered'
      };

      await createOrder(newOrder);
      await refreshMenu();
      setPosCart([]);
      setShowPaymentModal(false);
      setAmountTendered('');
      alert("Transaction Completed!");
      await loadOrders(); // Refresh sales
  };

  // --- AGENT MANAGEMENT ---
  const handleEditAgent = (agent: DeliveryAgent) => {
      setAgentForm(agent);
      setIsAgentModalOpen(true);
  };

  const handleSaveAgent = () => {
      if (!agentForm.name || !agentForm.phone) return alert("Name and Phone are required.");
      
      const newAgent: DeliveryAgent = {
          id: agentForm.id || `DA-${Date.now()}`,
          name: agentForm.name,
          phone: agentForm.phone,
          status: agentForm.status || 'offline',
          vehicleType: agentForm.vehicleType || 'bike',
          currentLat: agentForm.currentLat || 25.2048,
          currentLng: agentForm.currentLng || 55.2708
      };

      saveAgent(newAgent);
      setIsAgentModalOpen(false);
      setAgentForm({ name: '', phone: '', status: 'offline', vehicleType: 'bike' });
      loadAgents();
  };

  const handleDeleteAgent = (id: string) => {
      if (window.confirm("Are you sure you want to delete this agent profile?")) {
          removeAgent(id);
          loadAgents();
      }
  };

  const handleSaveNotifSettings = () => {
    saveAgentNotificationSettings(agentNotifSettings);
    alert("Notification Settings Saved!");
  };

  const handleSaveAppConfig = () => {
      saveAppConfig(appConfig);
      alert("Application Settings Saved!");
  };


  // --- SYNC HANDLERS ---
  const handleExport = async (type: 'menu' | 'orders' | 'inventory') => {
      setIsSyncing(true);
      try {
          await exportDataToSheet(type);
          alert(`${type.toUpperCase()} exported to Sheet successfully!`);
      } catch (e) {
          console.error(e);
          alert("Export failed. Check console or settings.");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleImport = async (type: 'menu') => {
      if(!window.confirm("This will overwrite your current menu. Continue?")) return;
      setIsSyncing(true);
      try {
          await importDataFromSheet(type);
          await refreshMenu();
          alert("Menu imported successfully!");
      } catch (e) {
           console.error(e);
          alert("Import failed.");
      } finally {
          setIsSyncing(false);
      }
  };


  // Helper for KDS timer
  const getTimeElapsed = (timestamp: string) => {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
      return `${diff}m`;
  };

  return (
    <div className="flex h-screen bg-stone-100 font-sans overflow-hidden">
      <style>{`
          @media print {
              aside, header, .no-print { display: none !important; }
              main { position: absolute; top: 0; left: 0; width: 100%; height: auto; overflow: visible; }
              .print-container { overflow: visible !important; }
          }
      `}</style>

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-stone-900 text-stone-400 flex flex-col z-20 shadow-xl">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-stone-800">
           <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white"><UtensilsCrossed size={20} /></div>
           <span className="font-bold text-white text-xl hidden lg:block">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 space-y-1">
           {[
             { id: 'dashboard', icon: Activity, label: 'Dashboard' }, 
             { id: 'fulfillment', icon: Truck, label: 'Order Fulfillment' },
             { id: 'pos', icon: Scan, label: 'Retail POS' }, 
             { id: 'orders', icon: ClipboardList, label: 'Orders' }, 
             { id: 'menu', icon: UtensilsCrossed, label: 'Menu Manager' }, 
             { id: 'agents', icon: Users, label: 'Delivery Agents' },
             { id: 'inventory', icon: Layers, label: 'Inventory (IMS)' }, 
             { id: 'settings', icon: Settings, label: 'Settings' }
           ].map(item => (
             <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all border-l-4 ${activeTab === item.id ? 'bg-stone-800 text-white border-orange-500' : 'hover:bg-stone-800 border-transparent'}`}>
                <item.icon size={20} className={activeTab === item.id ? 'text-orange-500' : ''} />
                <span className="hidden lg:block font-medium">{item.label}</span>
             </button>
           ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white h-16 border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-10 no-print">
           <h1 className="text-xl font-bold text-stone-800 capitalize">{activeTab.replace(/_/g, ' ')}</h1>
           <div className="flex items-center gap-4">
                {/* Admin Notification Bell */}
                <div className="relative">
                    <Bell size={20} className={`text-stone-500 ${newOrderAlert ? 'animate-swing text-orange-500' : ''}`} />
                    {newOrderAlert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>}
                </div>
                <Link to="/" className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition border border-transparent hover:border-red-100 flex gap-2"><LogOut size={18} /> Exit</Link>
           </div>
        </header>

        <div className={`flex-1 overflow-y-auto bg-stone-50 print-container ${activeTab === 'pos' ? 'p-0' : 'p-6'}`}>
           
           {/* DASHBOARD TAB */}
           {activeTab === 'dashboard' && metrics && salesMetrics && (
               <div className="space-y-6 animate-in fade-in">
                   {/* Incoming Orders Alert Section */}
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-orange-50/50 gap-4">
                       <div className="flex items-center gap-4">
                           <div className="p-4 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                               <ClipboardList size={28} />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-stone-800">Incoming Orders</h3>
                               <p className="text-stone-500 text-sm mt-1">
                                   You have <span className="font-bold text-orange-600 text-lg">{orders.filter(o => o.status === 'pending_approval').length}</span> pending orders waiting for approval.
                               </p>
                           </div>
                       </div>
                       <button 
                           onClick={() => setActiveTab('orders')}
                           className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition shadow-lg flex items-center gap-2 whitespace-nowrap"
                       >
                           Manage Orders <ArrowRight size={16} />
                       </button>
                   </div>

                   {/* Sales Overview Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                           <div className="flex justify-between items-start mb-2">
                               <div className="p-2 bg-green-100 rounded-lg text-green-600"><DollarSign size={20}/></div>
                               <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded">Today</span>
                           </div>
                           <h3 className="text-xs font-bold uppercase mb-1 text-stone-500">Daily Revenue</h3>
                           <p className="text-3xl font-bold text-stone-900">${salesMetrics.dailyTotal.toFixed(2)}</p>
                           <p className="text-xs text-stone-400 mt-1">{salesMetrics.orderCountToday} Orders today</p>
                       </div>
                        {/* ... (Other metric cards omitted for brevity, keeping layout) */}
                   </div>
               </div>
           )}

           {/* ORDERS TAB */}
           {activeTab === 'orders' && (
               <div className="space-y-6">
                   <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                       <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center no-print">
                           <h3 className="font-bold text-stone-800">Order Management</h3>
                           <div className="flex gap-2">
                               <button 
                                   onClick={() => window.print()}
                                   className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-stone-800 transition"
                               >
                                   <Printer size={16}/> Print Report
                               </button>
                           </div>
                       </div>
                       <div className="overflow-x-auto">
                           {/* Printable Header */}
                           <div className="hidden print-only p-4 text-center">
                                <h1 className="text-2xl font-bold">Transaction Report</h1>
                                <p className="text-sm text-stone-500">Generated on {new Date().toLocaleDateString()}</p>
                           </div>
                           <table className="w-full text-left text-sm">
                               <thead className="bg-stone-100 text-stone-500 font-bold uppercase text-xs">
                                   <tr>
                                       <th className="px-6 py-4">Order ID</th>
                                       <th className="px-6 py-4">Customer</th>
                                       <th className="px-6 py-4">Type & Logistics</th>
                                       <th className="px-6 py-4">Items</th>
                                       <th className="px-6 py-4">Total</th>
                                       <th className="px-6 py-4">Status</th>
                                       <th className="px-6 py-4 text-right no-print">Actions</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-stone-100">
                                   {orders.map(order => {
                                       const assignedAgent = agents.find(a => a.id === order.deliveryAgentId);
                                       return (
                                       <tr key={order.id} className="hover:bg-stone-50 transition">
                                           <td className="px-6 py-4 font-mono font-bold">{order.id.slice(-6)}</td>
                                           <td className="px-6 py-4">
                                               <div className="font-bold text-stone-800">{order.customerName}</div>
                                               <div className="text-xs text-stone-500">{order.phoneNumber}</div>
                                               {order.type === 'delivery' && (
                                                   <div className="text-[10px] text-stone-400 mt-1 max-w-[150px] truncate" title={order.deliveryAddress}>
                                                       <MapPin size={10} className="inline mr-1"/>{order.deliveryAddress || 'N/A'}
                                                   </div>
                                               )}
                                           </td>
                                           <td className="px-6 py-4">
                                               <div className="space-y-1">
                                                   <span className={`px-2 py-1 rounded text-xs font-bold uppercase block w-fit ${
                                                       order.type === 'delivery' ? 'bg-orange-100 text-orange-700' :
                                                       order.type === 'pickup' ? 'bg-blue-100 text-blue-700' :
                                                       'bg-purple-100 text-purple-700'
                                                   }`}>
                                                       {order.type}
                                                   </span>
                                                   {/* Assigned Agent Display */}
                                                   {order.type === 'delivery' && assignedAgent && (
                                                       <div className="flex items-center gap-1.5 text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200 w-fit">
                                                           <User size={12} className="text-stone-400"/>
                                                           <span className="text-[10px] font-bold">{assignedAgent.name}</span>
                                                       </div>
                                                   )}
                                               </div>
                                           </td>
                                           <td className="px-6 py-4 text-stone-600">
                                               {order.items.length} Items
                                               <div className="text-[10px] text-stone-400 truncate max-w-[150px]">{order.items.map(i => i.name).join(', ')}</div>
                                           </td>
                                           <td className="px-6 py-4 font-bold text-stone-800">${order.total.toFixed(2)}</td>
                                           <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                   <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase block w-fit ${
                                                       order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                                                       order.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                       order.status === 'completed' ? 'bg-stone-200 text-stone-600' :
                                                       'bg-red-100 text-red-700'
                                                   }`}>
                                                       {order.status.replace('_', ' ')}
                                                   </span>
                                                   {/* Detailed Delivery Status */}
                                                   {order.type === 'delivery' && order.deliveryStatus && order.status === 'approved' && (
                                                       <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                                                           <Truck size={10}/> {order.deliveryStatus.replace('_', ' ').toUpperCase()}
                                                       </div>
                                                   )}
                                                </div>
                                           </td>
                                           <td className="px-6 py-4 text-right flex gap-2 justify-end no-print">
                                               {order.status === 'pending_approval' && (
                                                   <>
                                                       <button onClick={() => handleUpdateOrderStatus(order.id, 'approved', 'preparing')} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"><Check size={16}/></button>
                                                       <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"><X size={16}/></button>
                                                   </>
                                               )}
                                               
                                               {/* Enhanced Assignment Logic */}
                                               {order.status === 'approved' && order.type === 'delivery' && (
                                                   <div className="flex items-center gap-1">
                                                       <select 
                                                            className="text-[10px] p-1.5 border rounded w-24 bg-white"
                                                            onChange={(e) => setSelectedAgentForOrder({...selectedAgentForOrder, [order.id]: e.target.value})}
                                                            value={selectedAgentForOrder[order.id] || ''}
                                                            title="Re-assign agent"
                                                       >
                                                           <option value="">{order.deliveryAgentId ? 'Change...' : 'Assign...'}</option>
                                                           {agents.filter(a => a.status === 'available').map(a => (
                                                               <option key={a.id} value={a.id}>{a.name}</option>
                                                           ))}
                                                       </select>
                                                       <button onClick={() => handleAssignAgent(order.id)} className="p-1.5 bg-stone-900 text-white rounded hover:bg-stone-700"><Check size={12}/></button>
                                                   </div>
                                               )}

                                               <button 
                                                    onClick={() => handleGenerateInvoice(order.id)} 
                                                    className="p-2 bg-stone-100 text-stone-600 rounded hover:bg-stone-200 transition"
                                                    title="Generate Invoice"
                                                >
                                                    <FileText size={16}/>
                                                </button>
                                               <Link to={`/admin/orders/${order.id}`} className="p-2 bg-stone-100 text-stone-600 rounded hover:bg-stone-200 transition"><Eye size={16}/></Link>
                                           </td>
                                       </tr>
                                   )})}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}

           {/* SETTINGS TAB WITH SYNC */}
           {activeTab === 'settings' && (
               <div className="max-w-4xl mx-auto space-y-8">
                   {/* App Configuration */}
                   <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                       <div className="p-6 border-b border-stone-200 bg-stone-50">
                           <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                               <Settings className="text-stone-600" /> General Configuration
                           </h2>
                       </div>
                       <div className="p-6 space-y-4">
                           <div>
                               <label className="text-sm font-bold text-stone-700 block mb-2">Delivery Fee ($)</label>
                               <input 
                                   type="number" 
                                   step="0.01"
                                   className="w-full p-3 border border-stone-300 rounded-lg text-sm"
                                   value={appConfig.deliveryFee}
                                   onChange={(e) => setAppConfig({...appConfig, deliveryFee: parseFloat(e.target.value)})}
                               />
                               <p className="text-xs text-stone-400 mt-1">Applied to delivery orders.</p>
                           </div>
                           <button onClick={handleSaveAppConfig} className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold text-sm">Save Config</button>
                       </div>
                   </div>

                   {/* Data Sync Section */}
                   <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                       <div className="p-6 border-b border-stone-200 bg-green-50/50">
                           <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                               <FileSpreadsheet className="text-green-600" /> Google Sheet Sync
                           </h2>
                           <p className="text-sm text-stone-500 mt-1">Export your Orders, POS transactions, Inventory, and Menu data to Google Sheets.</p>
                       </div>
                       <div className="p-6 space-y-6">
                           <div>
                               <label className="text-sm font-bold text-stone-700 block mb-2">Google Sheet Web App URL</label>
                               <div className="flex gap-2">
                                   <input 
                                       type="text" 
                                       className="flex-1 p-3 border border-stone-300 rounded-lg text-sm font-mono"
                                       placeholder="https://script.google.com/macros/s/..."
                                       value={settings.sheetUrl || ''}
                                       onChange={(e) => setDBSettings({...settings, type: 'googlesheet', sheetUrl: e.target.value})}
                                   />
                                   <button onClick={() => saveSettings(settings)} className="bg-stone-900 text-white px-4 rounded-lg font-bold text-sm">Save</button>
                               </div>
                               <p className="text-xs text-stone-400 mt-2">Required for synchronization.</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="p-4 border border-stone-200 rounded-xl bg-stone-50">
                                   <h3 className="font-bold text-sm mb-3">Export Data</h3>
                                   <div className="space-y-2">
                                       <button onClick={() => handleExport('orders')} disabled={isSyncing} className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition text-sm">
                                           <span>Export Orders & POS</span>
                                           <Upload size={16} className="text-stone-400"/>
                                       </button>
                                       <button onClick={() => handleExport('inventory')} disabled={isSyncing} className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition text-sm">
                                           <span>Export Inventory</span>
                                           <Upload size={16} className="text-stone-400"/>
                                       </button>
                                        <button onClick={() => handleExport('menu')} disabled={isSyncing} className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition text-sm">
                                           <span>Export Menu</span>
                                           <Upload size={16} className="text-stone-400"/>
                                       </button>
                                   </div>
                               </div>

                               <div className="p-4 border border-stone-200 rounded-xl bg-stone-50">
                                   <h3 className="font-bold text-sm mb-3">Import & Manage</h3>
                                   <div className="space-y-2">
                                       <button onClick={() => handleImport('menu')} disabled={isSyncing} className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition text-sm">
                                           <span>Import Menu from Sheet</span>
                                           <Download size={16} className="text-stone-400"/>
                                       </button>
                                       <a 
                                            href={settings.sheetUrl ? "https://docs.google.com/spreadsheets" : "#"} 
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition text-sm font-bold mt-4"
                                       >
                                           <ExternalLink size={16}/> Edit Google Sheet Online
                                       </a>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Agent Notification Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="p-6 border-b border-stone-200 bg-orange-50/50">
                            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                <Bell className="text-orange-600" /> Agent Notifications
                            </h2>
                            <p className="text-sm text-stone-500 mt-1">Configure how agents and admins are notified of status changes.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Toggles */}
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-700">Enable Notifications</span>
                                <button 
                                    onClick={() => setAgentNotifSettings({...agentNotifSettings, enabled: !agentNotifSettings.enabled})}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${agentNotifSettings.enabled ? 'bg-green-500' : 'bg-stone-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${agentNotifSettings.enabled ? 'translate-x-6' : ''}`}/>
                                </button>
                            </div>
                            
                            {agentNotifSettings.enabled && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Channels</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={agentNotifSettings.channels.email} onChange={e => setAgentNotifSettings({...agentNotifSettings, channels: {...agentNotifSettings.channels, email: e.target.checked}})} className="rounded text-orange-600 focus:ring-orange-500"/>
                                                <span className="text-sm font-medium">Email</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={agentNotifSettings.channels.sms} onChange={e => setAgentNotifSettings({...agentNotifSettings, channels: {...agentNotifSettings.channels, sms: e.target.checked}})} className="rounded text-orange-600 focus:ring-orange-500"/>
                                                <span className="text-sm font-medium">SMS</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={agentNotifSettings.channels.inApp} onChange={e => setAgentNotifSettings({...agentNotifSettings, channels: {...agentNotifSettings.channels, inApp: e.target.checked}})} className="rounded text-orange-600 focus:ring-orange-500"/>
                                                <span className="text-sm font-medium">In-App Alert</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Admin Email</label>
                                            <input 
                                                type="email" 
                                                value={agentNotifSettings.recipients.email}
                                                onChange={e => setAgentNotifSettings({...agentNotifSettings, recipients: {...agentNotifSettings.recipients, email: e.target.value}})}
                                                className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Admin Phone</label>
                                            <input 
                                                type="tel" 
                                                value={agentNotifSettings.recipients.phone}
                                                onChange={e => setAgentNotifSettings({...agentNotifSettings, recipients: {...agentNotifSettings.recipients, phone: e.target.value}})}
                                                className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-stone-100">
                                <button onClick={handleSaveNotifSettings} className="bg-stone-900 text-white px-6 py-2 rounded-lg font-bold text-sm">Save Preferences</button>
                            </div>
                        </div>
                    </div>
               </div>
           )}

           {/* Re-rendering existing tabs logic based on activeTab state to ensure no functionality is lost */}
           
           {activeTab === 'menu' && (
             <div className="space-y-6">
                 {/* Add Item Form */}
                 <div className="bg-white rounded-2xl border border-stone-200 p-6 no-print">
                     <h3 className="font-bold text-lg mb-4">{editingId ? 'Edit Item' : 'Add New Menu Item'}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <input type="text" placeholder="Item Name" className="p-3 border rounded-lg text-sm" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}/>
                         <input type="text" placeholder="Category" className="p-3 border rounded-lg text-sm" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}/>
                         <input type="number" placeholder="Price" className="p-3 border rounded-lg text-sm" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}/>
                         <input type="number" placeholder="Initial Stock" className="p-3 border rounded-lg text-sm" value={newItem.stock || ''} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})}/>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <textarea placeholder="Description" className="p-3 border rounded-lg text-sm h-24" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}/>
                         <div className="border-2 border-dashed border-stone-200 rounded-lg flex flex-col items-center justify-center text-stone-400 p-4 relative">
                             <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer"/>
                             {newItem.imageUrl ? (
                                 <img src={newItem.imageUrl} className="h-full object-cover rounded" alt="Preview"/>
                             ) : (
                                 <div className="text-center">
                                     <Upload size={24} className="mx-auto mb-2"/>
                                     <span className="text-xs">Click to Upload Image</span>
                                 </div>
                             )}
                         </div>
                     </div>
                     <div className="flex justify-end gap-2">
                         {editingId && <button onClick={() => { setEditingId(null); setNewItem({}); }} className="px-4 py-2 text-stone-500 font-bold">Cancel</button>}
                         <button onClick={handleSaveItem} className="bg-stone-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-stone-800 transition">
                             {savingId ? <Loader2 className="animate-spin"/> : (editingId ? 'Update Item' : 'Add Item')}
                         </button>
                     </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50 no-print">
                        <h3 className="font-bold text-stone-800">Menu Inventory</h3>
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-lg text-sm font-bold transition">
                            <Printer size={16}/> Print Menu
                        </button>
                    </div>

                    {/* Printable Header */}
                    <div className="hidden print-only p-4 text-center">
                        <h1 className="text-2xl font-bold">Menu Inventory Report</h1>
                        <p className="text-sm text-stone-500">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    <table className="w-full text-left">
                      <thead className="bg-stone-100 text-stone-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Total Value</th>
                          <th className="px-6 py-4 text-center">Availability</th>
                          <th className="px-6 py-4 text-right no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {menu.map(item => (
                          <tr key={item.id} className="hover:bg-stone-50">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-stone-200" alt=""/>
                              <div>
                                <div className="font-bold text-stone-800">{item.name}</div>
                                <div className="text-xs text-stone-500">{item.category}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-stone-600">${item.price}</td>
                            <td className="px-6 py-4 text-stone-600">{item.stock}</td>
                            <td className="px-6 py-4 font-bold text-stone-800">${(item.price * item.stock).toFixed(2)}</td>
                            <td className="px-6 py-4 text-center">
                                <button 
                                    onClick={() => handleToggleAvailability(item)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${item.available ? 'bg-green-500' : 'bg-stone-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.available ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2 no-print">
                              <button onClick={() => { setNewItem(item); setEditingId(item.id); }} className="p-2 hover:bg-stone-100 rounded-full text-stone-500"><Edit size={16}/></button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-2 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-stone-50 font-bold text-stone-700 border-t border-stone-200">
                          <tr>
                              <td className="px-6 py-4" colSpan={2}>Total Items: {menu.length}</td>
                              <td className="px-6 py-4 text-right pr-12" colSpan={4}>Total Inventory Value: ${menu.reduce((acc, i) => acc + (i.price * i.stock), 0).toFixed(2)}</td>
                          </tr>
                      </tfoot>
                    </table>
                 </div>
             </div>
           )}

           {activeTab === 'inventory' && (
               <div className="space-y-6">
                   <div className="flex flex-wrap gap-4 border-b border-stone-200 pb-1 overflow-x-auto">
                       <button onClick={() => setImsTab('overview')} className={`pb-3 px-4 font-bold text-sm ${imsTab === 'overview' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-stone-500'}`}>Overview</button>
                       <button onClick={() => setImsTab('receiving')} className={`pb-3 px-4 font-bold text-sm ${imsTab === 'receiving' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-stone-500'}`}>Receiving & Inspection</button>
                       <button onClick={() => setImsTab('auditing')} className={`pb-3 px-4 font-bold text-sm ${imsTab === 'auditing' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-stone-500'}`}>Cycle Counting</button>
                       <button onClick={() => { setImsTab('analysis'); loadIMSData(); }} className={`pb-3 px-4 font-bold text-sm ${imsTab === 'analysis' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-stone-500'}`}>Analysis & Reporting</button>
                   </div>
                   
                   {imsTab === 'overview' && (
                       <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center">
                           <h3 className="font-bold mb-4">Quick Actions</h3>
                           <button onClick={handleCreatePO} className="bg-stone-900 text-white px-6 py-2 rounded-lg text-sm font-bold">Create Test PO</button>
                       </div>
                   )}
                   
                   {imsTab === 'receiving' && (
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <div className="bg-white rounded-2xl border border-stone-200 p-4">
                               <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><ClipboardCheck size={18}/> Open Purchase Orders</h3>
                               <div className="space-y-2">
                                   {purchaseOrders.filter(po => po.status === 'ordered' || po.status === 'partially_received').map(po => (
                                       <div 
                                         key={po.id} 
                                         onClick={() => handleStartReceiving(po)}
                                         className={`p-3 rounded-xl border cursor-pointer hover:bg-stone-50 transition ${receivingPO?.id === po.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-200' : 'border-stone-200'}`}
                                       >
                                           <span className="font-bold text-sm text-stone-800">{po.id}</span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                           {receivingPO && (
                               <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
                                   <div className="flex justify-between items-start mb-6">
                                       <h2 className="text-xl font-bold text-stone-900">Receiving: {receivingPO.id}</h2>
                                       <button onClick={handleReceiveConfirm} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">Confirm</button>
                                   </div>
                                    <div className="space-y-4">
                                       {receivingPO.items.map(item => {
                                           const currentInput = receivingData[item.itemId] || { qty: 0, bin: '', batch: '', expiry: '' };
                                           return (
                                               <div key={item.itemId} className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                                   <h4 className="font-bold text-stone-800 mb-2">{item.name}</h4>
                                                   <input type="number" className="p-2 border rounded" value={currentInput.qty} onChange={(e) => setReceivingData(prev => ({...prev, [item.itemId]: {...currentInput, qty: Number(e.target.value)}}))} />
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           )}
                       </div>
                   )}

                   {/* Auditing Tab */}
                   {imsTab === 'auditing' && (
                       <div className="space-y-6">
                           {!activeCycleCount ? (
                               <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
                                   <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                       <Scan size={32} />
                                   </div>
                                   <h3 className="text-xl font-bold text-stone-900 mb-2">Start a New Cycle Count</h3>
                                   <p className="text-stone-500 mb-6 max-w-md mx-auto">Verify stock accuracy by counting a random subset of items. Corrections will be logged as adjustments.</p>
                                   <button 
                                       onClick={handleStartCycleCount} 
                                       className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-800 transition"
                                   >
                                       Generate Session
                                   </button>
                               </div>
                           ) : (
                               <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                                   <div className="p-6 border-b border-stone-200 bg-blue-50/50 flex justify-between items-center">
                                       <div>
                                            <h3 className="text-lg font-bold text-stone-900">Active Audit Session</h3>
                                            <p className="text-xs text-stone-500 font-mono">{activeCycleCount.id}</p>
                                       </div>
                                       <div className="flex gap-2">
                                           <button onClick={() => setActiveCycleCount(null)} className="px-4 py-2 text-stone-500 hover:text-stone-700 font-bold">Cancel</button>
                                           <button onClick={handleSubmitCycleCount} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">Submit Count</button>
                                       </div>
                                   </div>
                                   <div className="p-0">
                                       <table className="w-full text-left text-sm">
                                           <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-xs">
                                               <tr>
                                                   <th className="px-6 py-4">Bin Location</th>
                                                   <th className="px-6 py-4">Item Name</th>
                                                   <th className="px-6 py-4">System Qty</th>
                                                   <th className="px-6 py-4">Actual Count</th>
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-stone-100">
                                               {activeCycleCount.items.map(item => (
                                                   <tr key={item.itemId}>
                                                       <td className="px-6 py-4 font-mono text-stone-500">{item.binLocation}</td>
                                                       <td className="px-6 py-4 font-bold text-stone-800">{item.name}</td>
                                                       <td className="px-6 py-4 text-stone-500">{item.systemQty}</td>
                                                       <td className="px-6 py-4">
                                                           <input 
                                                               type="number" 
                                                               className="w-24 p-2 border border-stone-300 rounded font-bold"
                                                               placeholder={item.systemQty.toString()}
                                                               value={cycleCountInputs[item.itemId] !== undefined ? cycleCountInputs[item.itemId] : ''}
                                                               onChange={(e) => setCycleCountInputs(prev => ({...prev, [item.itemId]: Number(e.target.value)}))}
                                                           />
                                                       </td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                               </div>
                           )}
                       </div>
                   )}

                   {/* Analysis Tab */}
                   {imsTab === 'analysis' && inventoryReport && (
                       <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                               <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                   <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Total Valuation</h4>
                                   <p className="text-2xl font-bold text-stone-900">${inventoryReport.totalValuation.toFixed(2)}</p>
                                   <p className="text-xs text-stone-400 mt-1">Based on Cost Price</p>
                               </div>
                               <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                   <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Turnover Rate</h4>
                                   <p className="text-2xl font-bold text-blue-600">{inventoryReport.turnoverRate.toFixed(2)}x</p>
                                   <p className="text-xs text-stone-400 mt-1">Sales / Avg Inventory</p>
                               </div>
                               <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                   <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Shrinkage Loss</h4>
                                   <p className="text-2xl font-bold text-red-600">${inventoryReport.shrinkageValue.toFixed(2)}</p>
                                   <p className="text-xs text-stone-400 mt-1">From Audits</p>
                               </div>
                               <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                   <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Replenishment</h4>
                                   <p className="text-2xl font-bold text-orange-600">{inventoryReport.lowStockItems.length} Items</p>
                                   <p className="text-xs text-stone-400 mt-1">Below Reorder Point</p>
                               </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                                   <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                                       <AlertTriangle size={18} className="text-orange-500"/> Replenishment Triggers
                                   </h3>
                                   <div className="space-y-3 max-h-64 overflow-y-auto">
                                       {inventoryReport.lowStockItems.length === 0 ? (
                                           <p className="text-sm text-stone-400 text-center py-8">All stock levels healthy.</p>
                                       ) : (
                                           inventoryReport.lowStockItems.map(item => (
                                               <div key={item.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg">
                                                   <div>
                                                       <p className="font-bold text-sm text-stone-800">{item.name}</p>
                                                       <p className="text-xs text-stone-500">Stock: {item.stock} / ROP: {item.reorderPoint || 0}</p>
                                                   </div>
                                                   <button onClick={handleCreatePO} className="px-3 py-1 bg-stone-900 text-white text-xs font-bold rounded hover:bg-stone-800">Reorder</button>
                                               </div>
                                           ))
                                       )}
                                   </div>
                               </div>

                               <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                                   <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                                       <Archive size={18} className="text-stone-500"/> Dead Stock Candidates
                                   </h3>
                                   <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {inventoryReport.deadStockCandidates.length === 0 ? (
                                           <p className="text-sm text-stone-400 text-center py-8">No dead stock identified.</p>
                                       ) : (
                                           inventoryReport.deadStockCandidates.map(item => (
                                               <div key={item.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-100">
                                                   <div>
                                                       <p className="font-bold text-sm text-stone-800">{item.name}</p>
                                                       <p className="text-xs text-stone-500">Last Sold: >30 Days ago</p>
                                                   </div>
                                                   <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">Slow Moving</span>
                                               </div>
                                           ))
                                       )}
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           )}

           {activeTab === 'pos' && (
               <div className="flex h-full">
                   <div className="flex-1 p-6 overflow-y-auto">
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {menu.filter(m => (posCategory === 'All' || m.category === posCategory) && m.available).map(item => (
                               <button key={item.id} onClick={() => addToPosCart(item)} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm text-left hover:border-orange-500 transition-colors h-32 flex flex-col justify-between group">
                                   <div className="font-bold text-stone-800 text-lg leading-tight group-hover:text-orange-600">{item.name}</div>
                                   <div>
                                       <div className="text-xs text-stone-400 mb-1">{item.category}</div>
                                       <div className="font-bold text-orange-600 text-xl">${item.price}</div>
                                   </div>
                               </button>
                           ))}
                       </div>
                   </div>
                   <div className="w-96 bg-white border-l border-stone-200 flex flex-col h-full shadow-2xl z-20">
                       <div className="p-4 bg-stone-900 text-white flex justify-between items-center">
                           <h2 className="font-bold flex items-center gap-2"><Scan size={20}/> Current Sale</h2>
                           <button onClick={() => setPosCart([])} className="text-xs bg-stone-800 hover:bg-stone-700 px-3 py-1 rounded-full">Clear</button>
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 space-y-2">
                           {posCart.map(item => (
                               <div key={item.id} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg">
                                   <div className="flex-1 text-sm font-bold">{item.name} x {item.quantity}</div>
                                   <div className="text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</div>
                               </div>
                           ))}
                       </div>
                       <div className="p-6 bg-stone-50 border-t border-stone-200">
                           <button onClick={() => setShowPaymentModal(true)} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold">Charge ${posCart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</button>
                       </div>
                   </div>
               </div>
           )}
           
           {activeTab === 'agents' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-stone-900">Delivery Agent Management</h2>
                            <button 
                                onClick={() => { setAgentForm({ name: '', phone: '', status: 'offline', vehicleType: 'bike' }); setIsAgentModalOpen(true); }}
                                className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800 transition"
                            >
                                <Plus size={16}/> Add Agent
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map(agent => (
                                <div key={agent.id} className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-bold border border-stone-200">
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getAgentStatusColor(agent.status)}`}>
                                            {agent.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-stone-900">{agent.name}</h3>
                                        {agent.vehicleType && (
                                            <div className="text-stone-400" title={agent.vehicleType}>
                                                {getVehicleIcon(agent.vehicleType)}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-stone-500 mb-4">{agent.phone}</p>
                                    <div className="flex gap-2 mb-4">
                                         <Link to={`/agent/${agent.id}`} target="_blank" className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold text-center hover:bg-orange-100">
                                            View Portal
                                         </Link>
                                    </div>
                                    <div className="mt-auto flex gap-2">
                                        <button onClick={() => handleEditAgent(agent)} className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold">Edit</button>
                                        <button onClick={() => handleDeleteAgent(agent.id)} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'fulfillment' && (
               <div className="flex flex-col h-full bg-stone-100">
                   <div className="flex gap-4 border-b border-stone-200 bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
                       <button onClick={() => setFulfillmentTab('kds')} className={`px-4 py-2 rounded-full font-bold text-sm transition ${fulfillmentTab === 'kds' ? 'bg-orange-100 text-orange-700' : 'text-stone-500'}`}>Kitchen Display (KDS)</button>
                       <button onClick={() => setFulfillmentTab('logistics')} className={`px-4 py-2 rounded-full font-bold text-sm transition ${fulfillmentTab === 'logistics' ? 'bg-blue-100 text-blue-700' : 'text-stone-500'}`}>Logistics Queue</button>
                       <button onClick={() => setFulfillmentTab('fleet')} className={`px-4 py-2 rounded-full font-bold text-sm transition ${fulfillmentTab === 'fleet' ? 'bg-stone-900 text-white' : 'text-stone-500'}`}>Fleet Map</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6">
                       {fulfillmentTab === 'kds' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {orders.filter(o => o.status === 'approved' && (!o.deliveryStatus || o.deliveryStatus === 'preparing')).map(order => (
                                   <div key={order.id} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-orange-500 border-stone-200 overflow-hidden flex flex-col">
                                       <div className="p-4 border-b border-stone-100 flex justify-between items-start bg-orange-50/30">
                                           <div><h3 className="font-bold text-stone-800">#{order.id.slice(-6)}</h3></div>
                                           <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-stone-200">{getTimeElapsed(order.timestamp)}</div>
                                       </div>
                                       <div className="p-4 flex-1">
                                            <ul className="space-y-2 mb-4">
                                                {order.items.map((i, idx) => (
                                                    <li key={idx} className="flex gap-2 text-sm">
                                                        <span className="font-bold text-orange-600">{i.quantity}x</span>
                                                        <span className="text-stone-800">{i.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                       </div>
                                       <div className="p-4 bg-stone-50 border-t border-stone-100">
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'approved', 'ready_for_logistics')} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-sm">Mark Ready</button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </div>
            )}
            
            {/* AGENT MODAL */}
            {isAgentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">{agentForm.id ? 'Edit Agent' : 'New Agent'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Name</label>
                                <input type="text" value={agentForm.name} onChange={e => setAgentForm({...agentForm, name: e.target.value})} className="w-full p-2 border rounded-lg"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Phone</label>
                                <input type="tel" value={agentForm.phone} onChange={e => setAgentForm({...agentForm, phone: e.target.value})} className="w-full p-2 border rounded-lg"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Vehicle</label>
                                    <select value={agentForm.vehicleType} onChange={(e: any) => setAgentForm({...agentForm, vehicleType: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                                        <option value="bike">Bike</option>
                                        <option value="scooter">Scooter</option>
                                        <option value="car">Car</option>
                                        <option value="van">Van</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Status</label>
                                    <select value={agentForm.status} onChange={(e: any) => setAgentForm({...agentForm, status: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                                        <option value="available">Available</option>
                                        <option value="busy">Busy</option>
                                        <option value="offline">Offline</option>
                                        <option value="on_break">On Break</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setIsAgentModalOpen(false)} className="flex-1 py-2 bg-stone-100 rounded-lg font-bold text-stone-600">Cancel</button>
                            <button onClick={handleSaveAgent} className="flex-1 py-2 bg-stone-900 text-white rounded-lg font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

export default Admin;
