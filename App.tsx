
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Phone, Search, ArrowRight, Users, Briefcase, MapPin, HelpCircle, Truck, CheckCircle, X, ShoppingBag } from 'lucide-react';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import Info from './pages/Info';
import Tracking from './pages/Tracking';
import OrderDetails from './pages/OrderDetails';
import AgentPortal from './pages/AgentPortal'; 
import AILab from './pages/AILab';
import ChatWidget from './components/ChatWidget';
import { MenuItem, Order, DeliveryAgent } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { fetchMenu } from './services/menuRepository';
import { ASSETS } from './assets';

// --- Notification Component ---
const OrderNotification: React.FC<{ order: Order, agent?: DeliveryAgent, onClose: () => void }> = ({ order, agent, onClose }) => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const timer = setTimeout(onClose, 8000); // Auto close after 8s
        return () => clearTimeout(timer);
    }, [onClose]);

    const isCourierUpdate = order.deliveryStatus === 'on_way' || order.deliveryStatus === 'picked_up';

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
  const [scrolled, setScrolled] = useState(false);

  // Handle Scroll Effect
  useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 20);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Categories for Rich Dropdown
  const MENU_CATEGORIES = [
    { id: 'Breakfast', label: 'Breakfast', desc: 'Start your day right', image: ASSETS.products.categories.breakfast },
    { id: 'Lunch', label: 'Lunch', desc: 'Mid-day favorites', image: ASSETS.products.categories.lunch },
    { id: 'Dinner', label: 'Dinner', desc: 'Exquisite evening meals', image: ASSETS.products.categories.dinner },
    { id: 'Desserts', label: 'Desserts', desc: 'Sweet endings', image: ASSETS.products.categories.dessert },
    { id: 'Drinks', label: 'Drinks', desc: 'Refreshments & Wines', image: ASSETS.products.categories.drinks },
  ];
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
        {/* Glass Background */}
        <div className={`absolute inset-0 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/50 shadow-2xl transition-all duration-500 ${scrolled ? 'opacity-100' : 'opacity-90'}`}></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <span className="font-serif font-black text-xl italic tracking-tighter relative z-10">S</span>
            </div>
            <div className="flex flex-col">
               <span className="font-serif font-bold text-xl leading-none tracking-tight text-stone-100 group-hover:text-orange-500 transition-colors">Stanley's</span>
               <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500 group-hover:text-orange-400 transition-colors ml-0.5">Fine Dining</span>
            </div>
          </Link>

          {/* Center Navigation Pills */}
          <div className="hidden md:flex items-center bg-stone-900/80 p-1.5 rounded-full border border-stone-800/50 shadow-inner backdrop-blur-md">
            <Link to="/" className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isActive('/') ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:text-white hover:bg-stone-800/30'}`}>
                {t('nav_home')}
            </Link>
            
            {/* Mega Menu Dropdown */}
            <div className="relative group px-1">
              <Link 
                to="/menu" 
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${location.pathname.startsWith('/menu') ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:text-white hover:bg-stone-800/30'}`}
              >
                {t('nav_menu')} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform duration-300 text-stone-500 group-hover:text-orange-500"/>
              </Link>
              
              {/* Enhanced Dropdown Panel */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-[500px] hidden group-hover:block animate-in fade-in slide-in-from-top-4 pt-2 cursor-default">
                <div className="bg-stone-900/95 backdrop-blur-2xl border border-stone-800/50 rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden p-2 ring-1 ring-white/10">
                   <div className="grid grid-cols-2 gap-1">
                       {MENU_CATEGORIES.map(cat => (
                          <Link 
                            key={cat.id}
                            to={`/menu?category=${cat.id}`} 
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-800/60 transition-all group/item"
                          >
                             <img src={cat.image} alt={cat.label} className="w-10 h-10 rounded-lg object-cover shadow-sm group-hover/item:scale-110 transition-transform duration-500 border border-stone-800"/>
                             <div className="flex-1">
                                 <h4 className="text-stone-200 font-bold text-sm group-hover/item:text-orange-500 transition-colors">{cat.label}</h4>
                                 <p className="text-stone-500 text-[10px] line-clamp-1">{cat.desc}</p>
                             </div>
                             <ArrowRight size={12} className="text-stone-600 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all"/>
                          </Link>
                       ))}
                       <Link to="/menu" className="col-span-2 mt-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-orange-900/10 to-orange-800/10 border border-orange-500/20 hover:border-orange-500/40 transition-all group/all">
                          <span className="text-orange-500 font-bold text-xs uppercase tracking-wider">View Full Menu</span>
                          <ArrowRight size={14} className="text-orange-500 group-hover/all:translate-x-1 transition-transform"/>
                       </Link>
                   </div>
                </div>
              </div>
            </div>

            {/* Admin Link */}
            <Link to="/admin" className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isActive('/admin') ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:text-white hover:bg-stone-800/30'}`}>
                {t('nav_admin')}
            </Link>

            {/* Divider */}
            <div className="w-px h-4 bg-stone-800 mx-2"></div>

            {/* Support Dropdown */}
            <div className="relative group px-1">
                <button className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${location.pathname.startsWith('/info') ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:text-white hover:bg-stone-800/30'}`}>
                    {t('nav_support')} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform duration-300 text-stone-500 group-hover:text-orange-500"/>
                </button>
                 <div className="absolute top-full right-0 mt-6 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-4 pt-2">
                    <div className="bg-stone-900/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl border border-stone-800/50 overflow-hidden p-1 ring-1 ring-white/10">
                        {[
                            { to: '/info/about', icon: Users, label: t('sub_about'), color: 'text-blue-400' },
                            { to: '/info/services', icon: Briefcase, label: t('sub_services'), color: 'text-purple-400' },
                            { to: '/info/location', icon: MapPin, label: t('sub_location'), color: 'text-red-400' },
                            { to: '/info/contact', icon: Phone, label: t('sub_contact'), color: 'text-green-400' },
                            { to: '/info/faq', icon: HelpCircle, label: t('sub_faq'), color: 'text-orange-400' }
                        ].map((item, i) => (
                            <Link key={i} to={item.to} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-stone-800/60 transition text-stone-300 hover:text-white text-sm font-medium group/item">
                                <item.icon size={14} className={`${item.color} opacity-70 group-hover/item:opacity-100 transition-opacity`}/> 
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
             {/* Call Icon */}
             <a href="tel:+971504291207" className="p-2.5 rounded-full text-stone-400 hover:bg-stone-800 hover:text-white transition-all duration-300 hidden sm:flex" title="Call Us">
                 <Phone size={18} />
             </a>

            {/* Search Button */}
            <div className="relative">
                <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`p-2.5 rounded-full transition-all duration-300 ${isSearchOpen ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                >
                    <Search size={18} />
                </button>
                {isSearchOpen && (
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="absolute top-full right-0 mt-4 w-72 bg-stone-900/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-stone-800 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 z-50 ring-1 ring-white/10"
                    >
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={navSearchTerm}
                            onChange={(e) => setNavSearchTerm(e.target.value)}
                            autoFocus
                            className="flex-1 bg-stone-950/50 border border-stone-700/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/50 text-white placeholder:text-stone-600 transition-all"
                        />
                         <button type="submit" className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition shadow-lg hover:shadow-orange-500/20">
                             <ArrowRight size={14}/>
                         </button>
                    </form>
                )}
            </div>

            {/* Language Selector */}
            <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-800 hover:bg-stone-800 hover:text-white transition-all text-stone-400 text-xs font-bold uppercase">
                    {language} <ChevronDown size={10} />
                </button>
                <div className="absolute top-full right-0 mt-2 w-24 bg-stone-900/95 backdrop-blur-xl border border-stone-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-in fade-in z-50">
                    {['en', 'es', 'fr', 'zh', 'ar', 'hi'].map(lang => (
                        <button 
                            key={lang}
                            onClick={() => setLanguage(lang as any)}
                            className={`w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-stone-800 transition ${language === lang ? 'text-orange-500' : 'text-stone-400'}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMenu();
      setMenu(data);
    };
    load();
  }, []);

  return (
    <LanguageProvider>
      <NavBar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu menu={menu} />} />
          <Route path="/admin/*" element={<Admin menu={menu} refreshMenu={async () => { const data = await fetchMenu(); setMenu(data); }} />} />
          <Route path="/info/:section" element={<Info />} />
          <Route path="/tracking/:orderId" element={<Tracking />} />
          <Route path="/admin/orders/:orderId" element={<OrderDetails />} />
          <Route path="/agent/:agentId" element={<AgentPortal />} />
          <Route path="/ai-lab" element={<AILab />} />
        </Routes>
      </div>
      <ChatWidget menu={menu} />
    </LanguageProvider>
  );
};

export default App;
