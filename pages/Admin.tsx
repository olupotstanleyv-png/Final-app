import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboard, ShoppingBag, Users, Settings, 
    Plus, Search, Edit2, Trash2, X, RefreshCw,
    LogOut, ClipboardList, 
    CheckCircle,
    Scan, CreditCard, Minus, Monitor, Filter,
    RotateCcw, Save, ArrowRight, Box, Package, Truck, MapPin,
    FileText, Download, Upload, Printer,
    ChefHat, Utensils, AlertTriangle, List, Check,
    Eye, Bike, Phone, TrendingUp, DollarSign, Activity, History,
    PieChart, BarChart2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, Order, DeliveryAgent, SalesMetrics, AppConfig, CartItem, ModifierOption, ModifierGroup, OrderType } from '../types';
import { 
    fetchOrders, fetchAgents, updateOrderStatus, saveAgent, 
    removeAgent, syncItem, getSalesMetrics, 
    getAppConfig, saveAppConfig,
    createOrder, exportDataAsCSV, bulkImportOrders, bulkImportMenu,
    fetchInventory, InventoryItem, deductOrderInventory
} from '../services/menuRepository';

interface AdminProps {
  menu: MenuItem[];
  refreshMenu: () => Promise<void>;
}

// --- CHART COMPONENTS ---

const SparkLine: React.FC<{ data: number[], color?: string }> = ({ data, color = '#f97316' }) => {
    const max = Math.max(...data, 1);
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d / max) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="h-full w-full relative group">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

                <polyline fill="none" stroke={color} strokeWidth="3" points={points} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                <polygon fill={color} fillOpacity="0.1" points={`0,100 ${points} 100,100`} vectorEffect="non-scaling-stroke" />
                
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={(i / (data.length - 1)) * 100}
                        cy={100 - (d / max) * 100}
                        r="3"
                        fill="white"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                ))}
            </svg>
        </div>
    );
};

const CategoryBarChart: React.FC<{ data: {label: string, value: number, color: string}[] }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-4">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-3 group">
                    <div className="w-24 text-xs font-bold text-stone-500 truncate text-right">{d.label}</div>
                    <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${d.color} transition-all duration-1000 ease-out relative`} 
                            style={{ width: `${(d.value / max) * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    <div className="w-16 text-right">
                        <span className="text-xs font-mono font-bold text-stone-900">${d.value.toFixed(0)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const StatusDonutChart: React.FC<{ data: {label: string, value: number, color: string, colorHex: string}[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    
    if (total === 0) return <div className="flex items-center justify-center h-40 text-stone-400 text-xs font-bold">No Data Available</div>;

    return (
        <div className="flex items-center justify-center gap-8">
            <div className="relative w-40 h-40 shrink-0">
                <div 
                    className="w-full h-full rounded-full shadow-inner"
                    style={{
                        background: `conic-gradient(${data.map((d, i, arr) => {
                            const prevSum = arr.slice(0, i).reduce((sum, item) => sum + item.value, 0);
                            const start = (prevSum / total) * 100;
                            const end = ((prevSum + d.value) / total) * 100;
                            return `${d.colorHex} ${start}% ${end}%`;
                        }).join(', ')})`
                    }}
                ></div>
                <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="text-3xl font-black text-stone-900 tracking-tighter">{total}</span>
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Orders</span>
                </div>
            </div>
            <div className="space-y-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${d.color}`}></div>
                        <span className="text-xs font-bold text-stone-600">{d.label}</span>
                        <span className="text-xs text-stone-400 font-mono">({Math.round((d.value / total) * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ElapsedTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setElapsed(`${mins}m ${secs}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);
    const mins = parseInt(elapsed) || 0;
    return <span className={`font-mono font-bold ${mins > 20 ? 'text-red-600' : mins > 10 ? 'text-orange-600' : 'text-green-600'}`}>{elapsed}</span>;
};

const Admin: React.FC<AdminProps> = ({ menu, refreshMenu }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'kds' | 'menu' | 'inventory' | 'orders' | 'fulfillment' | 'settings' | 'agents'>('dashboard');

    const [orders, setOrders] = useState<Order[]>([]);
    const [agents, setAgents] = useState<DeliveryAgent[]>([]);
    const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
    const [appConfig, setAppConfigState] = useState<AppConfig>(getAppConfig());
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    
    // Order Filtering State
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [orderSearch, setOrderSearch] = useState<string>('');

    // Menu Filtering State
    const [menuSearch, setMenuSearch] = useState('');
    const [menuCategoryFilter, setMenuCategoryFilter] = useState('All');

    // Inventory Filtering State
    const [invSearch, setInvSearch] = useState('');
    const [invStatusFilter, setInvStatusFilter] = useState('all'); // all, low, ok
    const [invCategoryFilter, setInvCategoryFilter] = useState('All');

    // Agent Filtering State
    const [agentVehicleFilter, setAgentVehicleFilter] = useState<string>('all');

    // Modal States
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [agentForm, setAgentForm] = useState<Partial<DeliveryAgent>>({});
    
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({});
    
    // POS STATE
    const [posView, setPosView] = useState<'register' | 'history'>('register');
    const [posTransactionMode, setPosTransactionMode] = useState<'sale' | 'return'>('sale');
    const [posOrderType, setPosOrderType] = useState<OrderType>('dine-in');
    const [posDeliveryAddress, setPosDeliveryAddress] = useState('');
    const [posCart, setPosCart] = useState<CartItem[]>([]);
    const [posSearch, setPosSearch] = useState('');
    const [posBarcode, setPosBarcode] = useState('');
    const [posCustomerPhone, setPosCustomerPhone] = useState('');
    const [posCustomerEmail, setPosCustomerEmail] = useState('');
    const [posCustomerProfile, setPosCustomerProfile] = useState<{name: string, points: number} | null>(null);
    const [posDiscount, setPosDiscount] = useState(0); // Percentage
    const [posPaymentStep, setPosPaymentStep] = useState<'cart' | 'tender' | 'success'>('cart');
    const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'card' | 'mobile_nfc' | 'gift_card'>('card');
    const [posCashReceived, setPosCashReceived] = useState('');
    const [lastPosOrder, setLastPosOrder] = useState<Order | null>(null);
    const [posProcessing, setPosProcessing] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // POS Modifier Modal State
    const [posModifierItem, setPosModifierItem] = useState<MenuItem | null>(null);
    const [posModalSelections, setPosModalSelections] = useState<Record<string, ModifierOption[]>>({});
    const [posModalInstructions, setPosModalInstructions] = useState('');

    // File Imports Refs
    const ordersImportRef = useRef<HTMLInputElement>(null);
    const menuImportRef = useRef<HTMLInputElement>(null);

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => { 
            clearInterval(interval);
            isMounted.current = false; 
        };
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'pos' && posPaymentStep === 'cart') {
            barcodeInputRef.current?.focus();
        }
    }, [activeTab, posPaymentStep, posCart]);

    const loadData = async () => {
        const _orders = await fetchOrders();
        const _agents = fetchAgents();
        const _metrics = await getSalesMetrics();
        const _inv = fetchInventory();
        
        if (isMounted.current) {
            setOrders(_orders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setAgents(_agents);
            setSalesMetrics(_metrics);
            setInventory(_inv);
        }
    };

    // --- CHART DATA PREPARATION ---
    const getCategoryChartData = () => {
        const categorySales = orders.reduce((acc, order) => {
            order.items.forEach(item => {
                const total = item.price * item.quantity;
                acc[item.category] = (acc[item.category] || 0) + total;
            });
            return acc;
        }, {} as Record<string, number>);

        const categoryColors: Record<string, string> = {
            'Breakfast': 'bg-yellow-400',
            'Lunch': 'bg-orange-400',
            'Dinner': 'bg-blue-500',
            'Drinks': 'bg-purple-400',
            'Desserts': 'bg-pink-400',
            'Misc': 'bg-stone-400'
        };

        return Object.entries(categorySales)
            .map(([label, value]) => ({
                label, 
                value, 
                color: categoryColors[label] || 'bg-stone-400'
            }))
            .sort((a, b) => b.value - a.value);
    };

    const getStatusChartData = () => {
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { label: 'Completed', value: statusCounts['completed'] || 0, color: 'bg-green-500', colorHex: '#22c55e' },
            { label: 'Approved', value: statusCounts['approved'] || 0, color: 'bg-blue-500', colorHex: '#3b82f6' },
            { label: 'Pending', value: statusCounts['pending_approval'] || 0, color: 'bg-yellow-500', colorHex: '#eab308' },
            { label: 'Cancelled', value: statusCounts['cancelled'] || 0, color: 'bg-red-500', colorHex: '#ef4444' },
        ].filter(d => d.value > 0);
    };

    // --- FILTERED ORDERS LOGIC ---
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesType = typeFilter === 'all' || order.type === typeFilter;
        const searchLower = orderSearch.toLowerCase();
        const matchesSearch = 
            order.id.toLowerCase().includes(searchLower) ||
            order.customerName.toLowerCase().includes(searchLower) ||
            order.phoneNumber.includes(searchLower);
        
        return matchesStatus && matchesType && matchesSearch;
    });

    // --- FILTERED MENU LOGIC ---
    const uniqueMenuCategories = ['All', ...Array.from(new Set(menu.map(m => m.category))).sort()];
    const filteredMenuItems = menu.filter(m => {
        const searchMatch = m.name.toLowerCase().includes(menuSearch.toLowerCase()) || m.category.toLowerCase().includes(menuSearch.toLowerCase());
        const catMatch = menuCategoryFilter === 'All' || m.category === menuCategoryFilter;
        return searchMatch && catMatch;
    });

    // --- FILTERED INVENTORY LOGIC ---
    const uniqueInvCategories = ['All', ...Array.from(new Set(inventory.map(i => i.category))).sort()];
    const filteredInventory = inventory.filter(item => {
        const searchMatch = item.name.toLowerCase().includes(invSearch.toLowerCase());
        const catMatch = invCategoryFilter === 'All' || item.category === invCategoryFilter;
        const statusMatch = invStatusFilter === 'all' 
            ? true 
            : invStatusFilter === 'low' 
                ? item.quantity <= item.threshold 
                : item.quantity > item.threshold;
        return searchMatch && catMatch && statusMatch;
    });

    const inventoryMetrics = {
        totalItems: inventory.length,
        totalValue: inventory.reduce((acc, i) => acc + (i.quantity * (i.cost || 0)), 0),
        lowStockCount: inventory.filter(i => i.quantity <= i.threshold).length,
        totalStockQuantity: inventory.reduce((acc, i) => acc + i.quantity, 0),
    };

    // --- POS METRICS CALCULATION ---
    const todayPosOrders = orders.filter(o => 
        (o.source === 'pos' || o.source === 'web_manual') && 
        new Date(o.timestamp).toDateString() === new Date().toDateString()
    );
    const todayPosSales = todayPosOrders.reduce((sum, o) => sum + o.total, 0);
    
    const todaySalesByCategory = todayPosOrders.flatMap(o => o.items).reduce((acc, item) => {
        const itemTotal = item.price * item.quantity;
        acc[item.category] = (acc[item.category] || 0) + itemTotal;
        return acc;
    }, {} as Record<string, number>);

    const categoryColors: Record<string, string> = {
        'Breakfast': 'bg-yellow-200 text-yellow-800',
        'Lunch': 'bg-orange-200 text-orange-800',
        'Dinner': 'bg-blue-200 text-blue-800',
        'Drinks': 'bg-purple-200 text-purple-800',
        'Desserts': 'bg-pink-200 text-pink-800',
        'Misc': 'bg-gray-200 text-gray-800'
    };

    // --- IMPORT / EXPORT HANDLERS ---
    const handleExportOrders = () => {
        const data = filteredOrders.map(o => ({
            ID: o.id,
            Date: new Date(o.timestamp).toLocaleDateString(),
            Customer: o.customerName,
            Phone: o.phoneNumber,
            Total: o.total,
            Status: o.status,
            Type: o.type
        }));
        exportDataAsCSV(data, 'orders_export');
    };

    const handleImportOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            if (evt.target?.result) {
                const count = await bulkImportOrders(evt.target.result as string);
                alert(`Imported ${count} orders successfully.`);
                loadData();
            }
        };
        reader.readAsText(file);
        if (ordersImportRef.current) ordersImportRef.current.value = '';
    };

    const handleExportMenu = () => {
        const data = filteredMenuItems.map(m => ({
            ID: m.id,
            Name: m.name,
            Category: m.category,
            Price: m.price,
            Available: m.available ? 'Yes' : 'No'
        }));
        exportDataAsCSV(data, 'menu_export');
    };

    const handleImportMenu = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            if (evt.target?.result) {
                const count = await bulkImportMenu(evt.target.result as string);
                alert(`Imported ${count} menu items successfully.`);
                refreshMenu();
            }
        };
        reader.readAsText(file);
        if (menuImportRef.current) menuImportRef.current.value = '';
    };

    // --- POS LOGIC ---
    const handlePosItemClick = (item: MenuItem) => {
        if (posTransactionMode === 'sale' && !item.available) {
            alert("Item currently unavailable!");
            return;
        }

        if (item.modifierGroups && item.modifierGroups.length > 0) {
            // Open Modal for Modifiers
            setPosModifierItem(item);
            setPosModalSelections({});
            setPosModalInstructions('');
        } else {
            // Add directly
            handlePosAddToCart(item, [], '');
        }
    };

    const handlePosAddToCart = (item: MenuItem, modifiers: ModifierOption[], instructions: string) => {
        const quantityDelta = posTransactionMode === 'return' ? -1 : 1;
        setPosCart(prev => {
            // Simple check: if same ID and same modifiers, increment
            if (modifiers.length === 0) {
                 const existing = prev.find(i => i.id === item.id && (!i.selectedModifiers || i.selectedModifiers.length === 0));
                 if (existing) {
                    const newQty = existing.quantity + quantityDelta;
                    return prev.map(i => i === existing ? { ...i, quantity: newQty } : i);
                 }
            }
            return [...prev, { ...item, quantity: quantityDelta, selectedModifiers: modifiers, specialInstructions: instructions }];
        });
        setPosModifierItem(null); // Close modal
        setPosBarcode(''); 
    };

    const handlePosModifierToggle = (group: ModifierGroup, option: ModifierOption) => {
        setPosModalSelections(prev => {
            const current = prev[group.id] || [];
            const isSelected = current.some(o => o.id === option.id);
            
            if (group.maxSelection === 1) {
                return { ...prev, [group.id]: [option] };
            } else {
                if (isSelected) {
                    return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
                } else {
                    if (group.maxSelection && current.length >= group.maxSelection) return prev;
                    return { ...prev, [group.id]: [...current, option] };
                }
            }
        });
    };

    const handlePosSubmitModifiers = () => {
        if (!posModifierItem) return;
        // Validate required
        if (posModifierItem.modifierGroups) {
            for (const group of posModifierItem.modifierGroups) {
                const selected = posModalSelections[group.id] || [];
                if (group.required && selected.length === 0) {
                    alert(`Please select options for "${group.name}"`);
                    return;
                }
            }
        }
        const flattened = Object.values(posModalSelections).flat();
        handlePosAddToCart(posModifierItem, flattened, posModalInstructions);
    };

    const handlePosRemoveFromCart = (index: number) => {
        setPosCart(prev => prev.filter((_, i) => i !== index));
    };

    const handlePosUpdateQty = (index: number, delta: number) => {
        setPosCart(prev => {
            const updated = [...prev];
            const newQty = updated[index].quantity + delta;
            if (newQty === 0) return prev.filter((_, i) => i !== index);
            updated[index].quantity = newQty;
            return updated;
        });
    };

    const handleBarcodeScan = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const item = menu.find(m => m.id === posBarcode);
            if (item) handlePosItemClick(item);
            else alert("Product not found");
            setPosBarcode('');
        }
    };

    const handlePosCustomerLookup = () => {
        if (posCustomerPhone.length > 3) {
            setPosCustomerProfile({
                name: "Loyal Customer",
                points: Math.floor(Math.random() * 500)
            });
        } else {
            setPosCustomerProfile(null);
        }
    };

    const getPosTotals = () => {
        const subtotal = posCart.reduce((acc, item) => {
             const modsCost = item.selectedModifiers?.reduce((s, m) => s + m.price, 0) || 0;
             return acc + ((item.price + modsCost) * item.quantity);
        }, 0);
        const discountAmount = subtotal * (posDiscount / 100);
        const taxable = subtotal - discountAmount;
        const tax = taxable * 0.05; 
        const deliveryFee = posOrderType === 'delivery' ? appConfig.deliveryFee || 10 : 0;
        const total = taxable + tax + deliveryFee;
        return { subtotal, discountAmount, tax, deliveryFee, total };
    };

    const handlePosCheckout = async () => {
        const { total, deliveryFee } = getPosTotals();
        const isRefund = total < 0;

        if (posOrderType === 'delivery' && !posDeliveryAddress) {
            alert("Delivery address required for delivery orders");
            return;
        }

        if (posPaymentMethod === 'cash' && !isRefund) {
            const cash = parseFloat(posCashReceived);
            if (isNaN(cash) || cash < total) {
                alert("Insufficient Cash");
                return;
            }
        }

        setPosProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate Transaction

        const newOrder: Order = {
            id: `POS-${Date.now()}`,
            customerName: posCustomerProfile?.name || "Walk-in Customer",
            phoneNumber: posCustomerPhone || "",
            items: posCart,
            total: parseFloat(total.toFixed(2)),
            discount: posDiscount,
            deliveryFee: deliveryFee,
            status: 'pending_approval', 
            timestamp: new Date().toISOString(),
            type: posOrderType,
            source: 'pos',
            paymentMethod: posPaymentMethod,
            paymentStatus: isRefund ? 'refunded' : 'paid',
            deliveryStatus: posOrderType === 'delivery' ? 'pending' : undefined,
            deliveryAddress: posOrderType === 'delivery' ? posDeliveryAddress : undefined,
        };

        await createOrder(newOrder);
        setLastPosOrder(newOrder);
        setPosProcessing(false);
        setPosPaymentStep('success');
        refreshMenu();
        loadData();
    };

    const resetPos = () => {
        setPosCart([]);
        setPosCustomerPhone('');
        setPosCustomerEmail('');
        setPosCustomerProfile(null);
        setPosDiscount(0);
        setPosCashReceived('');
        setPosPaymentStep('cart');
        setLastPosOrder(null);
        setPosTransactionMode('sale');
        setPosOrderType('dine-in');
        setPosDeliveryAddress('');
    };

    const sendReceipt = (type: 'email' | 'sms') => {
        const contact = type === 'email' ? posCustomerEmail : posCustomerPhone;
        if (!contact) {
            alert(`Please enter customer ${type} first.`);
            return;
        }
        alert(`Receipt sent to ${contact} via ${type.toUpperCase()}`);
    };

    // --- KDS LOGIC ---
    const updateKdsStatus = async (orderId: string, status: 'approved' | 'completed') => {
        await updateOrderStatus(orderId, status);
        loadData();
    };

    // --- MENU LOGIC ---
    const handleEditMenu = (item?: MenuItem) => {
        setMenuForm(item || { available: true, price: 0, category: 'Lunch' });
        setIsMenuModalOpen(true);
    };

    const submitMenu = async () => {
        if (!menuForm.name || !menuForm.price) return alert("Required fields missing");
        const newItem: MenuItem = {
            id: menuForm.id || `MENU-${Date.now()}`,
            name: menuForm.name!,
            description: menuForm.description || '',
            price: Number(menuForm.price),
            category: menuForm.category || 'Misc',
            imageUrl: menuForm.imageUrl || 'https://placehold.co/200',
            available: menuForm.available ?? true,
            phoneNumber: menuForm.phoneNumber || '+971504291207',
        };
        await syncItem(menuForm.id ? 'update' : 'add', newItem);
        refreshMenu();
        setIsMenuModalOpen(false);
        loadData();
    };

    const handleDeleteMenu = async (id: string) => {
        if (window.confirm("Delete this item?")) {
            await syncItem('delete', undefined, id);
            refreshMenu();
            loadData();
        }
    };

    // --- AGENT LOGIC ---
    const handleEditAgent = (agent?: DeliveryAgent) => {
        setAgentForm(agent || { status: 'offline', vehicleType: 'bike', currentLat: 25.2048, currentLng: 55.2708 });
        setIsAgentModalOpen(true);
    };

    const submitAgent = () => {
        if (!agentForm.name || !agentForm.phone) return alert("Name and Phone required");
        const newAgent = { ...agentForm, id: agentForm.id || `DA-${Date.now()}` } as DeliveryAgent;
        saveAgent(newAgent);
        loadData();
        setIsAgentModalOpen(false);
    };
    
    const handleDeleteAgent = (id: string) => {
        if (window.confirm("Remove this agent?")) {
            removeAgent(id);
            loadData();
        }
    };

    // --- SETTINGS LOGIC ---
    const handleSaveConfig = () => {
        saveAppConfig(appConfig);
        alert("Settings Saved");
    };

    const createManualOrder = async () => {
        const newOrder: Order = {
            id: `MANUAL-${Date.now()}`,
            customerName: "Manual Entry",
            phoneNumber: "",
            items: [],
            total: 0,
            status: 'pending_approval',
            timestamp: new Date().toISOString(),
            type: 'dine-in',
            source: 'pos',
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            deliveryStatus: 'pending'
        };
        await createOrder(newOrder);
        loadData();
        navigate(`/admin/orders/${newOrder.id}`);
    };

    const handlePrintList = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-stone-100 flex font-sans">
            <style>{`
                @media print {
                    aside, header, .no-print { display: none !important; }
                    main { margin: 0; padding: 0; margin-left: 0 !important; }
                    body { background-color: white; }
                    .print-full-width { width: 100%; max-width: none; }
                    table { font-size: 10pt; width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    h1 { font-size: 18pt; margin-bottom: 10px; }
                }
            `}</style>

            {/* Sidebar */}
            <aside className="w-64 bg-stone-900 text-white fixed h-full z-10 hidden md:flex flex-col no-print">
                <div className="p-6 border-b border-stone-800">
                    <h2 className="text-2xl font-bold">Stanley's</h2>
                    <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Admin Panel</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: 'pos', icon: Monitor, label: 'Retail POS' },
                        { id: 'kds', icon: Utensils, label: 'Kitchen Display' },
                        { id: 'orders', icon: ShoppingBag, label: 'Order Manager' },
                        { id: 'fulfillment', icon: Box, label: 'Fulfillment' },
                        { id: 'agents', icon: Users, label: 'Delivery Agents' },
                        { id: 'menu', icon: ClipboardList, label: 'Menu Mgmt' },
                        { id: 'inventory', icon: List, label: 'Inventory' },
                        { id: 'settings', icon: Settings, label: 'Settings' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                                activeTab === item.id ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                            }`}
                        >
                            <item.icon size={18}/>
                            <span className="font-bold text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-stone-800">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-white transition">
                        <LogOut size={18}/>
                        <span className="font-bold text-sm">Exit</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10 overflow-x-hidden print-full-width">
                <header className="flex justify-between items-center mb-8 no-print">
                    <h1 className="text-3xl font-black text-stone-900 capitalize">
                        {activeTab === 'pos' ? 'Retail Point of Sale' : 
                         activeTab === 'kds' ? 'Kitchen Display System (KDS)' :
                         activeTab === 'orders' ? 'Order Manager' :
                         activeTab === 'fulfillment' ? 'Logistics Queue' :
                         activeTab}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button onClick={loadData} className="p-2 bg-white rounded-full shadow-sm hover:bg-stone-50"><RefreshCw size={20}/></button>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold uppercase text-stone-500">System Online</span>
                        </div>
                    </div>
                </header>

                {/* 1. DASHBOARD (UPDATED WITH CHARTS) */}
                {activeTab === 'dashboard' && salesMetrics && (
                    <div className="animate-in fade-in space-y-6">
                        
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-between relative overflow-hidden">
                                <div>
                                    <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">Total Daily Sales</p>
                                    <h2 className="text-4xl font-black text-stone-900">${salesMetrics.dailyTotal.toFixed(2)}</h2>
                                </div>
                                <div className="absolute right-4 top-4 p-3 bg-orange-50 text-orange-600 rounded-xl">
                                    <DollarSign size={24}/>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600">
                                    <TrendingUp size={14}/> +12.5% from yesterday
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-between relative overflow-hidden">
                                <div>
                                    <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">Orders Today</p>
                                    <h2 className="text-4xl font-black text-stone-900">{salesMetrics.orderCountToday}</h2>
                                </div>
                                <div className="absolute right-4 top-4 p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <ShoppingBag size={24}/>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-stone-400">
                                    <Clock size={14}/> Last order 5m ago
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-between relative overflow-hidden">
                                <div>
                                    <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Order Value</p>
                                    <h2 className="text-4xl font-black text-stone-900">
                                        ${salesMetrics.orderCountToday > 0 ? (salesMetrics.dailyTotal / salesMetrics.orderCountToday).toFixed(2) : '0.00'}
                                    </h2>
                                </div>
                                <div className="absolute right-4 top-4 p-3 bg-green-50 text-green-600 rounded-xl">
                                    <Activity size={24}/>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: Revenue Trend Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 h-80 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-stone-900">Revenue Trends (Last 7 Days)</h3>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1 text-xs font-bold text-stone-500"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> Sales</span>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <SparkLine data={salesMetrics.dailyRevenueChart} />
                            </div>
                        </div>

                        {/* Bottom Row: Category & Status Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Category Breakdown */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
                                <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4">
                                    <BarChart2 size={20} className="text-stone-400"/>
                                    <h3 className="font-bold text-lg text-stone-900">Sales by Category</h3>
                                </div>
                                <div className="flex-1">
                                    <CategoryBarChart data={getCategoryChartData()} />
                                </div>
                            </div>

                            {/* Order Status Breakdown */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
                                <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4">
                                    <PieChart size={20} className="text-stone-400"/>
                                    <h3 className="font-bold text-lg text-stone-900">Order Status Distribution</h3>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    <StatusDonutChart data={getStatusChartData()} />
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                
                {/* 2. RETAIL POS */}
                {activeTab === 'pos' && (
                    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
                        
                        {/* POS TOP STATS BAR */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex justify-between items-center flex-wrap gap-4">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Today's Sales</p>
                                    <p className="text-2xl font-black text-stone-900">${todayPosSales.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Transactions</p>
                                    <p className="text-2xl font-black text-stone-900">{todayPosOrders.length}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 justify-end">
                                {Object.entries(todaySalesByCategory).map(([cat, total]) => (
                                    <div key={cat} className={`px-3 py-2 rounded-lg flex flex-col items-center min-w-[80px] ${categoryColors[cat] || 'bg-gray-100 text-gray-700'}`}>
                                        <span className="text-[10px] font-bold uppercase">{cat}</span>
                                        <span className="text-sm font-bold">${total.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex bg-stone-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setPosView('register')} 
                                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition ${posView === 'register' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                                >
                                    <Monitor size={16} className="inline mr-2 mb-0.5"/> Register
                                </button>
                                <button 
                                    onClick={() => setPosView('history')} 
                                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition ${posView === 'history' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                                >
                                    <History size={16} className="inline mr-2 mb-0.5"/> Transactions
                                </button>
                            </div>
                        </div>

                        {posView === 'history' ? (
                            /* --- TRANSACTION HISTORY VIEW --- */
                            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-stone-800">Recent POS Transactions</h3>
                                    <div className="flex gap-2">
                                        <button onClick={loadData} className="p-2 bg-white border rounded hover:bg-stone-50"><RefreshCw size={16}/></button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-100 text-stone-500 font-bold sticky top-0">
                                            <tr>
                                                <th className="p-4">Time</th>
                                                <th className="p-4">Order ID</th>
                                                <th className="p-4">Customer</th>
                                                <th className="p-4">Type</th>
                                                <th className="p-4 text-right">Total</th>
                                                <th className="p-4 text-center">Payment</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {todayPosOrders.slice().reverse().map(order => (
                                                <tr key={order.id} className="hover:bg-stone-50">
                                                    <td className="p-4 text-stone-500">{new Date(order.timestamp).toLocaleTimeString()}</td>
                                                    <td className="p-4 font-mono font-bold">#{order.id.slice(-6)}</td>
                                                    <td className="p-4 font-medium">{order.customerName}</td>
                                                    <td className="p-4"><span className="bg-stone-100 px-2 py-1 rounded text-xs uppercase font-bold text-stone-600">{order.type}</span></td>
                                                    <td className="p-4 text-right font-bold">${order.total.toFixed(2)}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                            order.paymentStatus === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {order.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => navigate(`/admin/orders/${order.id}?autoPrint=true`)}
                                                            className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded transition flex items-center justify-center gap-2 mx-auto border border-stone-200"
                                                            title="Print Invoice"
                                                        >
                                                            <Printer size={16}/> <span className="text-xs font-bold">Print</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {todayPosOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-10 text-stone-400">No transactions today.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* --- REGISTER VIEW --- */
                            <div className="flex-1 flex gap-6 relative overflow-hidden">
                                {/* POS MODIFIER MODAL - Same as existing logic */}
                                {posModifierItem && (
                                    <div className="absolute inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-8">
                                        {/* ... Modal UI ... */}
                                        <div className="bg-white rounded-2xl w-full max-w-2xl h-full max-h-[600px] flex flex-col shadow-2xl animate-in zoom-in-95">
                                            <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                                                <h3 className="font-bold text-lg">{posModifierItem.name}</h3>
                                                <button onClick={() => setPosModifierItem(null)} className="p-2 bg-stone-100 rounded-full"><X size={20}/></button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-6">
                                                {posModifierItem.modifierGroups?.map(group => (
                                                    <div key={group.id} className="mb-6">
                                                        <div className="flex justify-between mb-2">
                                                            <h4 className="font-bold text-stone-800">{group.name}</h4>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${group.required ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>{group.required ? 'Required' : 'Optional'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {group.options.map(option => {
                                                                const isSelected = (posModalSelections[group.id] || []).some(o => o.id === option.id);
                                                                return (
                                                                    <button 
                                                                        key={option.id} 
                                                                        onClick={() => handlePosModifierToggle(group, option)}
                                                                        className={`flex justify-between items-center p-3 rounded-xl border text-left transition ${isSelected ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-stone-200 hover:bg-stone-50'}`}
                                                                    >
                                                                        <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{option.name}</span>
                                                                        {option.price > 0 && <span className="text-xs font-bold">+${option.price}</span>}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="mb-4">
                                                    <label className="text-sm font-bold text-stone-500 block mb-2">Special Instructions</label>
                                                    <input type="text" value={posModalInstructions} onChange={(e) => setPosModalInstructions(e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50" placeholder="e.g. No Onion, Extra Spicy"/>
                                                </div>
                                            </div>
                                            <div className="p-4 border-t border-stone-100">
                                                <button onClick={handlePosSubmitModifiers} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg text-lg">Add to Order</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 flex flex-col gap-4">
                                    {/* Customer Lookup & Search */}
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex gap-4 items-center">
                                            <div className="p-3 bg-stone-100 rounded-lg text-stone-500"><Scan size={24} /></div>
                                            <div className="flex-1">
                                                <input ref={barcodeInputRef} type="text" value={posBarcode} onChange={e => setPosBarcode(e.target.value)} onKeyDown={handleBarcodeScan} placeholder="Scan Item..." className="w-full bg-transparent text-lg font-bold outline-none" autoFocus />
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex gap-4 items-center">
                                            <div className="p-3 bg-stone-100 rounded-lg text-stone-500"><Users size={24} /></div>
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="text" 
                                                    value={posCustomerPhone} 
                                                    onChange={e => { setPosCustomerPhone(e.target.value); handlePosCustomerLookup(); }} 
                                                    placeholder="Customer Phone..." 
                                                    className="w-full bg-transparent text-lg font-bold outline-none" 
                                                />
                                                {posCustomerProfile && (
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">{posCustomerProfile.name}</span>
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{posCustomerProfile.points} pts</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Catalog Table */}
                                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                                        <div className="p-4 border-b border-stone-100">
                                            <input type="text" value={posSearch} onChange={e => setPosSearch(e.target.value)} placeholder="Search Products..." className="w-full p-3 bg-stone-50 rounded-xl border border-stone-100 outline-none focus:ring-2 focus:ring-orange-200 transition" />
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-0">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-stone-100 text-stone-500 font-bold sticky top-0 z-10">
                                                    <tr>
                                                        <th className="p-3">Item Name</th>
                                                        <th className="p-3">Category</th>
                                                        <th className="p-3 text-right">Price</th>
                                                        <th className="p-3 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-100">
                                                    {menu.filter(item => item.name.toLowerCase().includes(posSearch.toLowerCase())).map(item => (
                                                        <tr 
                                                            key={item.id} 
                                                            onClick={() => handlePosItemClick(item)}
                                                            className={`cursor-pointer hover:bg-orange-50 transition ${!item.available && posTransactionMode === 'sale' ? 'opacity-50' : ''}`}
                                                        >
                                                            <td className="p-3 font-bold text-stone-800">{item.name}</td>
                                                            <td className="p-3 text-stone-500">{item.category}</td>
                                                            <td className="p-3 text-right font-mono">${item.price}</td>
                                                            <td className="p-3 text-center">
                                                                {item.available ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">In Stock</span> : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Out</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Cart */}
                                <div className="w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
                                    {posPaymentStep === 'cart' && (
                                        <>
                                        <div className="flex border-b border-stone-200">
                                            <button onClick={() => setPosTransactionMode('sale')} className={`flex-1 py-3 text-sm font-bold uppercase flex items-center justify-center gap-2 ${posTransactionMode === 'sale' ? 'bg-green-600 text-white' : 'bg-stone-50 text-stone-500'}`}><ShoppingBag size={14}/> Sale</button>
                                            <button onClick={() => setPosTransactionMode('return')} className={`flex-1 py-3 text-sm font-bold uppercase flex items-center justify-center gap-2 ${posTransactionMode === 'return' ? 'bg-red-600 text-white' : 'bg-stone-50 text-stone-500'}`}><RotateCcw size={14}/> Return</button>
                                        </div>
                                        
                                        {/* Order Type Selector */}
                                        <div className="p-3 bg-stone-50 border-b border-stone-200">
                                            <div className="flex bg-white rounded-lg border border-stone-200 p-1 mb-2">
                                                {(['dine-in', 'pickup', 'delivery'] as const).map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setPosOrderType(t)}
                                                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition ${
                                                            posOrderType === t ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'
                                                        }`}
                                                    >
                                                        {t.replace('-', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                            {posOrderType === 'delivery' && (
                                                <input 
                                                    type="text" 
                                                    placeholder="Delivery Address" 
                                                    value={posDeliveryAddress} 
                                                    onChange={(e) => setPosDeliveryAddress(e.target.value)} 
                                                    className="w-full p-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
                                            {posCart.map((item, idx) => {
                                                const unitPriceWithMods = item.price + (item.selectedModifiers?.reduce((s,m)=>s+m.price,0)||0);
                                                const lineTotal = unitPriceWithMods * item.quantity;
                                                return (
                                                    <div key={idx} className={`p-3 rounded-lg border ${item.quantity < 0 ? 'bg-red-50 border-red-100' : 'bg-white border-stone-200'}`}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-bold text-sm text-stone-900">{item.name}</div>
                                                            <div className="font-bold text-stone-900">${lineTotal.toFixed(2)}</div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                            <span>${unitPriceWithMods.toFixed(2)} x {item.quantity}</span>
                                                        </div>
                                                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                                            <div className="text-xs text-stone-500 mb-1">{item.selectedModifiers.map(m => m.name).join(', ')}</div>
                                                        )}
                                                        {item.specialInstructions && (
                                                            <div className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded inline-block mb-1">{item.specialInstructions}</div>
                                                        )}
                                                        <div className="flex items-center justify-end gap-3 mt-2">
                                                            <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-0.5">
                                                                <button onClick={() => handlePosUpdateQty(idx, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={12}/></button>
                                                                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                                <button onClick={() => handlePosUpdateQty(idx, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={12}/></button>
                                                            </div>
                                                            <button onClick={() => handlePosRemoveFromCart(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {posCart.length === 0 && <div className="text-center py-10 text-stone-400">Scan or select items</div>}
                                        </div>
                                        <div className="p-4 bg-white border-t border-stone-200 shadow-lg">
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm"><span>Subtotal</span><span>${getPosTotals().subtotal.toFixed(2)}</span></div>
                                                {posOrderType === 'delivery' && (
                                                    <div className="flex justify-between text-sm"><span>Delivery Fee</span><span>${getPosTotals().deliveryFee.toFixed(2)}</span></div>
                                                )}
                                                <div className="flex justify-between text-sm"><span>Tax (5%)</span><span>${getPosTotals().tax.toFixed(2)}</span></div>
                                                <div className="flex justify-between text-sm items-center">
                                                    <span>Discount (%)</span>
                                                    <input type="number" value={posDiscount} onChange={e => setPosDiscount(Number(e.target.value))} className="w-16 p-1 border rounded text-right"/>
                                                </div>
                                                <div className="flex justify-between text-xl font-black text-stone-900 pt-2 border-t"><span>Total</span><span>${getPosTotals().total.toFixed(2)}</span></div>
                                            </div>
                                            <button onClick={() => setPosPaymentStep('tender')} disabled={posCart.length === 0} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-stone-800 disabled:opacity-50 transition">Pay Now</button>
                                        </div>
                                        </>
                                    )}

                                    {posPaymentStep === 'tender' && (
                                        <div className="flex-1 flex flex-col">
                                            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                                                <h3 className="font-bold">Payment</h3>
                                                <button onClick={() => setPosPaymentStep('cart')} className="text-sm text-stone-500 underline">Back</button>
                                            </div>
                                            <div className="flex-1 p-6 space-y-6">
                                                <div className="text-center mb-6">
                                                    <p className="text-stone-500 text-xs font-bold uppercase">Amount Due</p>
                                                    <h2 className="text-4xl font-black text-stone-900">${getPosTotals().total.toFixed(2)}</h2>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['cash', 'card', 'mobile_nfc', 'gift_card'].map(m => (
                                                        <button key={m} onClick={() => setPosPaymentMethod(m as any)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${posPaymentMethod === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 hover:bg-stone-50'}`}>
                                                            <CreditCard size={24}/>
                                                            <span className="font-bold capitalize">{m.replace('_', ' ')}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                {posPaymentMethod === 'cash' && (
                                                    <div className="bg-stone-100 p-4 rounded-xl">
                                                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Cash Received</label>
                                                        <div className="flex gap-2 mb-2">
                                                            <input 
                                                                type="number" 
                                                                value={posCashReceived} 
                                                                onChange={e => setPosCashReceived(e.target.value)} 
                                                                className="flex-1 p-3 border rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-stone-200" 
                                                                autoFocus
                                                            />
                                                            <button 
                                                                className="bg-stone-800 text-white px-4 rounded-xl font-bold hover:bg-stone-700 transition shadow-sm"
                                                                title="Save Amount"
                                                            >
                                                                <Save size={20}/>
                                                            </button>
                                                        </div>
                                                        {parseFloat(posCashReceived) >= getPosTotals().total && (
                                                            <div className="text-green-600 font-bold text-sm">Change Due: ${(parseFloat(posCashReceived) - getPosTotals().total).toFixed(2)}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 border-t border-stone-200">
                                                <button onClick={handlePosCheckout} disabled={posProcessing} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-green-500 flex items-center justify-center gap-2">
                                                    {posProcessing ? <RefreshCw className="animate-spin"/> : <CheckCircle />} Complete Transaction
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {posPaymentStep === 'success' && lastPosOrder && (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-green-50">
                                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-in zoom-in">
                                                <CheckCircle size={48}/>
                                            </div>
                                            <h2 className="text-2xl font-bold text-stone-900 mb-2">Payment Successful!</h2>
                                            <p className="text-stone-500 mb-8">Order #{lastPosOrder.id} has been sent to kitchen.</p>
                                            <div className="flex flex-col gap-3 w-full">
                                                <button onClick={() => sendReceipt('email')} className="w-full py-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50">Email Receipt</button>
                                                <button onClick={() => window.print()} className="w-full py-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50">Print Receipt</button>
                                                <button onClick={resetPos} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg mt-4">New Sale</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* 3. KITCHEN DISPLAY SYSTEM (Stage 2) */}
                {activeTab === 'kds' && (
                    <div className="h-[calc(100vh-140px)] overflow-x-auto">
                        {/* KDS Columns Code ... (no changes requested) */}
                        <div className="flex gap-6 min-w-[1000px] h-full">
                            {/* ... Columns ... */}
                            {/* Reusing simplified existing KDS logic */}
                            <div className="flex-1 bg-white rounded-2xl border border-stone-200 flex flex-col">
                                <div className="p-4 border-b border-stone-100 bg-red-50 rounded-t-2xl flex justify-between items-center">
                                    <h3 className="font-bold text-red-900">New Orders</h3>
                                    <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-xs font-bold">{orders.filter(o => o.status === 'pending_approval').length}</span>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-stone-50">
                                    {orders.filter(o => o.status === 'pending_approval').map(order => (
                                        <div key={order.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-left-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-mono font-bold text-lg">#{order.id.slice(-4)}</span>
                                                    <p className="text-xs text-stone-500">{order.type.toUpperCase()}</p>
                                                </div>
                                                <ElapsedTimer startTime={order.timestamp}/>
                                            </div>
                                            <div className="border-t border-b border-stone-100 py-2 my-2 space-y-1">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex gap-2 text-sm">
                                                        <span className="font-bold">{item.quantity}x</span>
                                                        <span>{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => updateKdsStatus(order.id, 'approved')} className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold shadow-sm hover:bg-stone-800 transition">Start Prep</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* ... Other KDS columns ... */}
                        </div>
                    </div>
                )}

                {/* 4. INVENTORY (ENHANCED) */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        {/* A. Dashboard Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Items</p>
                                        <h3 className="text-2xl font-black text-stone-900">{inventoryMetrics.totalItems}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Box size={20}/></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Value (Balance)</p>
                                        <h3 className="text-2xl font-black text-stone-900">${inventoryMetrics.totalValue.toFixed(2)}</h3>
                                    </div>
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20}/></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
                                        <h3 className="text-2xl font-black text-red-600">{inventoryMetrics.lowStockCount}</h3>
                                    </div>
                                    <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20}/></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Stock Quantity</p>
                                        <h3 className="text-2xl font-black text-stone-900">{inventoryMetrics.totalStockQuantity}</h3>
                                    </div>
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity size={20}/></div>
                                </div>
                            </div>
                        </div>

                        {/* B. Filter Toolbar & Table */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-stone-100 flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex gap-2 flex-1 max-w-2xl">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                                        <input 
                                            type="text" 
                                            placeholder="Search inventory..." 
                                            value={invSearch} 
                                            onChange={e => setInvSearch(e.target.value)} 
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                                        />
                                    </div>
                                    <select value={invCategoryFilter} onChange={e => setInvCategoryFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white min-w-[120px]">
                                        {uniqueInvCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select value={invStatusFilter} onChange={e => setInvStatusFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white min-w-[120px]">
                                        <option value="all">All Status</option>
                                        <option value="low">Low Stock</option>
                                        <option value="ok">In Stock</option>
                                    </select>
                                </div>
                                <button onClick={() => alert("Restock order feature coming soon.")} className="px-4 py-2 bg-stone-900 text-white rounded-lg font-bold text-sm flex items-center gap-2">
                                    <Plus size={16}/> Create PO
                                </button>
                            </div>
                            
                            <table className="w-full text-left">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Item Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 text-right">Cost / Unit</th>
                                        <th className="px-6 py-4 text-center">In (7d)</th>
                                        <th className="px-6 py-4 text-center">Out (7d)</th>
                                        <th className="px-6 py-4 text-right">Current Stock</th>
                                        <th className="px-6 py-4 text-right">Total Value</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredInventory.map(item => (
                                        <tr key={item.id} className="hover:bg-stone-50">
                                            <td className="px-6 py-4 font-bold text-sm text-stone-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-stone-500">{item.category}</td>
                                            <td className="px-6 py-4 text-right text-sm font-mono">${item.cost?.toFixed(2) || '0.00'}</td>
                                            
                                            {/* Simulation Columns */}
                                            <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">+{item.stockIn || 0}</td>
                                            <td className="px-6 py-4 text-center text-sm text-red-600 font-medium">-{item.stockOut || 0}</td>
                                            
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono font-bold text-stone-900">{item.quantity.toFixed(1)}</span>
                                                <span className="text-xs text-stone-400 ml-1">{item.unit}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-stone-900 font-mono">
                                                ${((item.quantity) * (item.cost || 0)).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.quantity <= item.threshold ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                                                        <AlertTriangle size={12}/> Low
                                                    </span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                                                        <Check size={12}/> OK
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInventory.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-stone-400">No inventory items match your filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* OTHER TABS (Simplified placeholders or existing code) */}
                {activeTab === 'orders' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                         {/* ... Order Manager Code ... */}
                         <div className="p-4 border-b border-stone-100 flex flex-wrap gap-4 items-center justify-between no-print">
                             <div className="flex gap-2 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                                    <input type="text" placeholder="Search ID, customer..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 outline-none"/>
                                </div>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
                                    <option value="all">All Statuses</option>
                                    <option value="pending_approval">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
                                    <option value="all">All Types</option>
                                    <option value="delivery">Delivery</option>
                                    <option value="pickup">Pickup</option>
                                    <option value="dine-in">Dine-in</option>
                                </select>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={handlePrintList} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Printer size={16}/> Print List
                                </button>
                                <button onClick={handleExportOrders} className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Download size={16}/> Export CSV
                                </button>
                                <label className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer">
                                    <Upload size={16}/> Upload CSV <input type="file" ref={ordersImportRef} onChange={handleImportOrders} className="hidden"/>
                                </label>
                                <button onClick={createManualOrder} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800 shadow-sm">
                                    <Plus size={16}/> New Order
                                </button>
                             </div>
                         </div>
                         <div className="printable-table">
                             <table className="w-full text-left text-sm">
                                 <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-xs">
                                     <tr>
                                         <th className="p-4">ID</th>
                                         <th className="p-4">Date</th>
                                         <th className="p-4">Customer</th>
                                         <th className="p-4">Type</th>
                                         <th className="p-4">Status</th>
                                         <th className="p-4 text-right">Total</th>
                                         <th className="p-4 text-center no-print">Action</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {filteredOrders.map(o => (
                                         <tr key={o.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                                             <td className="p-4 font-mono">{o.id.slice(-6)}</td>
                                             <td className="p-4 text-stone-500">{new Date(o.timestamp).toLocaleDateString()}</td>
                                             <td className="p-4 font-bold">{o.customerName}</td>
                                             <td className="p-4 capitalize"><span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-bold">{o.type}</span></td>
                                             <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                 o.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                 o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                 o.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                 'bg-yellow-100 text-yellow-700'
                                             }`}>{o.status.replace('_', ' ')}</span></td>
                                             <td className="p-4 font-bold text-right">${o.total.toFixed(2)}</td>
                                             <td className="p-4 text-center no-print">
                                                 <div className="flex justify-center gap-2">
                                                    <button onClick={() => navigate(`/admin/orders/${o.id}?autoPrint=true`)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition" title="Print Invoice">
                                                        <Printer size={16}/>
                                                    </button>
                                                    <button onClick={() => navigate(`/admin/orders/${o.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition flex items-center gap-1">
                                                        <Eye size={16}/> View
                                                    </button>
                                                 </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}

                {/* MENU TAB */}
                {activeTab === 'menu' && (
                    <div className="space-y-6">
                        {/* ... Menu code ... */}
                        <div className="flex gap-4 mb-6">
                             <input type="text" placeholder="Search menu..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} className="flex-1 p-3 rounded-xl border border-stone-200"/>
                             <select value={menuCategoryFilter} onChange={e => setMenuCategoryFilter(e.target.value)} className="p-3 rounded-xl border border-stone-200">
                                 {uniqueMenuCategories.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                             <button onClick={() => handleEditMenu()} className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> Add Item</button>
                             <div className="flex gap-2">
                                <button onClick={handleExportMenu} className="p-3 bg-white border rounded-xl"><Download size={20}/></button>
                                <label className="p-3 bg-white border rounded-xl cursor-pointer hover:bg-stone-50"><Upload size={20}/><input type="file" ref={menuImportRef} onChange={handleImportMenu} className="hidden"/></label>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMenuItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold">{item.name}</h4>
                                        <span className="font-bold text-orange-600">${item.price}</span>
                                    </div>
                                    <p className="text-sm text-stone-500 mb-4 flex-1">{item.description}</p>
                                    <div className="flex gap-2 pt-4 border-t border-stone-100">
                                        <button onClick={() => handleEditMenu(item)} className="flex-1 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Edit2 size={12}/> Edit</button>
                                        <button onClick={() => handleDeleteMenu(item.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AGENTS TAB */}
                {activeTab === 'agents' && (
                    <div className="space-y-6">
                        {/* ... Agents code ... */}
                        <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Fleet Management</h2>
                                <p className="text-sm text-stone-500">Manage delivery agents and their status.</p>
                            </div>
                            <div className="flex gap-3">
                                <select 
                                    value={agentVehicleFilter} 
                                    onChange={(e) => setAgentVehicleFilter(e.target.value)}
                                    className="p-3 rounded-xl border border-stone-200 text-sm font-bold bg-stone-50 outline-none focus:ring-2 focus:ring-stone-900"
                                >
                                    <option value="all">All Vehicles</option>
                                    <option value="car">Car</option>
                                    <option value="bike">Bike</option>
                                    <option value="scooter">Scooter</option>
                                    <option value="van">Van</option>
                                </select>
                                <button onClick={() => handleEditAgent()} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-stone-800 transition">
                                    <Plus size={18}/> Add Agent
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents
                                .filter(a => agentVehicleFilter === 'all' || a.vehicleType === agentVehicleFilter)
                                .map(agent => (
                                <div key={agent.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${
                                        agent.status === 'available' ? 'bg-green-500' : 
                                        agent.status === 'busy' ? 'bg-orange-500' : 
                                        'bg-stone-300'
                                    }`}></div>
                                    
                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-stone-900">{agent.name}</h3>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                agent.status === 'available' ? 'bg-green-100 text-green-700' : 
                                                agent.status === 'busy' ? 'bg-orange-100 text-orange-700' : 
                                                'bg-stone-100 text-stone-500'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    agent.status === 'available' ? 'bg-green-500' : 
                                                    agent.status === 'busy' ? 'bg-orange-500' : 
                                                    'bg-stone-400'
                                                }`}></div>
                                                {agent.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                                            {agent.vehicleType === 'car' ? <Truck size={18}/> : <Bike size={18}/>}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6 pl-2">
                                        <div className="flex items-center gap-2 text-sm text-stone-600">
                                            <Phone size={14} className="text-stone-400"/>
                                            <span>{agent.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-stone-600">
                                            <MapPin size={14} className="text-stone-400"/>
                                            <span>Lat: {agent.currentLat.toFixed(4)}, Lng: {agent.currentLng.toFixed(4)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-auto pl-2">
                                        <button onClick={() => handleEditAgent(agent)} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg text-xs font-bold hover:bg-stone-200 transition">Edit</button>
                                        <button onClick={() => handleDeleteAgent(agent.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;