import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Coffee, Settings, Sparkles, Menu as MenuIcon, Globe, ChevronDown, X, ChefHat, Phone, MessageCircle, Clock, MapPin, Loader2, HelpCircle, Users, Info as InfoIcon, Briefcase, Bell, CheckCircle, Search, ArrowRight, Truck } from 'lucide-react';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import Info from './pages/Info';
import Tracking from './pages/Tracking';
import OrderDetails from './pages/OrderDetails';
import AgentPortal from './pages/AgentPortal'; 
import ChatWidget from './components/ChatWidget';
import { MenuItem, Order, DeliveryAgent } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageCode } from './utils/translations';
import { fetchMenu, fetchOrders, fetchAgents } from './services/menuRepository';

// --- Notification Component ---
const OrderNotification: React.FC<{ order: Order, agent?: DeliveryAgent, onClose: () => void }> = ({ order, agent, onClose }) => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const timer = setTimeout(onClose, 8000); // Auto close after 8s
        return () => clearTimeout(timer);
    }, [onClose]);

    const isCourierUpdate = order.deliveryStatus === 'on_way' || order.deliveryStatus === 'picked_up';
    const isApproved = order.status === 'approved' && !isCourierUpdate;

    return (
        <div className="fixed top-24 right-4 md:w-96 z-[100] animate-in slide-in-from-right-4 fade-in">
            <div className={`bg-white rounded-2xl shadow-2xl border-l-4 p-4 flex items-start gap-4 relative overflow-hidden ${isCourierUpdate ? 'border-l-blue-500' : 'border-l-green-500'}`}>
                <div className={`p-2 rounded-full mt-1 ${isCourierUpdate ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {isCourierUpdate ? <Truck size={24} /> : <CheckCircle size={24} />}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-stone-900 text-sm">
                        {isCourierUpdate ? 'Courier En Route!' : 'Order Approved!'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {isCourierUpdate ? (
                            <span>
                                {agent ? <strong>{agent.name}</strong> : 'Our courier'} has picked up your order <span className="font-mono font-bold">#{order.id.slice(-6)}</span> and is heading to you.
                            </span>
                        ) : (
                            <span>
                                Great news! Your order <span className="font-mono font-bold">#{order.id.slice(-6)}</span> has been approved and is now being prepared in the kitchen.
                            </span>
                        )}
                    </p>
                    <button 
                        onClick={() => {
                            onClose();
                            navigate(`/tracking/${order.id}`);
                        }}
                        className="mt-3 text-xs font-bold text-white bg-stone-900 px-4 py-2 rounded-lg hover:bg-stone-800 transition w-full"
                    >
                        Track Live
                    </button>
                </div>
                <button onClick={onClose} className="text-stone-300 hover:text-stone-500"><X size={16}/></button>
            </div>
        </div>
    );
};

const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navSearchTerm, setNavSearchTerm] = useState('');

  // Hide Navbar on Agent Portal for immersive feel
  if (location.pathname.startsWith('/agent/')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchTerm.trim()) {
        setIsSearchOpen(false);
        navigate(`/menu?search=${encodeURIComponent(navSearchTerm)}`);
        setNavSearchTerm('');
    }
  };

  const isActive = (path: string) => location.pathname === path 
    ? 'bg-stone-800 text-white shadow-md' 
    : 'text-stone-300 hover:bg-stone-800 hover:text-white';
  
  return (
    <nav className="bg-stone-900 border-b border-stone-800 sticky top-0 z-40 transition-all duration-300 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all duration-300">
                <span className="font-serif font-black text-2xl italic tracking-tighter">S</span>
            </div>
            <div className="flex flex-col">
               <span className="font-serif font-black text-2xl leading-none tracking-tight text-white group-hover:text-orange-500 transition-colors">Stanley's</span>
               <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 group-hover:text-orange-400 transition-colors ml-0.5">Fine Dining</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3 font-medium text-sm">
            <Link to="/" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/')}`}>
                {t('nav_home')}
            </Link>
            
            {/* Menu Dropdown */}
            <div className="relative group h-full flex items-center">
              <Link 
                to="/menu" 
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all duration-300 ${location.pathname.startsWith('/menu') ? 'bg-stone-800 text-white shadow-md' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}
              >
                {t('nav_menu')} <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180"/>
              </Link>
              
              <div className="absolute top-full left-0 mt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-2">
                <div className="bg-white shadow-2xl rounded-2xl border border-stone-100 overflow-hidden p-1">
                   {['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks'].map(cat => (
                      <Link 
                        key={cat}
                        to={`/menu?category=${cat}`} 
                        className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition text-stone-600 text-sm font-medium"
                      >
                         {cat} <ChevronDown size={12} className="-rotate-90 text-stone-300"/>
                      </Link>
                   ))}
                   <div className="border-t border-stone-100 my-1"></div>
                   <Link to="/menu" className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 transition text-orange-600 text-sm font-bold">
                      Full Menu <MenuIcon size={14}/>
                   </Link>
                </div>
              </div>
            </div>

            <Link to="/admin" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/admin')}`}>
                {t('nav_admin')}
            </Link>

            {/* Call Icon */}
             <a href="tel:+971504291207" className="p-2 rounded-full text-stone-300 hover:bg-stone-800 hover:text-white transition-all duration-300" title="Call Us">
                 <Phone size={20} />
             </a>

            {/* PRIMARY ORDER BUTTON (Chat Trigger) */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white border border-[#1ebd59] rounded-full hover:bg-[#20ba59] transition shadow-lg text-xs font-bold uppercase tracking-wider animate-pulse hover:animate-none"
            >
              <MessageCircle size={16} fill="white"/> Order Now
            </button>

            {/* Support Dropdown */}
            <div className="relative group h-full flex items-center">
                <button className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all duration-300 ${location.pathname.startsWith('/info') ? 'bg-stone-800 text-white shadow-md' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}>
                    {t('nav_support')} <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180"/>
                </button>
                 <div className="absolute top-full right-0 mt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-2">
                    <div className="bg-white shadow-2xl rounded-2xl border border-stone-100 overflow-hidden p-1">
                        <Link to="/info/about" className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition text-stone-600 text-sm font-medium"><Users size={16} className="text-blue-500"/> {t('sub_about')}</Link>
                        <Link to="/info/services" className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition text-stone-600 text-sm font-medium"><Briefcase size={16} className="text-purple-500"/> {t('sub_services')}</Link>
                        <Link to="/info/location" className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition text-stone-600 text-sm font-medium"><MapPin size={16} className="text-red-500"/> {t('sub_location')}</Link>
                        <Link to="/info/contact" className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition text-stone-600 text-sm font-medium"><Phone size={16} className="text-green-500"/> {t('sub_contact')}</Link>
                        <Link to="/info/faq" className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition text-stone-600 text-sm font-medium"><HelpCircle size={16} className="text-orange-500"/> {t('sub_faq')}</Link>
                    </div>
                </div>
            </div>

            {/* Search Button */}
            <div className="relative">
                <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`p-2 rounded-full transition-all duration-300 ${isSearchOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}
                >
                    <Search size={20} />
                </button>
                {isSearchOpen && (
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="absolute top-full right-0 mt-2 w-72 bg-white p-2 rounded-xl shadow-xl border border-stone-100 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 z-50"
                    >
                        <input 
                            type="text"
                            placeholder="Search menu..."
                            value={navSearchTerm}
                            onChange={(e) => setNavSearchTerm(e.target.value)}
                            autoFocus
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 text-stone-800 placeholder:text-stone-400"
                        />
                         <button type="submit" className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-md">
                             <ArrowRight size={16}/>
                         </button>
                    </form>
                )}
            </div>

            {/* Language Selector */}
            <div className="relative group ml-2">
                <button className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-stone-700 hover:border-orange-500 hover:bg-stone-800 transition bg-stone-900">
                    <Globe size={16} className="text-stone-300"/>
                    <span className="text-xs font-bold uppercase text-stone-300">{language}</span>
                    <ChevronDown size={12} className="text-stone-500"/>
                </button>
                <div className="absolute top-full right-0 mt-2 w-32 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-2">
                    <div className="bg-white shadow-xl rounded-xl border border-stone-100 overflow-hidden p-1">
                        {['en', 'es', 'fr', 'zh', 'ar', 'hi'].map((lang) => (
                            <button 
                                key={lang}
                                onClick={() => setLanguage(lang as LanguageCode)}
                                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase hover:bg-stone-50 rounded flex justify-between ${language === lang ? 'text-orange-600 bg-orange-50' : 'text-stone-600'}`}
                            >
                                {lang} {language === lang && <CheckCircle size={12}/>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
    </nav>
  );
};

const AppContent: React.FC<{ menu: MenuItem[], refreshMenu: () => Promise<void> }> = ({ menu, refreshMenu }) => {
    const [latestNotification, setLatestNotification] = useState<{order: Order, agent?: DeliveryAgent} | null>(null);
    const [trackedOrders, setTrackedOrders] = useState<string[]>([]);

    // Poll for status updates on my orders
    useEffect(() => {
        const checkStatus = async () => {
            const allOrders = await fetchOrders();
            const agents = fetchAgents();
            
            // Get local user's orders (mocked by using localStorage 'my_orders' which we populate in ChatWidget)
            const myOrderIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
            
            // Filter only my orders
            const myOrders = allOrders.filter(o => myOrderIds.includes(o.id));

            myOrders.forEach(order => {
                // Transition: Pending -> Approved
                if (order.status === 'approved' && !trackedOrders.includes(order.id + '_approved')) {
                    setLatestNotification({ order });
                    setTrackedOrders(prev => [...prev, order.id + '_approved']);
                }

                // Transition: Picking/Ready -> On Way (Courier Assigned & Moving)
                if ((order.deliveryStatus === 'on_way' || order.deliveryStatus === 'picked_up') && !trackedOrders.includes(order.id + '_onway')) {
                    const agent = agents.find(a => a.id === order.deliveryAgentId);
                    setLatestNotification({ order, agent });
                    setTrackedOrders(prev => [...prev, order.id + '_onway']);
                }
            });
        };
        
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [trackedOrders]);

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
            <NavBar />
            
            {latestNotification && (
                <OrderNotification 
                    order={latestNotification.order} 
                    agent={latestNotification.agent}
                    onClose={() => setLatestNotification(null)} 
                />
            )}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu menu={menu} />} />
                <Route path="/admin/*" element={<Admin menu={menu} refreshMenu={refreshMenu} />} />
                <Route path="/info/:section" element={<Info />} />
                <Route path="/tracking/:orderId" element={<Tracking />} />
                <Route path="/admin/orders/:orderId" element={<OrderDetails />} />
                <Route path="/agent/:agentId" element={<AgentPortal />} />
            </Routes>

            {/* Chat Widget always available */}
            <ChatWidget menu={menu} />
        </div>
    );
};

const App: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  const loadMenu = useCallback(async () => {
    const data = await fetchMenu();
    setMenu(data);
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return (
    <LanguageProvider>
        <AppContent menu={menu} refreshMenu={loadMenu} />
    </LanguageProvider>
  );
};

export default App;