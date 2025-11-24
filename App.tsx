
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

  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-stone-950/80 backdrop-blur-xl border-b border-stone-800 sticky top-0 z-50 transition-all duration-300 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <span className="font-serif font-black text-2xl italic tracking-tighter relative z-10">S</span>
            </div>
            <div className="flex flex-col">
               <span className="font-serif font-bold text-2xl leading-none tracking-tight text-stone-100 group-hover:text-orange-500 transition-colors">Stanley's</span>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500 group-hover:text-orange-400 transition-colors ml-0.5">Fine Dining</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 font-medium text-sm">
            <Link to="/" className={`px-5 py-2.5 rounded-full transition-all duration-300 ${isActive('/') ? 'bg-stone-800 text-white shadow-inner' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'}`}>
                {t('nav_home')}
            </Link>
            
            {/* Menu Dropdown */}
            <div className="relative group h-full flex items-center px-1">
              <Link 
                to="/menu" 
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full transition-all duration-300 ${location.pathname.startsWith('/menu') ? 'bg-stone-800 text-white shadow-inner' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'}`}
              >
                {t('nav_menu')} <ChevronDown size={14} className="text-stone-500 group-hover:text-orange-500 transition-transform duration-300 group-hover:rotate-180"/>
              </Link>
              
              {/* Dropdown Content */}
              <div className="absolute top-full left-0 mt-2 w-64 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-4">
                <div className="bg-stone-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl border border-stone-800/50 overflow-hidden p-2 ring-1 ring-white/5">
                   <div className="px-4 py-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Categories</div>
                   {['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks'].map(cat => (
                      <Link 
                        key={cat}
                        to={`/menu?category=${cat}`} 
                        className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-stone-800/80 transition text-stone-300 hover:text-white text-sm font-medium group/item"
                      >
                         <span className="flex items-center gap-3">
                             <span className="w-1.5 h-1.5 rounded-full bg-stone-700 group-hover/item:bg-orange-500 transition-colors"></span>
                             {cat}
                         </span>
                         <ChevronDown size={12} className="-rotate-90 text-stone-700 group-hover/item:text-orange-500 transition-colors opacity-0 group-hover/item:opacity-100 transform translate-x-2 group-hover/item:translate-x-0 duration-300"/>
                      </Link>
                   ))}
                   <div className="h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent my-2"></div>
                   <Link to="/menu" className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-orange-500/10 transition text-orange-500 hover:text-orange-400 text-sm font-bold">
                      View Full Menu <MenuIcon size={14}/>
                   </Link>
                </div>
              </div>
            </div>

            {/* Admin Link */}
            <Link to="/admin" className={`px-5 py-2.5 rounded-full transition-all duration-300 ${isActive('/admin') ? 'bg-stone-800 text-white shadow-inner' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'}`}>
                {t('nav_admin')}
            </Link>

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-stone-800 mx-2"></div>

            {/* Support Dropdown */}
            <div className="relative group h-full flex items-center px-1">
                <button className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full transition-all duration-300 ${location.pathname.startsWith('/info') ? 'bg-stone-800 text-white shadow-inner' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'}`}>
                    {t('nav_support')} <ChevronDown size={14} className="text-stone-500 group-hover:text-orange-500 transition-transform duration-300 group-hover:rotate-180"/>
                </button>
                 <div className="absolute top-full right-0 mt-2 w-64 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-4">
                    <div className="bg-stone-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl border border-stone-800/50 overflow-hidden p-2 ring-1 ring-white/5">
                        <div className="px-4 py-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Help Center</div>
                        {[
                            { to: '/info/about', icon: Users, label: t('sub_about'), color: 'text-blue-400' },
                            { to: '/info/services', icon: Briefcase, label: t('sub_services'), color: 'text-purple-400' },
                            { to: '/info/location', icon: MapPin, label: t('sub_location'), color: 'text-red-400' },
                            { to: '/info/contact', icon: Phone, label: t('sub_contact'), color: 'text-green-400' },
                            { to: '/info/faq', icon: HelpCircle, label: t('sub_faq'), color: 'text-orange-400' }
                        ].map((item, i) => (
                            <Link key={i} to={item.to} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800/80 transition text-stone-300 hover:text-white text-sm font-medium group/item">
                                <item.icon size={16} className={`${item.color} opacity-70 group-hover/item:opacity-100 transition-opacity`}/> 
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Call Icon */}
             <a href="tel:+971504291207" className="p-3 rounded-full text-stone-400 hover:bg-stone-800 hover:text-white transition-all duration-300 mx-1" title="Call Us">
                 <Phone size={18} />
             </a>

            {/* Search Button */}
            <div className="relative">
                <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`p-3 rounded-full transition-all duration-300 ${isSearchOpen ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                >
                    <Search size={18} />
                </button>
                {isSearchOpen && (
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="absolute top-full right-0 mt-4 w-80 bg-stone-900/95 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-stone-800 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 z-50 ring-1 ring-white/5"
                    >
                        <input 
                            type="text"
                            placeholder="Search menu..."
                            value={navSearchTerm}
                            onChange={(e) => setNavSearchTerm(e.target.value)}
                            autoFocus
                            className="flex-1 bg-stone-950/50 border border-stone-700/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 text-white placeholder:text-stone-600 transition-all"
                        />
                         <button type="submit" className="p-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition shadow-lg hover:shadow-orange-500/20">
                             <ArrowRight size={16}/>
                         </button>
                    </form>
                )}
            </div>

            {/* Order CTA */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))}
              className="ml-3 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full hover:from-emerald-400 hover:to-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] text-xs font-bold uppercase tracking-wider transform hover:-translate-y-0.5 duration-300"
            >
              <MessageCircle size={16} fill="white" className="animate-pulse"/> Order
            </button>

            {/* Language Selector */}
            <div className="relative group ml-3">
                <button className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-stone-800 hover:border-stone-700 bg-stone-900/50 hover:bg-stone-800 transition text-stone-400 hover:text-white">
                    <Globe size={14} />
                    <span className="text-[10px] font-bold uppercase">{language}</span>
                    <ChevronDown size={10} />
                </button>
                <div className="absolute top-full right-0 mt-2 w-32 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-4">
                    <div className="bg-stone-900/95 backdrop-blur-xl shadow-2xl rounded-xl border border-stone-800/50 overflow-hidden p-1 ring-1 ring-white/5">
                        {['en', 'es', 'fr', 'zh', 'ar', 'hi'].map((lang) => (
                            <button 
                                key={lang}
                                onClick={() => setLanguage(lang as LanguageCode)}
                                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase hover:bg-stone-800 rounded-lg flex justify-between ${language === lang ? 'text-orange-500 bg-stone-800/50' : 'text-stone-400'}`}
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
