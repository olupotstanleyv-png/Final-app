
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
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
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
  const [posCategory, setPosCategory] = useState('All');
  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Delivery Agents State
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [fleetMapCenter] = useState({ lat: 25.2048, lng: 55.2708 }); // Restaurant Location
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Partial<DeliveryAgent>>({});
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
        
        // Simulate Fleet Movement if on fleet tab
        if (activeTab === 'fleet') {
             setAgents(prevAgents => prevAgents.map(a => {
                // Small jitter to simulate live GPS - Increased magnitude slightly for better visibility
                if (a.status !== 'offline') {
                    return {
                        ...a,
                        currentLat: a.currentLat + (Math.random() - 0.5) * 0.0004, 
                        currentLng: a.currentLng + (Math.random() - 0.5) * 0.0004
                    };
                }
                return a;
             }));
        }

    }, 2000); // Faster update rate for GPS feel

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

  // --- FULFILLMENT (KDS & LOGISTICS) HANDLERS ---
  const handleKDSAction = async (orderId: string, action: 'start_prep' | 'mark_ready' | 'dispatch') => {
      setLoadingOrders(true);
      let newStatus: string = 'approved';
      let newDeliveryStatus: string = 'pending';

      if (action === 'start_prep') {
          newDeliveryStatus = 'preparing';
      } else if (action === 'mark_ready') {
          // Moves to Logistics Queue
          newDeliveryStatus = 'ready_for_logistics';
      } else if (action === 'dispatch') {
           // Direct completion (for Dine-in / Pickup without advanced flow)
           newStatus = 'completed';
           newDeliveryStatus = 'delivered'; 
      }

      await updateOrderStatus(orderId, newStatus, undefined, newDeliveryStatus);
      await loadOrders();
      setLoadingOrders(false);
  };

  const handleLogisticsAction = async (orderId: string, action: 'pick' | 'pack' | 'ship' | 'auto_assign', agentId?: string) => {
      setLoadingOrders(true);
      let newDeliveryStatus = 'ready_for_logistics';
      let assignedAgentId = agentId;

      if (action === 'auto_assign') {
          const agent = await autoAssignAgent(orderId);
          if (agent) {
              assignedAgentId = agent.id;
              newDeliveryStatus = 'ready_for_logistics'; // Remains here, but with agent assigned, driver will see it
          } else {
              alert("No available agents found!");
          }
      } else {
          if (action === 'pick') newDeliveryStatus = 'picking';
          if (action === 'pack') newDeliveryStatus = 'packing';
          if (action === 'ship') newDeliveryStatus = 'on_way';
          await updateOrderStatus(orderId, 'approved', assignedAgentId, newDeliveryStatus);
      }
      
      await loadOrders();
      await loadAgents(); // Refresh agent status if auto-assigned
      setLoadingOrders(false);
  };


  // Helper to format elapsed time
  const getElapsedTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
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

  const handleExportCSV = () => {
      const headers = ["Order ID", "Date", "Time", "Customer Name", "Phone", "Delivery Address", "Type", "Status", "Total", "Payment", "Items"];
      const rows = filteredOrders.map(order => {
          const dateObj = new Date(order.timestamp);
          const itemsStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
          return [order.id, dateObj.toLocaleDateString(), dateObj.toLocaleTimeString(), `"${order.customerName}"`, `'${order.phoneNumber}`, `"${order.deliveryAddress || 'N/A'}"`, order.type, order.status, order.total.toFixed(2), order.paymentMethod, `"${itemsStr}"`].join(',');
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `orders_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Helper to position agents on the mock map
  const getMapPosition = (lat: number, lng: number) => {
    // Map Center (Downtown Dubai)
    const centerLat = fleetMapCenter.lat;
    const centerLng = fleetMapCenter.lng;
    
    // Scale Factor (Degrees to % offset) - Adjusted for demo visuals
    const scalar = 1500; 
    
    const x = 50 + (lng - centerLng) * scalar;
    const y = 50 - (lat - centerLat) * scalar;
    
    // Clamp to keep inside map box
    return {
        left: `${Math.min(Math.max(x, 5), 95)}%`,
        top: `${Math.min(Math.max(y, 5), 95)}%`
    };
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

  const handleGenerateLogo = async () => {
      setIsGeneratingLogo(true);
      try {
          const logo = await generateRestaurantLogo(brandName, logoStyle);
          if (logo) {
              setGeneratedLogo(logo);
              localStorage.setItem('gourmetai_logo', logo);
              window.dispatchEvent(new Event('logo-updated'));
          }
      } catch (e) {
          alert("Failed to generate logo. Please try again.");
      } finally {
          setIsGeneratingLogo(false);
      }
  };

  const handleAddAdmin = () => {
      if (!newAdmin.name || !newAdmin.email) return;
      addAdmin({
          id: Date.now().toString(),
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role as any,
          status: 'active',
          lastLogin: new Date().toISOString()
      });
      setNewAdmin({ name: '', email: '', role: 'staff' });
      loadAdmins();
  };

  // Agent CRUD
  const handleAddAgent = () => {
      setCurrentAgent({});
      setIsAgentModalOpen(true);
  };

  const handleEditAgent = (agent: DeliveryAgent) => {
      setCurrentAgent(agent);
      setIsAgentModalOpen(true);
  };

  const handleSaveAgent = () => {
      if (!currentAgent.name || !currentAgent.phone) {
          alert("Please provide name and phone");
          return;
      }
      saveAgent(currentAgent);
      setIsAgentModalOpen(false);
      loadAgents();
  };

  const handleDeleteAgent = (id: string) => {
      if(confirm("Are you sure you want to delete this agent?")) {
          deleteAgent(id);
          loadAgents();
      }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${activeTab === id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`}>
        <Icon size={20} /> <span className="font-medium text-sm">{label}</span> {activeTab === id && <ChevronRight size={14} className="ml-auto opacity-50"/>}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans">
        {/* NOTIFICATION */}
        {newOrderAlert && (
            <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-right print:hidden">
                <div className="bg-stone-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-stone-700">
                    <Bell size={20} className="text-green-400 animate-pulse" />
                    <div><h4 className="font-bold text-sm">New Order!</h4><p className="text-xs text-stone-400">Check Order Manager</p></div>
                    <button onClick={() => setNewOrderAlert(false)} className="ml-4 hover:text-stone-300"><X size={18}/></button>
                </div>
            </div>
        )}

        {/* SIDEBAR */}
        <div className="w-full md:w-64 bg-white border-r border-stone-200 md:h-screen sticky top-0 z-30 flex-shrink-0 custom-scrollbar overflow-y-auto print:hidden">
            <div className="p-6 border-b border-stone-100">
                <div className="flex items-center gap-3 text-stone-900">
                    <div className="p-2 bg-stone-900 rounded-lg text-white"><Database size={20} /></div>
                    <div><h1 className="font-bold text-lg leading-none">Admin Panel</h1><p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider mt-1">v3.1 Enterprise</p></div>
                </div>
            </div>
            <div className="p-4">
                <p className="text-xs font-bold text-stone-400 uppercase mb-4 px-2">Operations</p>
                <nav className="space-y-1">
                    <NavItem id="monitoring" icon={Activity} label="Live Monitoring" />
                    <NavItem id="pos" icon={Monitor} label="POS Terminal" />
                    <NavItem id="orders" icon={ShoppingBag} label="Order Manager" />
                    <NavItem id="fulfillment" icon={ClipboardList} label="Kitchen Fulfillment" />
                    <NavItem id="fleet" icon={Truck} label="Delivery Fleet" />
                </nav>
                <p className="text-xs font-bold text-stone-400 uppercase mt-8 mb-4 px-2">Management</p>
                <nav className="space-y-1">
                    <NavItem id="menu" icon={UtensilsCrossed} label="Menu Manager" />
                    <NavItem id="inventory" icon={Box} label="Inventory (IMS)" />
                    <NavItem id="admins" icon={Users} label="Access Control" />
                    <NavItem id="branding" icon={Palette} label="Branding" />
                </nav>
                <p className="text-xs font-bold text-stone-400 uppercase mt-8 mb-4 px-2">Dev & Config</p>
                <nav className="space-y-1">
                    <NavItem id="sandbox" icon={TestTube} label="Sandbox" />
                    <NavItem id="settings" icon={Settings} label="Configuration" />
                </nav>
            </div>
        </div>

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-50 print:h-auto print:overflow-visible">
            
            {/* TOP BAR */}
            <header className="bg-white border-b border-stone-200 h-16 px-8 flex items-center justify-between shrink-0 print:hidden z-20">
                <div className="flex items-center gap-4 text-stone-500">
                    <span className="text-sm font-medium">Dashboard</span>
                    <span className="text-stone-300">/</span>
                    <span className="text-sm font-bold text-stone-900 capitalize">{activeTab}</span>
                </div>
                
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition ${activeTab === 'inventory' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                     >
                        <Box size={16} className={activeTab === 'inventory' ? "text-orange-600" : "text-orange-400"}/> 
                        <span>Inventory System (IMS)</span>
                     </button>
                     
                     <div className="h-6 w-px bg-stone-200"></div>

                     {/* Exit Button - Moved from sidebar */}
                     <Link to="/" className="flex items-center gap-2 text-stone-500 hover:text-red-600 transition text-sm font-medium bg-stone-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100">
                        <LogOut size={16} /> <span className="hidden lg:inline">Exit Panel</span>
                     </Link>

                     <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-stone-500 border border-stone-300 cursor-pointer hover:bg-stone-300 transition">
                        <User size={16}/>
                     </div>
                </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar print:p-0 print:overflow-visible relative">
                
                {/* ORDER FULFILLMENT (KDS) & LOGISTICS */}
                {activeTab === 'fulfillment' && (
                    <div className="h-full flex flex-col animate-in fade-in gap-8">
                        {/* SECTION 1: KITCHEN DISPLAY SYSTEM (COOKING) */}
                        <div className="flex-shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                                        <Flame className="text-orange-600"/> Kitchen Display System
                                    </h2>
                                    <p className="text-stone-500 text-sm">Live cooking queue.</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-stone-500 bg-white px-4 py-2 rounded-lg border border-stone-200">
                                    <Clock size={16}/> {new Date().toLocaleTimeString()}
                                </div>
                            </div>

                            <div className="flex gap-6 overflow-x-auto pb-4">
                                {/* COLUMN 1: KITCHEN QUEUE */}
                                <div className="w-80 md:w-96 flex flex-col bg-stone-200/50 rounded-xl p-2 h-[500px] flex-shrink-0">
                                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm mb-3 border-l-4 border-stone-500">
                                        <h3 className="font-bold text-stone-700 uppercase text-sm tracking-wider">Pending</h3>
                                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs font-bold">
                                            {orders.filter(o => o.status === 'approved' && (o.deliveryStatus === 'pending' || !o.deliveryStatus)).length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                        {orders.filter(o => o.status === 'approved' && (o.deliveryStatus === 'pending' || !o.deliveryStatus)).map(order => (
                                            <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-stone-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-stone-800">#{order.id.slice(-4)}</div>
                                                    <div className="text-xs text-stone-400">{getElapsedTime(order.timestamp)}</div>
                                                </div>
                                                <div className="space-y-1 mb-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="text-sm flex justify-between">
                                                            <span>{item.name}</span>
                                                            <span className="font-bold">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => handleKDSAction(order.id, 'start_prep')} className="w-full bg-stone-900 text-white py-2 rounded text-sm font-bold hover:bg-orange-600 transition">Start Prep</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COLUMN 2: PREPARING */}
                                <div className="w-80 md:w-96 flex flex-col bg-orange-50 rounded-xl p-2 h-[500px] flex-shrink-0 border border-orange-100">
                                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm mb-3 border-l-4 border-orange-500">
                                        <h3 className="font-bold text-orange-800 uppercase text-sm tracking-wider">Cooking</h3>
                                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs font-bold">
                                            {orders.filter(o => o.status === 'approved' && o.deliveryStatus === 'preparing').length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                        {orders.filter(o => o.status === 'approved' && o.deliveryStatus === 'preparing').map(order => (
                                            <div key={order.id} className="bg-white p-4 rounded-lg shadow-md border border-orange-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-stone-800">#{order.id.slice(-4)}</div>
                                                    <div className="text-xs text-orange-600 animate-pulse font-bold">Cooking...</div>
                                                </div>
                                                <div className="space-y-1 mb-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="text-sm flex justify-between">
                                                            <span>{item.name}</span>
                                                            <span className="font-bold">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => handleKDSAction(order.id, 'mark_ready')} className="w-full bg-green-600 text-white py-2 rounded text-sm font-bold hover:bg-green-500 transition">Mark Ready for Dispatch</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: LOGISTICS & FULFILLMENT QUEUE */}
                        <div className="flex-1 border-t border-stone-200 pt-8">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                                        <Package className="text-blue-600"/> Order Fulfillment Queue
                                    </h2>
                                    <p className="text-stone-500 text-sm">Logistics workflow: Assign -> Pick -> Pack -> Ship.</p>
                                </div>
                            </div>

                            <div className="bg-white shadow-sm border border-stone-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-100 text-stone-600 text-xs font-bold uppercase border-b border-stone-200">
                                        <tr>
                                            <th className="p-4">Order ID</th>
                                            <th className="p-4">Logistics Status</th>
                                            <th className="p-4">Items</th>
                                            <th className="p-4">Address</th>
                                            <th className="p-4">Assigned Agent</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {orders.filter(o => o.status === 'approved' && ['ready_for_logistics', 'picking', 'packing', 'picked_up', 'on_way', 'delivered'].includes(o.deliveryStatus || '')).length === 0 && (
                                            <tr><td colSpan={6} className="p-8 text-center text-stone-400 italic">No orders in logistics queue. Wait for kitchen to complete orders.</td></tr>
                                        )}
                                        {orders.filter(o => o.status === 'approved' && ['ready_for_logistics', 'picking', 'packing', 'picked_up'].includes(o.deliveryStatus || '')).map(order => {
                                            const status = order.deliveryStatus || 'ready_for_logistics';
                                            return (
                                                <tr key={order.id} className="hover:bg-stone-50 transition">
                                                    <td className="p-4 font-mono font-bold text-stone-900">
                                                        <Link to={`/admin/orders/${order.id}`} className="hover:underline text-blue-600">{order.id.slice(-6)}</Link>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                            status === 'ready_for_logistics' ? 'bg-yellow-100 text-yellow-700' :
                                                            status === 'picking' ? 'bg-purple-100 text-purple-700' :
                                                            status === 'packing' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                            {status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs text-stone-600 max-w-xs truncate">
                                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                                    </td>
                                                    <td className="p-4 text-xs text-stone-600 max-w-xs truncate">
                                                        {order.deliveryAddress || 'Pickup / Dine-in'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <select 
                                                                className="p-1.5 border border-stone-200 rounded text-xs bg-white"
                                                                value={order.deliveryAgentId || ''}
                                                                onChange={(e) => updateOrderStatus(order.id, order.status, e.target.value, order.deliveryStatus)}
                                                            >
                                                                <option value="">Assign Agent...</option>
                                                                {agents.map(a => (
                                                                    <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                                                                ))}
                                                            </select>
                                                            {/* AUTO ASSIGN BUTTON */}
                                                            {!order.deliveryAgentId && (
                                                                <button 
                                                                    onClick={() => handleLogisticsAction(order.id, 'auto_assign')}
                                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1.5 rounded text-xs font-bold flex items-center gap-1"
                                                                    title="Auto Assign Nearest Driver"
                                                                >
                                                                    <Zap size={12}/> Auto
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {status === 'ready_for_logistics' && (
                                                                <span className="text-xs text-stone-400 italic">Waiting for pickup...</span>
                                                            )}
                                                            {status === 'picking' && (
                                                                <span className="text-xs text-purple-600 font-bold">Agent Picking...</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'inventory' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                         <div className="flex justify-between items-center mb-6 print:hidden">
                            <div>
                                <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                                    <Box className="text-orange-600"/> Inventory Management System
                                </h2>
                                <p className="text-stone-500 text-sm">Track flow from planning to procurement to receiving.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setImsTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold ${imsTab === 'overview' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>Overview</button>
                                <button onClick={() => setImsTab('planning')} className={`px-4 py-2 rounded-lg text-sm font-bold ${imsTab === 'planning' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>Planning</button>
                                <button onClick={() => setImsTab('procurement')} className={`px-4 py-2 rounded-lg text-sm font-bold ${imsTab === 'procurement' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>Procurement</button>
                                <button onClick={() => setImsTab('receiving')} className={`px-4 py-2 rounded-lg text-sm font-bold ${imsTab === 'receiving' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>Receiving</button>
                                <button onClick={() => setImsTab('analysis')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${imsTab === 'analysis' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}><FileCheck size={14}/> Auditing</button>
                            </div>
                        </div>
                        
                        {imsTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                        <h3 className="text-stone-500 text-xs font-bold uppercase mb-2">Total Inventory Value</h3>
                                        <p className="text-3xl font-bold text-stone-900">${menu.reduce((acc, i) => acc + (i.stock * (i.costPrice || 0)), 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                        <h3 className="text-stone-500 text-xs font-bold uppercase mb-2">Low Stock Alerts</h3>
                                        <p className="text-3xl font-bold text-red-600">{forecasts.filter(f => f.status === 'low' || f.status === 'critical').length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                        <h3 className="text-stone-500 text-xs font-bold uppercase mb-2">Pending POs</h3>
                                        <p className="text-3xl font-bold text-orange-600">{purchaseOrders.filter(p => p.status === 'ordered').length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                                        <h3 className="text-stone-500 text-xs font-bold uppercase mb-2">Inbound Value</h3>
                                        <p className="text-3xl font-bold text-blue-600">${purchaseOrders.filter(p => p.status === 'ordered' || p.status === 'in_transit').reduce((acc, p) => acc + p.totalCost, 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                {/* Stock Control Table */}
                                <div className="bg-white shadow-sm border border-stone-300 overflow-x-auto rounded-lg">
                                    <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2"><Layers size={16}/> Real-time Stock Control</h3>
                                        <button onClick={() => window.print()} className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1"><Printer size={12}/> Print</button>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-100 text-stone-600 text-xs font-bold uppercase border-b border-stone-200">
                                            <tr>
                                                <th className="p-3">SKU</th>
                                                <th className="p-3">Item Name</th>
                                                <th className="p-3">Bin Loc</th>
                                                <th className="p-3 text-center">Available</th>
                                                <th className="p-3 text-center">Stock</th>
                                                <th className="p-3 text-center">Reorder Pt</th>
                                                <th className="p-3 text-center">Status</th>
                                                <th className="p-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {menu.map(item => (
                                                <tr key={item.id} className="hover:bg-stone-50">
                                                    <td className="p-3 font-mono text-xs text-stone-500">{item.sku || '-'}</td>
                                                    <td className="p-3 font-medium">{item.name}</td>
                                                    <td className="p-3 text-stone-500 font-mono text-xs">{item.binLocation || 'Unassigned'}</td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => handleAvailabilityToggle(item)}
                                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${item.available ? 'bg-green-500' : 'bg-stone-300'}`}
                                                        >
                                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.available ? 'translate-x-5' : 'translate-x-1'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-center font-bold">{item.stock}</td>
                                                    <td className="p-3 text-center text-stone-400">{item.reorderPoint || 0}</td>
                                                    <td className="p-3 text-center">
                                                        {item.stock <= 0 ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Critical</span> :
                                                        item.stock < (item.reorderPoint || 0) ? <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">Low</span> :
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">OK</span>}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => handleStockUpdate(item, item.stock - 1)} className="w-6 h-6 bg-stone-100 hover:bg-stone-200 rounded text-stone-600 flex items-center justify-center font-bold">-</button>
                                                            <button onClick={() => handleStockUpdate(item, item.stock + 1)} className="w-6 h-6 bg-stone-100 hover:bg-stone-200 rounded text-stone-600 flex items-center justify-center font-bold">+</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                         {imsTab === 'planning' && (
                            <div className="space-y-6">
                                {/* Planning content */}
                                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h3 className="text-indigo-900 font-bold text-lg mb-1">Demand Forecasting Engine</h3>
                                        <p className="text-indigo-700 text-sm">AI analysis of historical sales to predict future stock needs.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-indigo-500 uppercase">Projected Budget Need</p>
                                        <p className="text-2xl font-bold text-indigo-900">${forecasts.reduce((acc, f) => acc + (f.suggestedReorder * (menu.find(m => m.id === f.itemId)?.costPrice || 0)), 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="bg-white shadow-sm border border-stone-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-50 text-stone-600 text-xs font-bold uppercase border-b border-stone-200">
                                            <tr>
                                                <th className="p-4">Item Name</th>
                                                <th className="p-4 text-center">Daily Usage (Est)</th>
                                                <th className="p-4 text-center">Current Stock</th>
                                                <th className="p-4 text-center">Safety Stock</th>
                                                <th className="p-4 text-center text-indigo-600">Suggested Reorder</th>
                                                <th className="p-4 text-right">Est. Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {forecasts.map(f => {
                                                const item = menu.find(m => m.id === f.itemId);
                                                return (
                                                    <tr key={f.itemId} className={f.suggestedReorder > 0 ? "bg-indigo-50/30" : ""}>
                                                        <td className="p-4 font-medium">{f.name}</td>
                                                        <td className="p-4 text-center text-stone-500">{f.dailyUsageRate} / day</td>
                                                        <td className="p-4 text-center font-bold">{f.currentStock}</td>
                                                        <td className="p-4 text-center text-stone-400">{item?.safetyStock || 0}</td>
                                                        <td className="p-4 text-center font-bold text-indigo-600">{f.suggestedReorder > 0 ? f.suggestedReorder : '-'}</td>
                                                        <td className="p-4 text-right font-mono">${(f.suggestedReorder * (item?.costPrice || 0)).toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleGeneratePO} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-200 transition">
                                        <Factory size={18} /> Auto-Generate Purchase Orders
                                    </button>
                                </div>
                            </div>
                        )}
                        {imsTab === 'procurement' && (
                             <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-stone-800">Purchase Orders</h3>
                                    <button className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-lg" onClick={() => handleGeneratePO()}>Create Draft PO</button>
                                </div>
                                <div className="p-8 text-center text-stone-500 bg-stone-100 rounded-lg">
                                    <p>Procurement content truncated...</p>
                                </div>
                             </div>
                        )}
                        {imsTab === 'receiving' && (
                             <div className="space-y-6">
                                 <h3 className="font-bold text-stone-800">Receiving Bay</h3>
                                 {!receivingPO ? (
                                     <div className="space-y-4">
                                         {purchaseOrders.filter(p => p.status === 'ordered').map(po => (
                                             <div key={po.id} className="bg-white p-4 rounded-lg border border-stone-200 flex justify-between items-center">
                                                 <div>
                                                     <p className="font-bold text-sm">PO #{po.id}</p>
                                                     <p className="text-xs text-stone-500">{suppliers.find(s => s.id === po.supplierId)?.name}</p>
                                                 </div>
                                                 <button onClick={() => handleStartReceiving(po)} className="bg-stone-900 text-white px-3 py-1.5 rounded text-xs font-bold">Receive</button>
                                             </div>
                                         ))}
                                         {purchaseOrders.filter(p => p.status === 'ordered').length === 0 && <p className="text-sm text-stone-500">No pending orders to receive.</p>}
                                     </div>
                                 ) : (
                                     <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                                         <div className="flex justify-between items-center mb-4">
                                             <h4 className="font-bold">Receiving PO #{receivingPO.id}</h4>
                                             <button onClick={() => setReceivingPO(null)} className="text-red-500 text-xs font-bold">Cancel</button>
                                         </div>
                                         <table className="w-full text-sm mb-4">
                                             <thead>
                                                 <tr className="text-left text-stone-500 text-xs uppercase">
                                                     <th className="pb-2">Item</th>
                                                     <th className="pb-2 text-center">Ordered</th>
                                                     <th className="pb-2 text-center">Received</th>
                                                     <th className="pb-2 text-center">Scan Qty</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {receivingPO.items.map(item => (
                                                     <tr key={item.itemId} className="border-t border-stone-100">
                                                         <td className="py-2">{item.name}</td>
                                                         <td className="py-2 text-center font-bold">{item.quantityOrdered}</td>
                                                         <td className="py-2 text-center">{item.quantityReceived}</td>
                                                         <td className="py-2 text-center">
                                                             <input 
                                                                 type="number" 
                                                                 className="w-16 p-1 border rounded text-center bg-stone-50"
                                                                 value={scanQty[item.itemId] || 0}
                                                                 onChange={(e) => handleReceiveItem(item.itemId, parseInt(e.target.value) || 0)}
                                                             />
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                         <button onClick={handleSubmitReceiving} className="w-full bg-green-600 text-white py-2 rounded font-bold">Confirm Receipt & Update Stock</button>
                                     </div>
                                 )}
                             </div>
                        )}
                        {imsTab === 'analysis' && (
                             <div className="space-y-6">
                                 <h3 className="font-bold text-stone-800">Inventory Audit</h3>
                                 <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-stone-50 text-xs font-bold uppercase text-stone-500">
                                             <tr>
                                                 <th className="p-3">Item</th>
                                                 <th className="p-3">System Stock</th>
                                                 <th className="p-3">Physical Count</th>
                                                 <th className="p-3">Reason</th>
                                                 <th className="p-3">Action</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {menu.map(item => (
                                                 <tr key={item.id} className="border-t border-stone-100">
                                                     <td className="p-3 font-medium">{item.name}</td>
                                                     <td className="p-3 text-stone-500">{item.stock}</td>
                                                     <td className="p-3">
                                                         <input 
                                                             type="number" 
                                                             className="w-20 p-1 border rounded bg-stone-50" 
                                                             placeholder={item.stock.toString()}
                                                             value={cycleCountValues[item.id] !== undefined ? cycleCountValues[item.id] : ''}
                                                             onChange={(e) => setCycleCountValues(prev => ({...prev, [item.id]: parseInt(e.target.value)}))}
                                                         />
                                                     </td>
                                                     <td className="p-3">
                                                         <select 
                                                            className="p-1 border rounded bg-stone-50 text-xs"
                                                            value={cycleCountReason[item.id] || ''}
                                                            onChange={(e) => setCycleCountReason(prev => ({...prev, [item.id]: e.target.value}))}
                                                         >
                                                             <option value="">Select Reason</option>
                                                             <option value="Damage">Damage</option>
                                                             <option value="Expired">Expired</option>
                                                             <option value="Theft">Theft/Loss</option>
                                                             <option value="Correction">Correction</option>
                                                         </select>
                                                     </td>
                                                     <td className="p-3">
                                                         <button 
                                                            onClick={() => handleCommitCycleCount(item.id)}
                                                            className="text-xs bg-stone-900 text-white px-2 py-1 rounded disabled:opacity-50"
                                                            disabled={cycleCountValues[item.id] === undefined}
                                                         >
                                                             Adjust
                                                         </button>
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
                
                {activeTab === 'fleet' && (
                    <div className="h-full flex flex-col animate-in fade-in">
                        {/* Header and Map/List Layout */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                                    <Truck className="text-orange-600"/> Fleet Management
                                </h2>
                                <p className="text-stone-500 text-sm">Real-time GPS tracking and agent assignment.</p>
                            </div>
                            <button onClick={handleAddAgent} className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800">
                                <Plus size={16}/> Add New Agent
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                            {/* AGENT LIST */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-stone-100 bg-stone-50">
                                    <h3 className="font-bold text-stone-700 text-sm">Delivery Agents ({agents.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {agents.map(agent => (
                                        <div 
                                            key={agent.id} 
                                            onClick={() => setSelectedMapAgent(agent)}
                                            className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center ${selectedMapAgent?.id === agent.id ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${agent.status === 'available' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-orange-500' : 'bg-stone-300'}`} />
                                                <div>
                                                    <p className="font-bold text-stone-800 text-sm">{agent.name}</p>
                                                    <p className="text-xs text-stone-400">{agent.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleEditAgent(agent); }} className="p-1.5 hover:bg-stone-100 rounded text-stone-500"><Pencil size={14}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id); }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* LIVE MAP */}
                            <div className="lg:col-span-2 bg-stone-200 rounded-xl border border-stone-300 overflow-hidden relative shadow-inner">
                                {/* Map Background Layers */}
                                <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/13/5286/3427.png')] bg-cover opacity-80 mix-blend-multiply"></div>
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                                {/* Markers */}
                                {agents.map(agent => {
                                    const pos = getMapPosition(agent.currentLat, agent.currentLng);
                                    return (
                                        <div 
                                            key={agent.id}
                                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-700 ease-linear"
                                            style={{ left: pos.left, top: pos.top }}
                                            onClick={() => setSelectedMapAgent(agent)}
                                        >
                                            {/* Ping Animation for Active Agents */}
                                            {agent.status !== 'offline' && (
                                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full animate-ping opacity-30 ${agent.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                            )}
                                            
                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 ${agent.status === 'available' ? 'bg-green-600' : agent.status === 'busy' ? 'bg-orange-600' : 'bg-stone-500'}`}>
                                                <Bike size={14} />
                                            </div>

                                            {/* Tooltip */}
                                            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity ${selectedMapAgent?.id === agent.id ? 'opacity-100 z-10' : 'opacity-0 group-hover:opacity-100'}`}>
                                                {agent.name}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* HQ Marker */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div className="w-4 h-4 bg-stone-900 rounded-full border-2 border-white shadow-xl"></div>
                                    <span className="text-[10px] font-bold text-stone-800 bg-white/80 px-1 rounded mt-1">HQ</span>
                                </div>

                                {/* Info Overlay */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-sm text-xs border border-stone-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Available
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Busy
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-stone-400 rounded-full"></span> Offline
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal for Add/Edit Agent */}
                        {isAgentModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
                                    <h3 className="font-bold text-lg mb-4">{currentAgent.id ? 'Edit Agent' : 'Add New Agent'}</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 uppercase">Name</label>
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border border-stone-200 rounded-lg"
                                                value={currentAgent.name || ''}
                                                onChange={e => setCurrentAgent({...currentAgent, name: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 uppercase">Phone</label>
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border border-stone-200 rounded-lg"
                                                value={currentAgent.phone || ''}
                                                onChange={e => setCurrentAgent({...currentAgent, phone: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 uppercase">Status</label>
                                            <select 
                                                className="w-full p-2 border border-stone-200 rounded-lg"
                                                value={currentAgent.status || 'available'}
                                                onChange={e => setCurrentAgent({...currentAgent, status: e.target.value as any})}
                                            >
                                                <option value="available">Available</option>
                                                <option value="busy">Busy</option>
                                                <option value="offline">Offline</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-6">
                                        <button onClick={() => setIsAgentModalOpen(false)} className="flex-1 py-2 text-stone-500 font-bold hover:bg-stone-50 rounded-lg">Cancel</button>
                                        <button onClick={handleSaveAgent} className="flex-1 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800">Save</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Fallback for un-implemented tabs */}
                {(activeTab === 'menu' || activeTab === 'orders' || activeTab === 'admins' || activeTab === 'branding' || activeTab === 'settings' || activeTab === 'monitoring' || activeTab === 'sandbox' || activeTab === 'pos') && (
                        <div className="flex flex-col items-center justify-center h-full text-stone-400">
                        <Wand2 size={48} className="mb-4 opacity-20"/>
                        <h3 className="text-lg font-bold">Tab Content Unavailable</h3>
                        <p className="text-sm">Please restore full file content.</p>
                        </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Admin;
