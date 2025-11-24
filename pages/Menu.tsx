import React, { useState, useEffect } from 'react';
import { MenuItem, Review, CartItem, OrderType, Order, ModifierOption, ModifierGroup } from '../types';
import { ShoppingCart, Star, ChevronDown, ChevronUp, Send, User, Search, Trash2, CreditCard, Bike, ShoppingBag, Utensils, X, MessageCircle, Phone, ShieldCheck, Lock, Info, Flame, Wheat, FileText, CheckCircle, Banknote, Link as LinkIcon, Loader2, Filter, Store, MapPin, Plus, Minus, ArrowRight, Edit2, HelpCircle, Truck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { createOrder, generateWhatsAppOrderMessage, COUNTRY_CODES, getAppConfig } from '../services/menuRepository';

interface MenuProps {
  menu: MenuItem[];
}

const Menu: React.FC<MenuProps> = ({ menu }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appConfig] = useState(getAppConfig());
  
  // --- State Management ---
  const [activeCat, setActiveCat] = useState<string>('All');
  const [activeDietary, setActiveDietary] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Cart & Order
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online_link'>('cash');
  
  // Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneCode, setCustomerPhoneCode] = useState('+971');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Modal State (Customization)
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalSelections, setModalSelections] = useState<Record<string, ModifierOption[]>>({}); // GroupID -> Selected Options
  const [modalInstructions, setModalInstructions] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null); // If editing an existing cart item

  // Order Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Derived Data
  const uniqueCategories = ['All', ...Array.from(new Set(menu.map(i => i.category))).sort()];
  
  const filteredMenu = menu.filter(item => {
      const matchesCat = activeCat === 'All' || item.category === activeCat;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDietary = activeDietary.length === 0 || (item.dietaryLabels && activeDietary.every(label => item.dietaryLabels?.includes(label as any)));
      return matchesCat && matchesSearch && matchesDietary;
  });

  // --- Cart Calculations ---
  // Fix type error: explicit accumulator type
  const calculateCartTotal = () => {
      return cart.reduce((acc: number, item) => {
          const modifiersCost = (item.selectedModifiers || []).reduce((sum: number, m) => sum + m.price, 0);
          return acc + ((item.price + modifiersCost) * item.quantity);
      }, 0);
  };

  const subTotal = calculateCartTotal();
  const deliveryFee = orderType === 'delivery' ? appConfig.deliveryFee : 0;
  const tax = subTotal * 0.05;
  const grandTotal = subTotal + tax + deliveryFee;

  // --- Modal Logic ---
  const openItemModal = (item: MenuItem, cartIndex?: number) => {
      setModalItem(item);
      
      if (cartIndex !== undefined && cart[cartIndex]) {
          // Editing mode: Prefill
          const cartItem = cart[cartIndex];
          const selections: Record<string, ModifierOption[]> = {};
          
          // Reconstruct selections map from flattened list
          item.modifierGroups?.forEach(group => {
              const groupOptions = cartItem.selectedModifiers?.filter(m => group.options.some(o => o.id === m.id)) || [];
              if (groupOptions.length > 0) selections[group.id] = groupOptions;
          });

          setModalSelections(selections);
          setModalInstructions(cartItem.specialInstructions || '');
          setModalQuantity(cartItem.quantity);
          setEditingCartIndex(cartIndex);
      } else {
          // New Item
          setModalSelections({});
          setModalInstructions('');
          setModalQuantity(1);
          setEditingCartIndex(null);
      }
  };

  const handleModifierToggle = (group: ModifierGroup, option: ModifierOption) => {
      setModalSelections(prev => {
          const current = prev[group.id] || [];
          const isSelected = current.some(o => o.id === option.id);
          
          if (group.maxSelection === 1) {
              // Radio behavior
              return { ...prev, [group.id]: [option] };
          } else {
              // Checkbox behavior
              if (isSelected) {
                  return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
              } else {
                  if (group.maxSelection && current.length >= group.maxSelection) return prev; // Max limit reached
                  return { ...prev, [group.id]: [...current, option] };
              }
          }
      });
  };

  const addToCart = () => {
      if (!modalItem) return;

      // Validation
      if (modalItem.modifierGroups) {
          for (const group of modalItem.modifierGroups) {
              const selected = modalSelections[group.id] || [];
              if (group.required && selected.length === 0) {
                  alert(`Please select a option for "${group.name}"`);
                  return;
              }
              if (group.minSelection && selected.length < group.minSelection) {
                  alert(`Please select at least ${group.minSelection} options for "${group.name}"`);
                  return;
              }
          }
      }

      // Flatten selections
      const flattenedModifiers: ModifierOption[] = Object.values(modalSelections).flat() as ModifierOption[];

      const newItem: CartItem = {
          ...modalItem,
          quantity: modalQuantity,
          selectedModifiers: flattenedModifiers,
          specialInstructions: modalInstructions
      };

      setCart(prev => {
          if (editingCartIndex !== null) {
              const updated = [...prev];
              updated[editingCartIndex] = newItem;
              return updated;
          }
          return [...prev, newItem];
      });

      setModalItem(null); // Close modal
      setIsCartOpen(true); // Open cart drawer
  };
  
  const removeFromCart = (index: number) => {
      setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- Order Logic ---
  const handlePlaceOrder = async () => {
      if (!customerName || !customerPhone) {
          alert("Please enter your name and phone number.");
          return;
      }
      if (orderType === 'delivery' && !deliveryAddress.trim()) {
          alert("Please enter a delivery address.");
          return;
      }

      setIsProcessing(true);
      const fullPhone = `${customerPhoneCode} ${customerPhone}`;

      const newOrder: Order = {
          id: `ORD-${Date.now().toString().slice(-6)}`,
          customerName,
          phoneNumber: fullPhone,
          items: cart,
          total: Number(grandTotal.toFixed(2)),
          status: 'pending_approval',
          timestamp: new Date().toISOString(),
          type: orderType,
          paymentMethod: paymentMethod,
          paymentStatus: 'pending',
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
          deliveryLocation: { lat: 25.2048, lng: 55.2708 },
          deliveryStatus: 'pending'
      };

      try {
          const savedOrder = await createOrder(newOrder);
          setConfirmedOrder(savedOrder);
          
          // Save to local storage for tracking 'my orders'
          const myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
          localStorage.setItem('my_orders', JSON.stringify([...myOrders, savedOrder.id]));
          
      } catch (error) {
          console.error("Order placement failed", error);
          alert("Failed to place order. Please try again.");
      } finally {
          setIsProcessing(false);
      }
  };
  
  // Render Confirmed State
  if (confirmedOrder) {
      return (
          <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-in zoom-in">
                      <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">{t('chat_order_placed')}</h2>
                  <p className="text-stone-500 mb-6">Order #{confirmedOrder.id} has been received.</p>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => navigate(`/tracking/${confirmedOrder.id}`)}
                        className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition"
                      >
                          {t('chat_track_order')}
                      </button>
                      <button 
                        onClick={() => {
                            setConfirmedOrder(null);
                            setCart([]);
                            setIsCartOpen(false);
                        }}
                        className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-200 transition"
                      >
                          Order More
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32"> {/* Increased padding bottom for sticky footer */}
      {/* 1. Header & Search Bar */}
      <div className="bg-white sticky top-20 z-10 shadow-sm border-b border-stone-100">
          <div className="max-w-6xl mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold text-stone-900 mb-4">{t('menu_title')}</h1>
              <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20}/>
                  <input 
                    type="text" 
                    placeholder={t('menu_search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSearchParams(prev => {
                            prev.set('search', e.target.value);
                            return prev;
                        });
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-200 outline-none transition"
                  />
              </div>
              
              {/* Category Pills */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${
                            activeCat === cat 
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
                        }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* 2. Menu Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenu.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition group h-full flex flex-col">
                      <div className="relative h-48 overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110"/>
                          {!item.available && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">{t('menu_sold_out')}</span>
                              </div>
                          )}
                          <div className="absolute bottom-2 right-2 flex gap-1">
                              {item.dietaryLabels?.map(label => (
                                  <span key={label} className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-stone-800">{label}</span>
                              ))}
                          </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg text-stone-900">{item.name}</h3>
                              <span className="font-bold text-lg text-orange-600">${item.price}</span>
                          </div>
                          <p className="text-stone-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                          
                          <button 
                            onClick={() => openItemModal(item)}
                            disabled={!item.available}
                            className="w-full mt-auto py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 bg-stone-100 text-stone-900 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              <Plus size={16}/> {item.available ? t('cart_add') : 'Unavailable'}
                          </button>
                      </div>
                  </div>
              ))}
          </div>
          
          {filteredMenu.length === 0 && (
              <div className="text-center py-20 text-stone-400">
                  <Utensils size={48} className="mx-auto mb-4 opacity-20"/>
                  <p>{t('menu_no_items')}</p>
              </div>
          )}
      </div>

      {/* 3. Sticky Footer for Cart */}
      {cart.length > 0 && !isCartOpen && (
          <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-white border-t border-stone-200 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:hidden">
              <div className="flex items-center justify-between gap-4">
                  <div onClick={() => setIsCartOpen(true)} className="flex-1 cursor-pointer">
                      <p className="text-xs font-bold text-stone-500 uppercase">{cart.length} Items</p>
                      <p className="text-lg font-black text-stone-900">${grandTotal.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
                  >
                      View Cart <ArrowRight size={16}/>
                  </button>
              </div>
          </div>
      )}
      
      {/* Desktop Floating Action Button (Alternative to sticky footer) */}
       {cart.length > 0 && !isCartOpen && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="hidden md:flex fixed bottom-8 right-8 bg-stone-900 text-white p-4 rounded-full shadow-2xl z-40 hover:scale-105 transition items-center gap-3 pr-6"
          >
              <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-stone-900">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
              </div>
              <span className="font-bold">${grandTotal.toFixed(2)}</span>
          </button>
      )}

      {/* 4. Menu Footer */}
      <footer className="mt-20 border-t border-stone-200 bg-white py-12 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
              {/* Assurance */}
              <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="flex gap-2 text-stone-300">
                      {/* Visual representations of cards */}
                      <div className="w-8 h-5 bg-stone-200 rounded"></div>
                      <div className="w-8 h-5 bg-stone-200 rounded"></div>
                      <div className="w-8 h-5 bg-stone-200 rounded"></div>
                  </div>
                  <p className="text-xs font-bold text-stone-500 flex items-center gap-1">
                      <Lock size={12}/> 100% Secure Checkout
                  </p>
              </div>

              {/* Logistics */}
              <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 text-sm">Logistics</h4>
                  <ul className="text-xs text-stone-500 space-y-1">
                      <li><Link to="/info/location" className="hover:text-orange-600">Check Delivery Area</Link></li>
                      <li><a href="#" className="hover:text-orange-600">Allergy Guide</a></li>
                      <li><Link to="/info/faq" className="hover:text-orange-600">Pickup FAQs</Link></li>
                  </ul>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 text-sm">Need Help?</h4>
                  <div className="flex flex-col gap-2">
                      <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))} className="text-xs font-bold text-blue-600 border border-blue-100 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition">
                          Chat with Us
                      </button>
                      <a href="tel:+971504291207" className="text-xs font-bold text-stone-600 border border-stone-100 bg-stone-50 px-3 py-2 rounded-lg hover:bg-stone-100 transition block text-center">
                          Call Support
                      </a>
                  </div>
              </div>
              
              {/* Legal */}
              <div className="space-y-2">
                   <h4 className="font-bold text-stone-900 text-sm">Legal</h4>
                   <ul className="text-xs text-stone-500 space-y-1">
                       <li><a href="#" className="hover:text-stone-800">Privacy Policy</a></li>
                       <li><a href="#" className="hover:text-stone-800">Terms of Service</a></li>
                       <li>&copy; 2025 Stanley's</li>
                   </ul>
              </div>
          </div>
      </footer>

      {/* 5. Item Customization Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
                <div className="sticky top-0 bg-white z-10 p-4 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{modalItem.name}</h3>
                    <button onClick={() => setModalItem(null)} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200"><X size={20}/></button>
                </div>
                
                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                        <img src={modalItem.imageUrl} className="w-24 h-24 rounded-xl object-cover" alt={modalItem.name}/>
                        <div>
                            <p className="text-stone-500 text-sm mb-2">{modalItem.description}</p>
                            <p className="font-bold text-xl text-orange-600">${modalItem.price}</p>
                        </div>
                    </div>

                    {modalItem.modifierGroups?.map(group => (
                        <div key={group.id} className="mb-6">
                            <div className="flex justify-between mb-2">
                                <h4 className="font-bold text-stone-800">{group.name}</h4>
                                <span className="text-xs font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded">
                                    {group.required ? 'Required' : 'Optional'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {group.options.map(option => {
                                    const isSelected = (modalSelections[group.id] || []).some(o => o.id === option.id);
                                    return (
                                        <div 
                                            key={option.id}
                                            onClick={() => handleModifierToggle(group, option)}
                                            className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${
                                                isSelected 
                                                ? 'border-orange-500 bg-orange-50' 
                                                : 'border-stone-200 hover:border-stone-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    isSelected ? 'border-orange-500' : 'border-stone-300'
                                                }`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'font-bold text-stone-900' : 'text-stone-600'}`}>{option.name}</span>
                                            </div>
                                            {option.price > 0 && <span className="text-sm font-medium text-stone-500">+${option.price}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mb-6">
                         <h4 className="font-bold text-stone-800 mb-2">Special Instructions</h4>
                         <textarea 
                            value={modalInstructions}
                            onChange={(e) => setModalInstructions(e.target.value)}
                            placeholder="Allergies, extra spicy, etc."
                            className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                         />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-stone-100">
                        <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1">
                            <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold hover:bg-stone-50">-</button>
                            <span className="font-bold w-4 text-center">{modalQuantity}</span>
                            <button onClick={() => setModalQuantity(modalQuantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold hover:bg-stone-50">+</button>
                        </div>
                        <button 
                            onClick={addToCart}
                            className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition"
                        >
                            {editingCartIndex !== null ? 'Update Item' : 'Add to Order'} - ${(
                                (modalItem.price + Object.values(modalSelections).flat().reduce((a:any, b:any) => a + b.price, 0)) * modalQuantity
                            ).toFixed(2)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 6. Cart Drawer / Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right flex flex-col">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={20}/> Your Order</h2>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200"><X size={20}/></button>
                </div>
                
                <div className="flex-1 p-6 space-y-6">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="w-16 h-16 rounded-xl bg-stone-100 shrink-0 overflow-hidden">
                                <img src={item.imageUrl} className="w-full h-full object-cover" alt=""/>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                                    <span className="font-bold text-sm text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                    <p className="text-xs text-stone-500 mt-1">{item.selectedModifiers.map(m => m.name).join(', ')}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-xs font-bold bg-stone-50 px-2 py-1 rounded">
                                        <span>Qty: {item.quantity}</span>
                                    </div>
                                    <button onClick={() => openItemModal(item, idx)} className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => removeFromCart(idx)} className="text-stone-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {cart.length === 0 && (
                        <div className="text-center py-20 text-stone-400">Your cart is empty</div>
                    )}

                    <div className="border-t border-stone-100 pt-6 space-y-4">
                        <h3 className="font-bold text-sm text-stone-900">Checkout Details</h3>
                        
                        {/* Order Type */}
                        <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1 rounded-xl">
                            {(['delivery', 'pickup', 'dine-in'] as OrderType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`py-2 rounded-lg text-xs font-bold capitalize transition ${
                                        orderType === type ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        
                        {/* Customer Info */}
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Your Name"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200"
                            />
                            <div className="flex gap-2">
                                <select 
                                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none"
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
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>
                            {orderType === 'delivery' && (
                                <textarea 
                                    placeholder="Delivery Address (Building, Street, Area)"
                                    value={deliveryAddress}
                                    onChange={e => setDeliveryAddress(e.target.value)}
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200 h-24 resize-none"
                                />
                            )}
                        </div>

                         {/* Payment Method */}
                         <div>
                            <h3 className="font-bold text-xs uppercase text-stone-500 mb-2">Payment Method</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'cash', label: 'Cash', icon: Banknote },
                                    { id: 'card', label: 'Card', icon: CreditCard },
                                    { id: 'online_link', label: 'Pay Link', icon: LinkIcon },
                                ].map(pm => (
                                    <button
                                        key={pm.id}
                                        onClick={() => setPaymentMethod(pm.id as any)}
                                        className={`flex flex-col items-center justify-center py-3 rounded-xl border transition ${
                                            paymentMethod === pm.id 
                                            ? 'border-orange-500 bg-orange-50 text-orange-700' 
                                            : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                                        }`}
                                    >
                                        <pm.icon size={18} className="mb-1"/>
                                        <span className="text-xs font-bold">{pm.label}</span>
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>

                <div className="p-6 bg-stone-50 border-t border-stone-200 sticky bottom-0">
                    <div className="space-y-2 mb-4">
                         <div className="flex justify-between text-sm text-stone-500">
                             <span>Subtotal</span>
                             <span>${subTotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-sm text-stone-500">
                             <span>Tax (5%)</span>
                             <span>${tax.toFixed(2)}</span>
                         </div>
                         {orderType === 'delivery' && (
                             <div className="flex justify-between text-sm text-stone-500">
                                 <span>Delivery Fee</span>
                                 <span>${deliveryFee.toFixed(2)}</span>
                             </div>
                         )}
                         <div className="flex justify-between text-xl font-bold text-stone-900 pt-2 border-t border-stone-200">
                             <span>Total</span>
                             <span>${grandTotal.toFixed(2)}</span>
                         </div>
                    </div>
                    
                    <button 
                        onClick={handlePlaceOrder}
                        disabled={isProcessing || cart.length === 0}
                        className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-stone-800 transition disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : t('cart_checkout')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Menu;