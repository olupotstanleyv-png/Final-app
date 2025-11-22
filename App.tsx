import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Coffee, Settings, Sparkles, Menu as MenuIcon, Globe, ChevronDown, X, ChefHat, Phone, MessageCircle, Clock, MapPin, Loader2, HelpCircle, Users, Info as InfoIcon, Briefcase, Bell, CheckCircle } from 'lucide-react';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import AILab from './pages/AILab';
import Info from './pages/Info';
import Tracking from './pages/Tracking';
import OrderDetails from './pages/OrderDetails';
import AgentPortal from './pages/AgentPortal'; 
import ChatWidget from './components/ChatWidget';
import { MenuItem, Order } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageCode } from './utils/translations';
import { fetchMenu, fetchOrders } from './services/menuRepository';

// --- Notification Component ---
const OrderNotification: React.FC<{ order: Order, onClose: () => void }> = ({ order, onClose }) => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const timer = setTimeout(onClose, 8000); // Auto close after 8s
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[100] animate-in slide-in-from-top-4 fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-4 flex items-start gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">
                    <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-stone-900 text-sm">Order Approved!</h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Your order <span className="font-mono font-bold">#{order.id}</span> has been accepted by the kitchen and is being prepared.
                    </p>
                    <button 
                        onClick={() => {
                            onClose();
                            navigate(`/tracking/${order.id}`);
                        }}
                        className="mt-3 text-xs font-bold text-white bg-stone-900 px-4 py-2 rounded-lg hover:bg-stone-800 transition w-full"
                    >
                        Track Delivery
                    </button>
                </div>
                <button onClick={onClose} className="text-stone-300 hover:text-stone-500"><X size={16}/></button>
            </div>
        </div>
    );
};

const NavBar: React.FC = () => {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('gourmetai_logo'));

  // Hide Navbar on Agent Portal for immersive feel
  if (location.pathname.startsWith('/agent/')) return null;

  useEffect(() => {
    const handleLogoUpdate = () => {
        setCustomLogo(localStorage.getItem('gourmetai_logo'));
    };
    window.addEventListener('logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('logo-updated', handleLogoUpdate);
  }, []);

  const isActive = (path: string) => location.pathname === path 
    ? 'bg-stone-900 text-white shadow-md' 
    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900';
  
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-11 h-11 rounded-xl object-cover shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300" />
            ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-stone-900 to-stone-700 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300">
                <ChefHat size={26} strokeWidth={2} />
                </div>
            )}
            <div className="flex flex-col">
               <span className="font-bold text-xl leading-none tracking-tight text-stone-900 group-hover:text-orange-600 transition-colors">Stanley's</span>
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 group-hover:text-orange-400 transition-colors">Restaurant</span>
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
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all duration-300 ${location.pathname.startsWith('/menu') ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
              >
                {t('nav_menu')} <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180"/>
              </Link>
              
              <div className="absolute top-full left-0 mt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-2">
                <div className="bg-white shadow-2xl rounded-2xl border border-stone-100 overflow-hidden p-1">
                    <Link to="/menu?category=Breakfast" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs group-hover/item:scale-110 transition">🍳</span>
                        {t('cat_breakfast')}
                    </Link>
                    <Link to="/menu?category=Lunch" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs group-hover/item:scale-110 transition">🍔</span>
                        {t('cat_lunch')}
                    </Link>
                    <Link to="/menu?category=Dinner" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs group-hover/item:scale-110 transition">🍝</span>
                        {t('cat_dinner')}
                    </Link>
                    <Link to="/menu?category=Desserts" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs group-hover/item:scale-110 transition">🍰</span>
                        {t('cat_desserts')}
                    </Link>
                    <Link to="/menu?category=Drinks" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs group-hover/item:scale-110 transition">🍹</span>
                        {t('cat_drinks')}
                    </Link>
                </div>
              </div>
            </div>
            
             {/* Support Dropdown */}
             <div className="relative group h-full flex items-center">
              <button 
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all duration-300 ${location.pathname.startsWith('/info') ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
              >
                {t('nav_support')} <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180"/>
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50 pt-2">
                <div className="bg-white shadow-2xl rounded-2xl border border-stone-100 overflow-hidden p-1">
                    <Link to="/info/about" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <InfoIcon size={16} className="text-blue-500" /> {t('sub_about')}
                    </Link>
                    <Link to="/info/faq" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <HelpCircle size={16} className="text-orange-500" /> {t('sub_faq')}
                    </Link>
                    <Link to="/info/contact" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <Phone size={16} className="text-green-500" /> {t('sub_contact')}
                    </Link>
                    <Link to="/info/team" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <Users size={16} className="text-purple-500" /> {t('sub_team')}
                    </Link>
                    <Link to="/info/services" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <Briefcase size={16} className="text-indigo-500" /> {t('sub_services')}
                    </Link>
                    <Link to="/info/location" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-stone-600 transition-colors text-sm font-medium group/item">
                        <MapPin size={16} className="text-red-500" /> {t('sub_location')}
                    </Link>
                </div>
              </div>
            </div>

            <Link to="/ai-lab" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/ai-lab')}`}>{t('nav_lab')}</Link>
            <Link to="/admin" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/admin')}`}>{t('nav_admin')}</Link>
            
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-stone-200">
              <div className="relative group flex items-center bg-stone-100 px-3 py-2 rounded-full hover:bg-stone-200 transition-colors cursor-pointer">
                <Globe size={14} className="text-stone-500 mr-2" />
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  className="bg-transparent text-stone-700 font-bold focus:outline-none cursor-pointer text-xs uppercase appearance-none pr-4 py-0.5"
                >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="zh">中文</option>
                    <option value="ar">العربية</option>
                    <option value="hi">हिन्दी</option>
                </select>
                <ChevronDown size={12} className="text-stone-400 pointer-events-none absolute right-3" />
              </div>
            </div>
          </div>
          <div className="md:hidden flex gap-4 items-center">
             <Link to="/menu"><Coffee size={24} className="text-stone-600"/></Link>
          </div>
        </div>
      </nav>
  );
};

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-stone-900 text-stone-500 py-12 text-center border-t border-stone-800">
      <p>{t('footer_text')}</p>
    </footer>
  );
}

const AppContent: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifiedOrder, setNotifiedOrder] = useState<Order | null>(null);
  const location = useLocation(); // to check if on agent page

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMenu();
      setMenu(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // --- GLOBAL NOTIFICATION POLLER ---
  useEffect(() => {
    // Checks status of "My Orders" every 10 seconds
    const interval = setInterval(async () => {
        const myOrderIds: string[] = JSON.parse(localStorage.getItem('my_orders') || '[]');
        if (myOrderIds.length === 0) return;

        const allOrders = await fetchOrders();
        // Find orders belonging to me that are now approved but haven't been notified yet
        const myOrders = allOrders.filter(o => myOrderIds.includes(o.id));
        
        const recentlyApproved = myOrders.find(o => o.status === 'approved');
        
        if (recentlyApproved && recentlyApproved.id !== notifiedOrder?.id) {
             const alreadyNotified = sessionStorage.getItem(`notified_${recentlyApproved.id}`);
             if (!alreadyNotified) {
                 setNotifiedOrder(recentlyApproved);
                 sessionStorage.setItem(`notified_${recentlyApproved.id}`, 'true');
             }
        }

    }, 10000);

    return () => clearInterval(interval);
  }, [notifiedOrder]);

  if (loading && menu.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-400">
            <Loader2 size={48} className="animate-spin mb-4 text-orange-500" />
            <p className="text-sm font-medium uppercase tracking-widest">Loading Menu...</p>
        </div>
      );
  }

  const isAgentPage = location.pathname.startsWith('/agent/');

  return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans relative">
        {notifiedOrder && !isAgentPage && <OrderNotification order={notifiedOrder} onClose={() => setNotifiedOrder(null)} />}
        <NavBar />
        <div className="flex-1">
           {error && (
               <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
                   Warning: {error}. Using cached data if available.
               </div>
           )}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu menu={menu} />} />
            <Route path="/info/:section" element={<Info />} />
            <Route path="/admin" element={<Admin menu={menu} refreshMenu={loadMenu} />} />
            <Route path="/admin/orders/:orderId" element={<OrderDetails />} />
            <Route path="/agent/:agentId" element={<AgentPortal />} /> 
            <Route path="/ai-lab" element={<AILab />} />
            <Route path="/tracking/:orderId" element={<Tracking />} />
          </Routes>
        </div>
        {!isAgentPage && <Footer />}
        {!isAgentPage && <ChatWidget menu={menu} />}
      </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
       <AppContent />
    </LanguageProvider>
  );
}

export default App;