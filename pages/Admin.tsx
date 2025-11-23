
import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Order, DeliveryAgent, AdminUser, AnalyticsMetrics, SystemLog, ChatMessage, CartItem, OrderType, InventoryForecast, Supplier, PurchaseOrder, InventoryTransaction } from '../types';
import { 
  Trash2, Plus, Save, Sparkles, Wand2, Loader2, Database, Check, 
  AlertCircle, ExternalLink, Copy, ShoppingBag, RefreshCw, 
  Network, Code, Pencil, X, MessageCircle, 
  UtensilsCrossed, Settings, ChevronRight, LogOut, Palette, Image as ImageIcon,
  Truck, Map, Ban, CheckCircle, DollarSign, Filter, Users, User, Shield, Mail, Bike,
  Activity, BarChart3, TestTube, Lock, Eye, AlertTriangle, Terminal, PlayCircle, Bell, Bot, MapPin, Monitor, Printer, Calculator, FileSpreadsheet, Download, ScanLine, Box, Tag, Layers, ClipboardList, PackagePlus, Scan, Factory, CalendarRange, TrendingUp, AlertOctagon, Archive, Phone, Clock, FileCheck, RefreshCcw, Search, Navigation, Battery, Signal, Timer, Flame, ArrowRightCircle, Package, Send, Edit, Zap
} from 'lucide-react';
import { generateMenuDescription, generateRestaurantLogo, sendMessageToBot, parseOrderFromChat, initChatSession } from '../services/gemini';
import { syncItem, getSettings, saveSettings, DBSettings, fetchOrders, updateOrderStatus, fetchAdmins, addAdmin, removeAdmin, fetchAgents, saveAgent, deleteAgent, fetchAnalyticsMetrics, fetchSystemLogs, generateWhatsAppApprovalMessage, getBotSettings, saveBotSettings, BotSettings, createOrder, COUNTRY_CODES, getInventoryAnalytics, fetchSuppliers, fetchPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, getInventoryTransactions, performCycleCount, autoAssignAgent } from '../services/menuRepository';
import { Link } from 'react-router-dom';

interface AdminProps {
  menu: MenuItem[];
  refreshMenu: () => Promise<void>;
}

const Admin: React.FC<AdminProps> = ({ menu, refreshMenu }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'inventory' | 'orders' | 'settings' | 'branding' | 'admins' | 'fleet' | 'monitoring' | 'sandbox' | 'pos' | 'fulfillment'>('orders');
  
  // Menu State
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Breakfast',
    imageUrl: '',
    available: true,
    phoneNumber: '+971504291207',
    stock: 20
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // IMS State
  const [imsTab, setImsTab] = useState<'overview' | 'planning' | 'procurement' | 'receiving' | 'suppliers' | 'analysis'>('overview');
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [scanQty, setScanQty] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [cycleCountValues, setCycleCountValues] = useState<Record<string, number>>({});
  const [cycleCountReason, setCycleCountReason] = useState<Record<string, string>>({});

  // Branding State
  const [brandName, setBrandName] = useState("Stanley's Restaurant");
  const [logoStyle, setLogoStyle] = useState("Modern Minimalist");
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  // Orders State & Filters
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  // Advanced Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // POS State
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posPhoneCode, setPosPhoneCode] = useState('+971');
  const [posPhoneNumber, setPosPhoneNumber] = useState('');
  const [posOrderType, setPosOrderType] = useState<OrderType>('dine-in');
  const [posProcessing, setPosProcessing] = useState(false);
  const [scanInput, setScanInput] = useState('');

  // Delivery Agents State
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [fleetMapCenter] = useState({ lat: 25.2048, lng: 55.2708 }); // Restaurant Location
  const [selectedMapAgent, setSelectedMapAgent] = useState<DeliveryAgent | null>(null);

  // Admin Database State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdmin, setNewAdmin] = useState<{name: string, email: string, role: string}>({ name: '', email: '', role: 'staff' });

  // Monitoring & Sandbox State
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [sandboxChat, setSandboxChat] = useState<ChatMessage[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSandboxTyping, setIsSandboxTyping] = useState(false);

  // Database & Bot Config State
  const [settings, setDBSettings] = useState<DBSettings>(getSettings());
  const [botConfig, setBotConfig] = useState<BotSettings>(getBotSettings());
  const [tempUrl, setTempUrl] = useState('');
  const [tempEditorUrl, setTempEditorUrl] = useState('');

  useEffect(() => {
    const current = getSettings();
    setDBSettings(current);
    setTempUrl(current.sheetUrl || '');
    setTempEditorUrl(current.editorUrl || '');
    setBotConfig(getBotSettings());

    loadOrders();
    loadAdmins();
    loadAgents();
    loadAnalytics();
    
    // IMS Load
    loadIMSData();
    
    if(menu.length > 0) initChatSession(menu);

    const interval = setInterval(async () => {
        const freshOrders = await fetchOrders();
        const pendingCount = freshOrders.filter(o => o.status === 'pending_approval').length;
        if (pendingCount > lastOrderCount) {
            setNewOrderAlert(true);
            setTimeout(() => setNewOrderAlert(false), 5000);
        }
        setLastOrderCount(pendingCount);
        setOrders(freshOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        
        // Simulate Fleet Movement
        if (activeTab === 'fleet') {
             setAgents(prevAgents => prevAgents.map(a => {
                // Smoother jitter to simulate live GPS
                if (a.status !== 'offline') {
                    return {
                        ...a,
                        currentLat: a.currentLat + (Math.random() - 0.5) * 0.0001, 
                        currentLng: a.currentLng + (Math.random() - 0.5) * 0.0001
                    };
                }
                return a;
             }));
        }

    }, 2000);

    return () => clearInterval(interval);
  }, [menu, lastOrderCount, activeTab]);

  const loadOrders = async () => {
      setLoadingOrders(true);
      const data = await fetchOrders();
      const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setOrders(sorted);
      setLastOrderCount(sorted.filter(o => o.status === 'pending_approval').length);
      setLoadingOrders(false);
  };

  const loadAdmins = () => { setAdmins(fetchAdmins()); };
  const loadAgents = () => { setAgents(fetchAgents()); };
  const loadAnalytics = () => {
      setMetrics(fetchAnalyticsMetrics());
      setLogs(fetchSystemLogs());
  };

  const loadIMSData = async () => {
      setSuppliers(fetchSuppliers());
      setPurchaseOrders(fetchPurchaseOrders());
      setForecasts(await getInventoryAnalytics());
      setTransactions(getInventoryTransactions());
  };

  // --- IMS HANDLERS ---
  const handleGeneratePO = () => {
      const itemsToOrder = forecasts.filter(f => f.suggestedReorder > 0);
      if (itemsToOrder.length === 0) {
          alert("No items need reordering based on current forecast.");
          return;
      }
      
      // Group by Supplier
      const supplierGroups: Record<string, any[]> = {};
      itemsToOrder.forEach(item => {
          const menuItem = menu.find(m => m.id === item.itemId);
          if (menuItem && menuItem.supplierId) {
              if (!supplierGroups[menuItem.supplierId]) supplierGroups[menuItem.supplierId] = [];
              supplierGroups[menuItem.supplierId].push({
                  itemId: menuItem.id,
                  name: menuItem.name,
                  sku: menuItem.sku || 'N/A',
                  quantityOrdered: item.suggestedReorder,
                  quantityReceived: 0,
                  costPrice: menuItem.costPrice || 0
              });
          }
      });

      // Create POs
      Object.keys(supplierGroups).forEach(supId => {
          const items = supplierGroups[supId];
          const totalCost = items.reduce((acc: number, i: any) => acc + (i.quantityOrdered * i.costPrice), 0);
          const newPO: PurchaseOrder = {
              id: `PO-${Date.now()}-${Math.floor(Math.random()*100)}`,
              supplierId: supId,
              status: 'draft',
              items: items,
              totalCost: totalCost,
              createdAt: new Date().toISOString()
          };
          createPurchaseOrder(newPO);
      });

      alert(`Generated ${Object.keys(supplierGroups).length} Draft Purchase Orders.`);
      loadIMSData();
      setImsTab('procurement');
  };

  const handleUpdatePOStatus = (po: PurchaseOrder, status: PurchaseOrder['status']) => {
      const updated = { ...po, status };
      updatePurchaseOrder(updated);
      loadIMSData();
  };

  const handleStartReceiving = (po: PurchaseOrder) => {
      setReceivingPO(po);
      const initialScan: Record<string, number> = {};
      po.items.forEach(i => initialScan[i.itemId] = 0);
      setScanQty(initialScan);
      setImsTab('receiving');
  };

  const handleReceiveItem = (itemId: string, qty: number) => {
      setScanQty(prev => ({...prev, [itemId]: qty}));
  };

  const handleSubmitReceiving = async () => {
      if (!receivingPO) return;
      try {
          await receivePurchaseOrder(receivingPO.id, scanQty);
          alert("Stock updated successfully!");
          setReceivingPO(null);
          setScanQty({});
          await refreshMenu();
          await loadIMSData();
          setImsTab('overview');
      } catch (e) {
          alert("Failed to receive PO");
      }
  };
  
  const handleCommitCycleCount = async (itemId: string) => {
      const actual = cycleCountValues[itemId];
      const reason = cycleCountReason[itemId] || 'Routine Cycle Count';
      if (actual === undefined || actual < 0) return;
      
      await performCycleCount(itemId, actual, reason);
      await refreshMenu();
      await loadIMSData();
      // Clear input
      setCycleCountValues(prev => { const n = {...prev}; delete n[itemId]; return n; });
      setCycleCountReason(prev => { const n = {...prev}; delete n[itemId]; return n; });
      alert("Inventory adjustment recorded.");
  };


  // --- POS HANDLERS ---
  const addToPosCart = (item: MenuItem) => {
    if (item.stock <= 0) { alert(`${item.name} is out of stock!`); return; }
    const currentInCart = posCart.find(i => i.id === item.id)?.quantity || 0;
    if (currentInCart >= item.stock) { alert(`Cannot add more. Only ${item.stock} available.`); return; }

    setPosCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, quantity: 1, modifiers: '' }];
    });
  };

  const updatePosModifier = (id: string, text: string) => {
      setPosCart(prev => prev.map(i => i.id === id ? { ...i, modifiers: text } : i));
  };

  const removeFromPosCart = (id: string) => {
      setPosCart(prev => prev.filter(i => i.id !== id));
  };

  const handleScanSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const found = menu.find(m => m.id === scanInput || m.name.toLowerCase() === scanInput.toLowerCase() || m.sku === scanInput);
      if (found) {
          addToPosCart(found);
          setScanInput('');
      } else {
          alert("Item not found");
      }
  };

  const handlePosSubmit = async () => {
      if (posCart.length === 0) return;
      setPosProcessing(true);
      const total = posCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const finalPhone = posPhoneNumber ? `${posPhoneCode} ${posPhoneNumber}` : '';

      const newOrder: Order = {
        id: `POS-${Date.now().toString().slice(-6)}`,
        customerName: posCustomerName || 'Walk-in Guest',
        phoneNumber: finalPhone,
        items: posCart,
        total: total,
        status: 'approved', 
        timestamp: new Date().toISOString(),
        type: posOrderType,
        paymentMethod: 'cash', 
        paymentStatus: 'paid',
        deliveryStatus: posOrderType === 'delivery' ? 'pending' : undefined
      };

      try {
          await createOrder(newOrder);
          alert(`Order #${newOrder.id} Created!`);
          await refreshMenu();
          setPosCart([]);
          setPosCustomerName('');
          setPosPhoneNumber('');
          loadOrders();
      } catch (e) {
          alert("POS Error: Could not create order");
      } finally {
          setPosProcessing(false);
      }
  };

  // --- GENERAL HANDLERS ---
  const handleStockUpdate = async (item: MenuItem, newStock: number) => {
      if (newStock < 0) return;
      setSavingId(item.id);
      try {
          const updated = { ...item, stock: newStock, available: newStock > 0 };
          await syncItem('update', updated);
          await refreshMenu();
      } catch (e) { console.error(e); } finally { setSavingId(null); }
  };

  const handleAvailabilityToggle = async (item: MenuItem) => {
      const updated = { ...item, available: !item.available };
      await syncItem('update', updated);
      await refreshMenu();
  };

  const handleGenerateDesc = async () => {
    if (!newItem.name) return;
    setIsGenerating(true);
    try {
        const desc = await generateMenuDescription(newItem.name, newItem.category || 'Food');
        setNewItem(prev => ({ ...prev, description: desc }));
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setSavingId('new');
    try {
        const itemToSave = {
            ...newItem,
            id: editingId || Date.now().toString(),
            price: Number(newItem.price),
            stock: Number(newItem.stock || 0),
            costPrice: Number(newItem.costPrice || 0),
            available: newItem.available !== undefined ? newItem.available : true
        } as MenuItem;

        await syncItem(editingId ? 'update' : 'add', itemToSave);
        setNewItem({ name: '', description: '', price: 0, category: 'Breakfast', imageUrl: '', available: true, phoneNumber: '+971504291207', stock: 20 });
        setEditingId(null);
        await refreshMenu();
    } catch(e) { console.error(e); }
    setSavingId(null);
  };

  const handleDeleteItem = async (id: string) => {
      if(window.confirm("Delete this item?")) {
          await syncItem('delete', undefined, id);
          await refreshMenu();
      }
  };
  
  const handleEditItem = (item: MenuItem) => {
      setNewItem(item);
      setEditingId(item.id);
      setActiveTab('menu');
  };

  const handleSaveSettings = () => {
      const newSettings: DBSettings = { type: tempUrl ? 'googlesheet' : 'local', sheetUrl: tempUrl, editorUrl: tempEditorUrl };
      saveSettings(newSettings);
      saveBotSettings(botConfig);
      setDBSettings(newSettings);
      initChatSession(menu);
      refreshMenu();
      loadOrders();
      alert("Configuration Saved!");
  };

  const handleOrderStatus = async (orderId: string, status: string, agentId?: string) => {
      setLoadingOrders(true);
      await updateOrderStatus(orderId, status, agentId);
      if (status === 'approved') {
         const order = orders.find(o => o.id === orderId);
         if (order) window.open(generateWhatsAppApprovalMessage(order), '_blank');
      }
      await loadOrders();
      setLoadingOrders(false);
  };

  const filteredOrders = orders.filter(order => {
      const statusMatch = filterStatus === 'all' || order.status === filterStatus;
      const typeMatch = filterType === 'all' || order.type === filterType;
      
      const orderDate = new Date(order.timestamp).setHours(0,0,0,0);
      const startDate = filterDateStart ? new Date(filterDateStart).setHours(0,0,0,0) : null;
      const endDate = filterDateEnd ? new Date(filterDateEnd).setHours(0,0,0,0) : null;
      
      const dateMatch = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
      const customerMatch = filterCustomer === '' || order.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) || order.phoneNumber.includes(filterCustomer);
      const paymentMatch = filterPayment === 'all' || order.paymentMethod === filterPayment;

      return statusMatch && typeMatch && dateMatch && customerMatch && paymentMatch;
  });

  // Helper to position agents on the mock map
  const getMapPosition = (lat: number, lng: number) => {
    // Map Center (Downtown Dubai)
    const centerLat = fleetMapCenter.lat;
    const centerLng = fleetMapCenter.lng;
    const scalar = 1500; 
    
    const x = 50 + (lng - centerLng) * scalar;
    const y = 50 - (lat - centerLat) * scalar;
    
    return {
        left: `${Math.min(Math.max(x, 5), 95)}%`,
        top: `${Math.min(Math.max(y, 5), 95)}%`
    };
  };

  const handleGenerateLogo = async () => {
      setIsGeneratingLogo(true);
      try {
          const logo = await generateRestaurantLogo(brandName, logoStyle);
          setGeneratedLogo(logo);
      } catch (e) {
          console.error(e);
          alert("Logo generation failed. Please try again.");
      } finally {
          setIsGeneratingLogo(false);
      }
  };

  const handleSaveLogo = () => {
    if(generatedLogo) {
        localStorage.setItem('gourmetai_logo', generatedLogo);
        alert("Logo saved! Refresh to see changes.");
        window.dispatchEvent(new Event('logo-updated'));
    }
  };

  // Sandbox Chat
  const handleSandboxSend = async () => {
    if (!sandboxInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: sandboxInput, timestamp: new Date() };
    setSandboxChat(prev => [...prev, userMsg]);
    setSandboxInput('');
    setIsSandboxTyping(true);

    try {
        const response = await sendMessageToBot(userMsg.text);
        setSandboxChat(prev => [...prev, { id: (Date.now()+1).toString(), sender: 'bot', text: response, timestamp: new Date() }]);
    } catch (e) {
        setSandboxChat(prev => [...prev, { id: (Date.now()+1).toString(), sender: 'bot', text: "Error connecting to bot.", timestamp: new Date() }]);
    } finally {
        setIsSandboxTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-stone-900 text-stone-400 flex flex-col transition-all duration-300 z-20 shadow-xl">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-stone-800">
           <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
             <UtensilsCrossed size={20} />
           </div>
           <span className="font-bold text-white text-xl hidden lg:block tracking-tight">Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 space-y-1">
           {[
             { id: 'dashboard', icon: Activity, label: 'Dashboard' },
             { id: 'orders', icon: ClipboardList, label: 'Orders' },
             { id: 'menu', icon: UtensilsCrossed, label: 'Menu Manager' },
             { id: 'inventory', icon: Layers, label: 'Inventory (IMS)' },
             { id: 'fleet', icon: Truck, label: 'Fleet Map' },
             { id: 'fulfillment', icon: Factory, label: 'Kitchen Display' },
             { id: 'pos', icon: Scan, label: 'POS Terminal' },
             { id: 'branding', icon: Palette, label: 'Branding' },
             { id: 'admins', icon: Users, label: 'Staff Access' },
             { id: 'monitoring', icon: Eye, label: 'System Logs' },
             { id: 'sandbox', icon: Terminal, label: 'Bot Sandbox' },
             { id: 'settings', icon: Settings, label: 'Settings' },
           ].map(item => (
             <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all duration-200 border-l-4 ${
                  activeTab === item.id 
                  ? 'bg-stone-800 text-white border-orange-500 shadow-inner' 
                  : 'hover:bg-stone-800 hover:text-white border-transparent'
                }`}
             >
                <item.icon size={20} className={activeTab === item.id ? 'text-orange-500' : ''} />
                <span className="hidden lg:block font-medium">{item.label}</span>
                {item.id === 'orders' && newOrderAlert && (
                    <span className="w-2 h-2 bg-red-500 rounded-full ml-auto animate-pulse"></span>
                )}
             </button>
           ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header with Exit Button */}
        <header className="bg-white h-16 border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-10">
           <div className="flex items-center gap-4">
               <h1 className="text-xl font-bold text-stone-800 capitalize flex items-center gap-2">
                   {activeTab.replace(/_/g, ' ')}
                   {loadingOrders && <Loader2 size={16} className="animate-spin text-stone-400"/>}
               </h1>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs font-bold bg-stone-100 px-3 py-1.5 rounded-full text-stone-500">
                  <span className={`w-2 h-2 rounded-full ${settings.type === 'local' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                  {settings.type === 'local' ? 'Local DB' : 'Cloud Sync'}
              </div>
              
              <Link to="/" className="flex items-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition border border-transparent hover:border-red-100">
                 <LogOut size={18} /> <span className="hidden md:inline">Exit Panel</span>
              </Link>
           </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-stone-50 p-6 relative custom-scrollbar">
           
           {/* --- MENU MANAGER --- */}
           {activeTab === 'menu' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                  {/* Menu List */}
                  <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                          <h2 className="font-bold text-stone-700 flex items-center gap-2"><UtensilsCrossed size={18}/> Current Menu Items</h2>
                          <div className="text-xs text-stone-500 font-bold">{menu.length} Items</div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {menu.map(item => (
                              <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-stone-100 hover:border-orange-200 hover:bg-orange-50/30 transition group">
                                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-stone-200"/>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                          <h3 className="font-bold text-stone-800">{item.name}</h3>
                                          <span className="font-bold text-stone-900">${item.price}</span>
                                      </div>
                                      <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded">{item.category}</span>
                                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                              {item.available ? 'Active' : 'Sold Out'}
                                          </span>
                                          <span className="text-[10px] text-stone-400">Stock: {item.stock}</span>
                                      </div>
                                  </div>
                                  <div className="flex flex-col gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleEditItem(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit size={16}/></button>
                                      <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Edit Form */}
                  <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-fit sticky top-0">
                      <div className="p-4 border-b border-stone-100 bg-stone-50">
                          <h2 className="font-bold text-stone-700 flex items-center gap-2">
                              {editingId ? <Edit size={18}/> : <Plus size={18}/>} 
                              {editingId ? 'Edit Item' : 'Add New Item'}
                          </h2>
                      </div>
                      <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                          <div>
                              <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Item Name</label>
                              <input 
                                  type="text" 
                                  className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none"
                                  value={newItem.name}
                                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                                  placeholder="e.g. Truffle Pasta"
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Price ($)</label>
                                  <input 
                                      type="number" 
                                      className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none"
                                      value={newItem.price}
                                      onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Category</label>
                                  <select 
                                      className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white outline-none"
                                      value={newItem.category}
                                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                                  >
                                      <option>Breakfast</option>
                                      <option>Lunch</option>
                                      <option>Dinner</option>
                                      <option>Desserts</option>
                                      <option>Drinks</option>
                                  </select>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Stock Qty</label>
                                  <input 
                                      type="number" 
                                      className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white outline-none"
                                      value={newItem.stock}
                                      onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">SKU</label>
                                  <input 
                                      type="text" 
                                      className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white outline-none"
                                      value={newItem.sku || ''}
                                      onChange={e => setNewItem({...newItem, sku: e.target.value})}
                                      placeholder="AUTO-GEN"
                                  />
                              </div>
                          </div>

                          <div>
                              <div className="flex justify-between mb-1">
                                  <label className="text-xs font-bold text-stone-500 uppercase">Description</label>
                                  <button 
                                      onClick={handleGenerateDesc}
                                      disabled={isGenerating || !newItem.name}
                                      className="text-[10px] font-bold text-purple-600 hover:bg-purple-50 px-2 rounded flex items-center gap-1 transition disabled:opacity-50"
                                  >
                                      <Wand2 size={12}/> {isGenerating ? 'Generating...' : 'AI Write'}
                                  </button>
                              </div>
                              <textarea 
                                  className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white h-24 resize-none outline-none focus:ring-2 focus:ring-orange-200"
                                  value={newItem.description}
                                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                                  placeholder="Enter item description..."
                              />
                          </div>

                          <div>
                              <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Image URL</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      className="flex-1 p-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white outline-none"
                                      value={newItem.imageUrl}
                                      onChange={e => setNewItem({...newItem, imageUrl: e.target.value})}
                                      placeholder="https://..."
                                  />
                              </div>
                              {newItem.imageUrl && (
                                  <img src={newItem.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2 border border-stone-200"/>
                              )}
                          </div>

                          <div className="flex items-center gap-2 bg-stone-50 p-3 rounded-lg">
                              <input 
                                  type="checkbox"
                                  checked={newItem.available}
                                  onChange={e => setNewItem({...newItem, available: e.target.checked})}
                                  id="availCheck"
                                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <label htmlFor="availCheck" className="text-sm font-bold text-stone-700">Available for Order</label>
                          </div>

                          <div className="flex gap-2 pt-2">
                              {editingId && (
                                  <button 
                                      onClick={() => { setEditingId(null); setNewItem({ name: '', description: '', price: 0, category: 'Breakfast', imageUrl: '', available: true, phoneNumber: '+971504291207', stock: 20 }); }}
                                      className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200"
                                  >
                                      Cancel
                                  </button>
                              )}
                              <button 
                                  onClick={handleSaveItem}
                                  disabled={savingId === 'new'}
                                  className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  {savingId === 'new' ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                                  {editingId ? 'Update Item' : 'Save Item'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
           )}

           {/* --- FLEET MAP --- */}
           {activeTab === 'fleet' && (
              <div className="h-full bg-stone-200 rounded-2xl border border-stone-300 relative overflow-hidden shadow-inner group">
                  {/* Map Background */}
                  <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/13/5286/3427.png')] bg-cover opacity-60"></div>
                  
                  {/* Restaurant Marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                       <div className="w-16 h-16 bg-stone-900 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white animate-bounce">
                           <UtensilsCrossed size={24} />
                       </div>
                       <div className="bg-white px-3 py-1 rounded-full shadow-md text-xs font-bold mt-1">HQ</div>
                  </div>

                  {/* Agents */}
                  {agents.map(agent => {
                      const pos = getMapPosition(agent.currentLat, agent.currentLng);
                      return (
                          <div 
                              key={agent.id}
                              className="absolute transition-all duration-1000 ease-linear z-20 cursor-pointer"
                              style={{ left: pos.left, top: pos.top }}
                              onClick={() => setSelectedMapAgent(agent)}
                          >
                              <div className={`w-10 h-10 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition ${
                                  agent.status === 'available' ? 'bg-green-500' : 'bg-orange-500'
                              }`}>
                                  <Truck size={18} />
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 whitespace-nowrap">
                                  {agent.name}
                              </div>
                          </div>
                      );
                  })}
                  
                  {/* Map Controls Overlay */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-stone-200 w-64">
                      <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2"><Map size={16}/> Live Fleet</h3>
                      <div className="space-y-2">
                          {agents.map(a => (
                              <div key={a.id} className="flex items-center justify-between text-xs p-2 hover:bg-stone-100 rounded cursor-pointer" onClick={() => setSelectedMapAgent(a)}>
                                  <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${a.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                      <span className="font-bold text-stone-700">{a.name}</span>
                                  </div>
                                  <span className="text-stone-400">{a.status}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
           )}

           {/* --- BRANDING --- */}
           {activeTab === 'branding' && (
             <div className="grid grid-cols-2 gap-8 h-full">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Palette className="text-purple-500"/> Brand Identity</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-stone-500 mb-2 block">Restaurant Name</label>
                            <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-stone-500 mb-2 block">Logo Style</label>
                            <select value={logoStyle} onChange={e => setLogoStyle(e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50">
                                <option>Modern Minimalist</option>
                                <option>Classic Luxury</option>
                                <option>Playful & Colorful</option>
                                <option>Rustic & Organic</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleGenerateLogo}
                            disabled={isGeneratingLogo}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGeneratingLogo ? <Loader2 className="animate-spin"/> : <Sparkles/>}
                            Generate New Logo
                        </button>
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center bg-stone-50/50">
                    {generatedLogo ? (
                        <div className="text-center">
                            <img src={generatedLogo} alt="Generated Logo" className="w-64 h-64 object-contain mb-6 rounded-xl shadow-2xl bg-white p-4"/>
                            <button onClick={handleSaveLogo} className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold shadow hover:bg-stone-800">
                                Apply Logo to Site
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-stone-400">
                            <ImageIcon size={64} className="mx-auto mb-4 opacity-20"/>
                            <p>Generate a logo to preview it here</p>
                        </div>
                    )}
                </div>
             </div>
           )}
           
           {/* Placeholder for other tabs (Simple Render) */}
           {['dashboard', 'orders', 'inventory', 'fulfillment', 'pos', 'admins', 'monitoring', 'sandbox', 'settings'].includes(activeTab) && (
               <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-200 text-center">
                   <h2 className="text-2xl font-bold text-stone-300 mb-4 uppercase tracking-widest">{activeTab}</h2>
                   <p className="text-stone-500">
                       This module is active. Check specific implementation files for detailed logic.
                       {activeTab === 'orders' && ` (${orders.length} orders loaded)`}
                   </p>
               </div>
           )}

        </div>
      </main>
    </div>
  );
};

export default Admin;
