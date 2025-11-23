
import React, { useState, useEffect } from 'react';
import { MenuItem, Review, CartItem, OrderType, Order } from '../types';
import { ShoppingCart, Star, ChevronDown, ChevronUp, Send, User, Search, Trash2, CreditCard, Bike, ShoppingBag, Utensils, X, MessageCircle, Phone, ShieldCheck, Lock, Info, Flame, Wheat, FileText, CheckCircle, Banknote, Link as LinkIcon, Loader2, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createOrder, generateWhatsAppOrderMessage, COUNTRY_CODES } from '../services/menuRepository';

interface MenuProps {
  menu: MenuItem[];
}

const DELIVERY_FEE = 15.00; // Configurable delivery fee

const Menu: React.FC<MenuProps> = ({ menu }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Category Management
  const uniqueCategories: string[] = Array.from(new Set(menu.map(item => item.category))).filter((c): c is string => !!c).sort();
  const activeCat = searchParams.get('category') || t('menu_category_all');

  const handleCategoryChange = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === t('menu_category_all') || cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online_link'>('cash');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneCode, setCustomerPhoneCode] = useState('+971');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Confirmation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  
  // Item Expansion & Reviews State
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, 'details' | 'reviews'>>({}); 
  const [reviewInputs, setReviewInputs] = useState<Record<string, string>>({});
  const [ratingInputs, setRatingInputs] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedReviews = localStorage.getItem('gourmetai_reviews');
    if (storedReviews) {
      try {
        setReviews(JSON.parse(storedReviews) as Record<string, Review[]>);
      } catch (e: any) {
        console.error("Failed to parse reviews", e);
      }
    }
  }, []);

  // --- Cart Functions ---
  const addToCart = (item: MenuItem) => {
    if (confirmedOrder) {
        setConfirmedOrder(null);
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : i;
        }
        return i;
      });
    });
  };

  const clearCart = () => {
    if (window.confirm("Are you sure you want to cancel your order?")) {
      setCart([]);
    }
  };

  const closeCart = () => {
    setIsCartOpen(false);
    if (confirmedOrder) {
        setTimeout(() => {
            setConfirmedOrder(null);
            setCart([]);
        }, 300);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const tax = cartTotal * 0.05;
  const finalTotal = Number((cartTotal + tax + deliveryCharge).toFixed(2));

  const handlePlaceOrder = async () => {
    if (!customerName || !customerPhone) {
        alert("Please enter your name and phone number.");
        return;
    }

    setIsProcessing(true);
    
    const fullPhone = `${customerPhoneCode} ${customerPhone}`;

    // Construct Order Object
    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName,
        phoneNumber: fullPhone,
        items: cart,
        total: finalTotal,
        status: 'pending_approval', // Needs Admin Approval
        timestamp: new Date().toISOString(),
        type: orderType,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'online_link' ? 'pending' : 'pending', // In real app, 'card' might be 'paid' instantly
        deliveryLocation: { lat: 25.2048, lng: 55.2708 } // Mock Location (Downtown Dubai)
    };

    try {
        // Simulate Network Delay for Payment Link Generation
        if (paymentMethod === 'online_link') {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const savedOrder = await createOrder(newOrder);
        setConfirmedOrder(savedOrder);
    } catch (error) {
        console.error("Order placement failed", error);
        alert("Failed to place order. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleNotifyAdmin = () => {
    if (confirmedOrder) {
      const link = generateWhatsAppOrderMessage(confirmedOrder);
      window.open(link, '_blank');
    }
  };

  // --- Review/Expand Functions ---
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    if (!activeTab[id]) {
        setActiveTab(prev => ({...prev, [id]: 'details'}));
    }
  };

  const handleRatingClick = (itemId: string, rating: number) => {
    setRatingInputs(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleInputChange = (itemId: string, text: string) => {
    setReviewInputs(prev => ({ ...prev, [itemId]: text }));
  };

  const handleSubmitReview = (itemId: string) => {
    const text = reviewInputs[itemId]?.trim();
    const rating = ratingInputs[itemId] || 5;
    
    if (!text) return;

    const newReview: Review = {
      id: Date.now().toString(),
      itemId,
      userName: 'Guest Customer',
      rating,
      comment: text,
      date: new Date().toLocaleDateString()
    };

    const updatedReviews = {
      ...reviews,
      [itemId]: [...(reviews[itemId] || []), newReview]
    };

    setReviews(updatedReviews);
    localStorage.setItem('gourmetai_reviews', JSON.stringify(updatedReviews));
    
    setReviewInputs(prev => ({ ...prev, [itemId]: '' }));
    setRatingInputs(prev => ({ ...prev, [itemId]: 5 }));
  };

  // Filter Logic
  const filteredMenu = menu.filter(item => {
    const categoryMatch = 
        activeCat === t('menu_category_all') || 
        activeCat === 'All' || 
        item.category.toLowerCase() === activeCat.toLowerCase();

    const searchMatch = 
        searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const renderStars = (rating: number, interactive = false, itemId?: string, setRating?: (r: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!interactive}
            onClick={() => interactive && itemId && setRating && setRating(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}`}
          >
            <Star 
              size={interactive ? 20 : 14} 
              className={`${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-300'} ${interactive ? 'stroke-2' : 'stroke-1'}`} 
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-12 pb-24">
      
      {/* Menu Hero Banner */}
      <div className="relative bg-stone-900 text-white py-20 md:py-24 mb-12 rounded-3xl overflow-hidden shadow-xl">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3c6221741?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-40 transform scale-105"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
         <div className="relative z-10 text-center px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-2xl">{t('menu_title')}</h1>
            <p className="text-xl text-stone-200 font-light max-w-2xl mx-auto drop-shadow-lg">{t('menu_subtitle')}</p>
         </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-6 mb-12 max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-4 top-3.5 text-stone-400" size={20} />
            <input 
                type="text"
                placeholder={t('menu_search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 rounded-full border border-stone-200 bg-white text-stone-700 focus:ring-2 focus:ring-orange-200 outline-none transition font-medium shadow-sm"
            />
        </div>

        {/* Category Controls */}
        <div className="flex justify-center w-full">
            
            {/* Mobile Dropdown (Visible only on small screens) */}
            <div className="relative w-full max-w-xs md:hidden">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none">
                    <Filter size={16} />
                </div>
                <select 
                    value={activeCat}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-stone-200 text-stone-700 py-3 pl-10 pr-10 rounded-full font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-sm cursor-pointer"
                >
                    <option value={t('menu_category_all')}>{t('menu_category_all')}</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
            </div>

            {/* Desktop Pills (Visible only on medium+ screens) */}
            <div className="hidden md:flex flex-wrap justify-center gap-2 md:gap-4">
                <button
                    onClick={() => handleCategoryChange(t('menu_category_all'))}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border ${
                    activeCat === t('menu_category_all') || activeCat === 'All'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-lg transform scale-105'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm'
                    }`}
                >
                    {t('menu_category_all')}
                </button>
                {uniqueCategories.map((cat: string) => (
                    <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border ${
                        activeCat === cat
                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg transform scale-105'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm'
                    }`}
                    >
                    {cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMenu.length === 0 && (
            <div className="col-span-full text-center py-20 opacity-50">
                <Utensils size={48} className="mx-auto mb-4 text-stone-300"/>
                <p className="text-xl font-bold text-stone-400">{t('menu_no_items')}</p>
                <button onClick={() => {setSearchTerm(''); handleCategoryChange(t('menu_category_all'));}} className="mt-4 text-orange-600 font-bold hover:underline">Clear Filters</button>
            </div>
        )}

        {filteredMenu.map(item => {
            const itemReviews: Review[] = reviews[item.id] || [];
            const avgRating = itemReviews.length > 0 
                ? itemReviews.reduce((acc, r) => acc + r.rating, 0) / itemReviews.length 
                : 0;
            const isExpanded = expandedItems[item.id];
            const isInCart = cart.some(c => c.id === item.id);
            const currentTab = activeTab[item.id] || 'details';

            return (
              <div key={item.id} className={`bg-white rounded-2xl shadow-sm transition-all duration-300 border border-stone-100 overflow-hidden group h-fit ${!item.available ? 'opacity-75' : ''} hover:shadow-xl hover:-translate-y-1`}>
                {/* Image Area with Zoom Effect */}
                <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => toggleExpand(item.id)}>
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${item.available ? 'group-hover:scale-110' : 'grayscale'}`}
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-base font-bold text-stone-900 shadow-md">
                    ${item.price}
                  </div>
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider transform -rotate-12 shadow-2xl border-2 border-white">{t('menu_sold_out')}</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-stone-800 flex-1 leading-tight">{item.name}</h3>
                      {itemReviews.length > 0 && (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs font-bold text-yellow-700 ml-2 shrink-0">
                              <Star size={12} className="fill-yellow-700 text-yellow-700"/>
                              {avgRating.toFixed(1)}
                          </div>
                      )}
                  </div>
                  
                  <p className="text-stone-500 text-sm mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                    <button 
                        onClick={() => toggleExpand(item.id)}
                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition ${isExpanded ? 'text-orange-600' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                       {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                       {isExpanded ? "Close Details" : "View Details"}
                    </button>
                    
                    <button 
                        disabled={!item.available}
                        onClick={() => addToCart(item)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm ${
                            item.available 
                            ? isInCart ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-stone-900 text-white hover:bg-orange-600 hover:shadow-orange-200'
                            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                    >
                      <ShoppingCart size={18} /> {item.available ? (isInCart ? t('cart_update') : t('cart_add')) : t('menu_sold_out')}
                    </button>
                  </div>

                  {/* EXPANDED DETAILS SECTION */}
                  {isExpanded && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                        {/* Tabs */}
                        <div className="flex border-b border-stone-200 mb-4">
                            <button 
                                onClick={() => setActiveTab(prev => ({...prev, [item.id]: 'details'}))}
                                className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${currentTab === 'details' ? 'border-orange-500 text-orange-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                            >
                                Product Details
                            </button>
                            <button 
                                onClick={() => setActiveTab(prev => ({...prev, [item.id]: 'reviews'}))}
                                className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${currentTab === 'reviews' ? 'border-orange-500 text-orange-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                            >
                                Reviews ({itemReviews.length})
                            </button>
                        </div>

                        {currentTab === 'details' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex items-center gap-2">
                                        <Flame size={16} className="text-orange-500" />
                                        <div>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase">Calories</p>
                                            <p className="text-sm font-bold text-stone-800">{item.calories || '350'} kcal</p>
                                        </div>
                                    </div>
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex items-center gap-2">
                                        <Wheat size={16} className="text-yellow-500" />
                                        <div>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase">Allergens</p>
                                            <p className="text-xs font-bold text-stone-800 truncate">
                                                {item.allergens && item.allergens.length > 0 ? item.allergens.join(', ') : 'None'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentTab === 'reviews' && (
                            <div className="space-y-4">
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {itemReviews.length === 0 && (
                                        <p className="text-xs text-stone-400 italic text-center py-4">No reviews yet. Be the first!</p>
                                    )}
                                    {itemReviews.map(review => (
                                        <div key={review.id} className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-xs text-stone-800">{review.userName}</span>
                                                <span className="text-[10px] text-stone-400">{review.date}</span>
                                            </div>
                                            <div className="flex mb-1">
                                                {renderStars(review.rating)}
                                            </div>
                                            <p className="text-xs text-stone-600">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                                    <p className="text-xs font-bold text-stone-500 mb-2 uppercase">{t('menu_write_review')}</p>
                                    <div className="flex mb-2 gap-1">
                                        {renderStars(ratingInputs[item.id] || 5, true, item.id, (r) => handleRatingClick(item.id, r))}
                                    </div>
                                    <textarea
                                        className="w-full p-2 text-xs border rounded bg-white mb-2 focus:ring-1 focus:ring-orange-200 outline-none resize-none"
                                        placeholder="Share your experience..."
                                        value={reviewInputs[item.id] || ''}
                                        onChange={(e) => handleInputChange(item.id, e.target.value)}
                                    />
                                    <button 
                                        onClick={() => handleSubmitReview(item.id)}
                                        className="w-full bg-stone-800 text-white py-1.5 rounded text-xs font-bold hover:bg-stone-700 transition"
                                    >
                                        {t('menu_submit_review')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            );
        })}
      </div>

      {/* CART DRAWER / CHECKOUT */}
      {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
             <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart}></div>
             <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="bg-stone-900 text-white p-6 flex justify-between items-center shadow-md z-10 shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="text-orange-500"/> {confirmedOrder ? 'Order Placed' : t('cart_title')}</h2>
                    <button onClick={closeCart} className="hover:text-orange-500 transition"><X size={24}/></button>
                </div>
                
                {confirmedOrder ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300 bg-stone-50">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                            <CheckCircle size={64} className="animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-bold text-stone-800 mb-2">Order Pending Approval!</h3>
                        <p className="text-stone-500 mb-8 max-w-xs leading-relaxed">
                            Your order <span className="font-mono font-bold text-stone-800">#{confirmedOrder.id}</span> has been sent to the kitchen.
                        </p>

                        {/* WhatsApp Notification Button */}
                        <button 
                            onClick={handleNotifyAdmin}
                            className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-bold shadow-lg mb-6 flex items-center justify-center gap-3 transition-all hover:-translate-y-1"
                        >
                            <MessageCircle size={24} className="fill-white text-white" />
                            <div className="text-left">
                                <div className="text-sm leading-none">Notify Restaurant</div>
                                <div className="text-xs font-normal opacity-90">Send Order via WhatsApp</div>
                            </div>
                        </button>

                        {confirmedOrder.paymentLink && (
                            <div className="w-full bg-white p-4 rounded-xl border border-blue-200 mb-6 text-left">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-2">
                                    <LinkIcon size={14}/> Payment Link
                                </p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={confirmedOrder.paymentLink} className="flex-1 text-xs bg-blue-50 p-2 rounded border border-blue-100 text-stone-500" />
                                    <button className="text-xs bg-blue-600 text-white px-3 rounded font-bold">Pay</button>
                                </div>
                            </div>
                        )}

                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4 mb-8">
                             <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                                <span className="text-sm text-stone-500">Total Amount</span>
                                <span className="text-2xl font-bold text-stone-900">${confirmedOrder.total}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-stone-500">Payment</span>
                                <span className="text-sm font-bold text-stone-900 uppercase">{confirmedOrder.paymentMethod.replace('_', ' ')}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-stone-500">Status</span>
                                <span className="text-sm font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">Pending</span>
                             </div>
                        </div>

                        <button 
                            onClick={() => navigate(`/tracking/${confirmedOrder.id}`)}
                            className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 transition w-full mb-3 flex items-center justify-center gap-2"
                        >
                            <Bike size={20}/> Track Order Live
                        </button>
                        <button 
                            onClick={closeCart}
                            className="px-8 py-3 bg-stone-200 text-stone-600 rounded-xl font-bold shadow-sm hover:bg-stone-300 transition w-full"
                        >
                            Close Window
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-60">
                                    <ShoppingBag size={64} className="mb-4"/>
                                    <p>{t('cart_empty')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                            <div className="relative">
                                                <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-stone-100"/>
                                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-stone-800 text-sm line-clamp-1">{item.name}</h4>
                                                <p className="text-stone-500 text-xs mb-2">${item.price.toFixed(2)}</p>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-sm transition">-</button>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-sm transition">+</button>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-500 p-2 transition"><Trash2 size={16}/></button>
                                        </div>
                                    ))}

                                    {/* Customer Info */}
                                    <div className="mt-6 bg-white p-4 rounded-xl border border-stone-200">
                                        <h3 className="font-bold text-sm text-stone-800 mb-3 flex items-center gap-2"><User size={16}/> Customer Details</h3>
                                        <div className="space-y-3">
                                            <input 
                                                type="text" 
                                                placeholder="Full Name"
                                                className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm outline-none focus:border-orange-300"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <select 
                                                    className="p-2 bg-stone-50 border border-stone-200 rounded text-sm outline-none focus:border-orange-300"
                                                    value={customerPhoneCode}
                                                    onChange={e => setCustomerPhoneCode(e.target.value)}
                                                >
                                                    {COUNTRY_CODES.map(c => (
                                                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                                    ))}
                                                </select>
                                                <input 
                                                    type="tel" 
                                                    placeholder="Phone Number"
                                                    className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded text-sm outline-none focus:border-orange-300"
                                                    value={customerPhone}
                                                    onChange={e => setCustomerPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 border-t border-stone-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-20 overflow-y-auto max-h-[50vh]">
                                
                                {/* Order Type Selector - Moved Here */}
                                <div className="mb-4">
                                    <div className="flex bg-stone-100 p-1 rounded-xl">
                                        <button 
                                            onClick={() => setOrderType('dine-in')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'dine-in' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                        >
                                            Dine-In
                                        </button>
                                        <button 
                                            onClick={() => setOrderType('delivery')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'delivery' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                        >
                                            Delivery
                                        </button>
                                        <button 
                                            onClick={() => setOrderType('pickup')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'pickup' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                        >
                                            Pickup
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Method - Moved Here */}
                                <div className="mb-4">
                                    <h3 className="font-bold text-xs text-stone-500 uppercase mb-2">Payment</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPaymentMethod('cash')} className={`flex-1 p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-500'}`}>
                                            <Banknote size={16}/> Cash
                                        </button>
                                        <button onClick={() => setPaymentMethod('card')} className={`flex-1 p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-500'}`}>
                                            <CreditCard size={16}/> Card
                                        </button>
                                        <button onClick={() => setPaymentMethod('online_link')} className={`flex-1 p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 ${paymentMethod === 'online_link' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-500'}`}>
                                            <LinkIcon size={16}/> Link
                                        </button>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="space-y-2 mb-6 border-t border-stone-100 pt-4">
                                    <div className="flex justify-between text-stone-500 text-xs">
                                        <span>Subtotal</span>
                                        <span>${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-500 text-xs">
                                        <span>Taxes (5%)</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>
                                    {orderType === 'delivery' && (
                                        <div className="flex justify-between text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded">
                                            <span>Delivery Fee</span>
                                            <span>${deliveryCharge.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                                        <span className="text-stone-800 font-bold">Total</span>
                                        <span className="text-2xl font-bold text-orange-600">${finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <button onClick={clearCart} className="col-span-1 py-3 rounded-xl border border-red-100 bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-normal">Cancel</span>
                                    </button>
                                    <button 
                                        onClick={handlePlaceOrder} 
                                        disabled={isProcessing}
                                        className="col-span-2 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle size={20} className="text-green-400"/>} 
                                        <span>{isProcessing ? "Processing..." : "Confirm Order"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
             </div>
          </div>
      )}
    </div>
  );
};

export default Menu;
