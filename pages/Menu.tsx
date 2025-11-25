
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
  
  // Default to 'Lunch'
  const [activeCat, setActiveCat] = useState<string>('Lunch');
  const [activeDietary, setActiveDietary] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  useEffect(() => {
      const catParam = searchParams.get('category');
      if (catParam) {
          setActiveCat(catParam);
      }
  }, [searchParams]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Order Type Logic: Default to 'dine-in'
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online_link'>('cash');
  
  // Configurable Delivery Fee (Initialized from AppConfig)
  const [customDeliveryFee, setCustomDeliveryFee] = useState<number>(10);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneCode, setCustomerPhoneCode] = useState('+971');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Modal State
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalSelections, setModalSelections] = useState<Record<string, ModifierOption[]>>({}); 
  const [modalInstructions, setModalInstructions] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Initialize delivery fee from config
    const config = getAppConfig();
    if (config.deliveryFee) setCustomDeliveryFee(config.deliveryFee);
  }, []);

  const uniqueCategories = ['All', ...Array.from(new Set(menu.map(i => i.category))).sort()];
  
  const filteredMenu = menu.filter(item => {
      const matchesCat = activeCat === 'All' || item.category === activeCat;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDietary = activeDietary.length === 0 || (item.dietaryLabels && activeDietary.every(label => item.dietaryLabels?.includes(label as any)));
      return matchesCat && matchesSearch && matchesDietary;
  });

  const calculateCartTotal = () => {
      return cart.reduce((acc: number, item) => {
          const modifiersCost = (item.selectedModifiers || []).reduce((sum: number, m) => sum + m.price, 0);
          return acc + ((item.price + modifiersCost) * item.quantity);
      }, 0);
  };

  const subTotal = calculateCartTotal();
  // Apply delivery fee only if order type is delivery
  const deliveryFee = orderType === 'delivery' ? customDeliveryFee : 0;
  const tax = subTotal * 0.05;
  const grandTotal = subTotal + tax + deliveryFee;

  const openItemModal = (item: MenuItem, cartIndex?: number) => {
      setModalItem(item);
      
      if (cartIndex !== undefined && cart[cartIndex]) {
          const cartItem = cart[cartIndex];
          const selections: Record<string, ModifierOption[]> = {};
          item.modifierGroups?.forEach(group => {
              const groupOptions = cartItem.selectedModifiers?.filter(m => group.options.some(o => o.id === m.id)) || [];
              if (groupOptions.length > 0) selections[group.id] = groupOptions;
          });
          setModalSelections(selections);
          setModalInstructions(cartItem.specialInstructions || '');
          setModalQuantity(cartItem.quantity);
          setEditingCartIndex(cartIndex);
      } else {
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

  const addToCart = () => {
      if (!modalItem) return;
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

      const flattenedModifiers = Object.values(modalSelections).flat();
      
      const newItem: CartItem = {
          ...modalItem,
          quantity: modalQuantity,
          selectedModifiers: flattenedModifiers,
          specialInstructions: modalInstructions,
          modifiers: flattenedModifiers.map(m => m.name).join(', ') // Legacy string support
      };

      if (editingCartIndex !== null) {
          const newCart = [...cart];
          newCart[editingCartIndex] = newItem;
          setCart(newCart);
      } else {
          setCart([...cart, newItem]);
          setIsCartOpen(true);
      }
      setModalItem(null);
  };

  const removeFromCart = (index: number) => {
      setCart(cart.filter((_, i) => i !== index));
  };

  const handlePlaceOrder = async () => {
      if (cart.length === 0) return;
      if (!customerName || !customerPhone) {
          alert("Please enter your name and phone number.");
          return;
      }
      if (orderType === 'delivery' && !deliveryAddress) {
          alert("Please enter a delivery address.");
          return;
      }

      setIsProcessing(true);
      
      const fullPhone = `${customerPhoneCode}${customerPhone}`;
      
      const newOrder: Order = {
          id: `ORD-${Date.now().toString().slice(-6)}`,
          customerName,
          phoneNumber: fullPhone,
          items: cart,
          total: parseFloat(grandTotal.toFixed(2)),
          status: 'pending_approval',
          timestamp: new Date().toISOString(),
          type: orderType,
          source: 'web_manual',
          paymentMethod,
          paymentStatus: paymentMethod === 'online_link' ? 'pending' : 'paid', // Assume cash/card paid on terminal for demo
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
          deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
          deliveryLocation: { lat: 25.2048, lng: 55.2708 }, // Mock location
          deliveryStatus: orderType === 'delivery' ? 'pending' : undefined
      };

      try {
          await createOrder(newOrder);
          // Save to local storage for "My Orders" tracking
          const myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
          localStorage.setItem('my_orders', JSON.stringify([...myOrders, newOrder.id]));
          
          setConfirmedOrder(newOrder);
          setCart([]);
      } catch (e) {
          alert("Failed to place order. Please try again.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleWhatsAppOrder = () => {
      if (cart.length === 0) return;
      const dummyOrder: Order = {
          id: 'DRAFT',
          customerName: customerName || 'Guest',
          phoneNumber: '',
          items: cart,
          total: grandTotal,
          status: 'pending_approval',
          timestamp: new Date().toISOString(),
          type: orderType,
          source: 'whatsapp',
          paymentMethod: 'cash',
          paymentStatus: 'pending'
      };
      const link = generateWhatsAppOrderMessage(dummyOrder);
      window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-20 pb-20">
      
      {/* 1. Header & Categories */}
      <div className="sticky top-16 z-30 bg-white border-b border-stone-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                      <Utensils className="text-orange-500"/> {t('menu_title')}
                  </h1>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18}/>
                      <input 
                        type="text" 
                        placeholder={t('menu_search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-stone-100 border-none rounded-xl focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                      />
                  </div>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            activeCat === cat 
                            ? 'bg-stone-900 text-white shadow-lg' 
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. Menu Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
              {filteredMenu.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-stone-400">
                      <p>{t('menu_no_items')}</p>
                  </div>
              ) : (
                  filteredMenu.map(item => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition flex flex-col group">
                          <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              {!item.available && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{t('menu_sold_out')}</span>
                                  </div>
                              )}
                              {item.dietaryLabels && (
                                  <div className="absolute top-2 left-2 flex gap-1">
                                      {item.dietaryLabels.map(label => (
                                          <span key={label} className="bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded text-stone-800 shadow-sm">{label}</span>
                                      ))}
                                  </div>
                              )}
                          </div>
                          
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h3 className="font-bold text-lg text-stone-900 leading-tight mb-1">{item.name}</h3>
                                  <p className="text-sm text-stone-500 line-clamp-2 h-10">{item.description}</p>
                              </div>
                              <span className="text-lg font-bold text-stone-900">${item.price}</span>
                          </div>

                          <div className="mt-auto pt-4 flex gap-2">
                              <button 
                                onClick={() => openItemModal(item)}
                                disabled={!item.available}
                                className="flex-1 bg-stone-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                              >
                                  <Plus size={16}/> {t('menu_order')}
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {/* 3. Cart Sidebar (Desktop) */}
          <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:w-auto lg:shadow-none lg:bg-transparent lg:z-auto ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
              <div className="h-full flex flex-col bg-white lg:rounded-2xl lg:shadow-xl lg:border lg:border-stone-200 lg:h-[calc(100vh-140px)] lg:sticky lg:top-28">
                  
                  {/* Cart Header */}
                  <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50 lg:rounded-t-2xl">
                      <h2 className="font-bold text-lg flex items-center gap-2">
                          <ShoppingBag className="text-orange-500"/> {t('cart_title')}
                      </h2>
                      <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 hover:bg-stone-200 rounded-full">
                          <X size={20}/>
                      </button>
                      <span className="bg-stone-200 text-stone-600 px-2 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {confirmedOrder ? (
                          <div className="text-center py-10 animate-in zoom-in">
                              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <CheckCircle size={32}/>
                              </div>
                              <h3 className="font-bold text-xl mb-2">{t('chat_order_placed')}</h3>
                              <p className="text-stone-500 text-sm mb-6">Order #{confirmedOrder.id} has been received.</p>
                              <div className="space-y-3">
                                  <button onClick={() => navigate(`/tracking/${confirmedOrder.id}`)} className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg">
                                      Track Order
                                  </button>
                                  <button onClick={() => {setConfirmedOrder(null); setOrderType('dine-in');}} className="w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-bold text-sm">
                                      Start New Order
                                  </button>
                              </div>
                          </div>
                      ) : cart.length === 0 ? (
                          <div className="text-center py-10 text-stone-400">
                              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20"/>
                              <p>{t('cart_empty')}</p>
                          </div>
                      ) : (
                          cart.map((item, idx) => (
                              <div key={idx} className="flex gap-3 relative group">
                                  <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                                      <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name}/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                          <h4 className="font-bold text-sm text-stone-900 truncate">{item.name}</h4>
                                          <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                      <p className="text-xs text-stone-500">{item.quantity}x @ ${item.price}</p>
                                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                          <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                                              {item.selectedModifiers.map(m => m.name).join(', ')}
                                          </p>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                          <button onClick={() => openItemModal(item, idx)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100">Edit</button>
                                          <button onClick={() => removeFromCart(idx)} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded hover:bg-red-100">Remove</button>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  {/* Cart Footer */}
                  {!confirmedOrder && cart.length > 0 && (
                      <div className="p-5 border-t border-stone-100 bg-stone-50 lg:rounded-b-2xl">
                          {/* ORDER TYPE SELECTOR */}
                          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-stone-200 mb-4">
                              {(['dine-in', 'pickup', 'delivery'] as const).map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                                        orderType === type 
                                        ? 'bg-stone-900 text-white shadow-md' 
                                        : 'text-stone-500 hover:bg-stone-50'
                                    }`}
                                  >
                                      {type === 'dine-in' ? 'Dine In' : type}
                                  </button>
                              ))}
                          </div>

                          <div className="space-y-2 mb-4 text-sm">
                              <div className="flex justify-between text-stone-500">
                                  <span>Subtotal</span>
                                  <span>${subTotal.toFixed(2)}</span>
                              </div>
                              {/* Delivery Fee Display */}
                              {orderType === 'delivery' && (
                                  <div className="flex justify-between text-stone-500">
                                      <span>Delivery Fee</span>
                                      <span>${deliveryFee.toFixed(2)}</span>
                                  </div>
                              )}
                              <div className="flex justify-between text-stone-500">
                                  <span>Tax (5%)</span>
                                  <span>${tax.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-200">
                                  <span>Total</span>
                                  <span>${grandTotal.toFixed(2)}</span>
                              </div>
                          </div>

                          <div className="space-y-3">
                              <input 
                                type="text" 
                                placeholder="Your Name" 
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-500"
                              />
                              <div className="flex gap-2">
                                  <select 
                                    value={customerPhoneCode} 
                                    onChange={(e) => setCustomerPhoneCode(e.target.value)}
                                    className="p-3 rounded-xl border border-stone-200 text-sm bg-white"
                                  >
                                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                  </select>
                                  <input 
                                    type="tel" 
                                    placeholder="Phone Number" 
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="flex-1 p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-500"
                                  />
                              </div>

                              {/* Conditional Delivery Address */}
                              {orderType === 'delivery' && (
                                  <div className="animate-in fade-in slide-in-from-top-2">
                                      <input 
                                          type="text" 
                                          placeholder="Delivery Address" 
                                          value={deliveryAddress}
                                          onChange={(e) => setDeliveryAddress(e.target.value)}
                                          className="w-full p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-500"
                                      />
                                  </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className="bg-stone-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition shadow-lg flex items-center justify-center gap-2"
                                  >
                                      {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CreditCard size={16}/>} Pay Now
                                  </button>
                                  <button 
                                    onClick={handleWhatsAppOrder}
                                    className="bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#20b858] transition shadow-lg flex items-center justify-center gap-2"
                                  >
                                      <MessageCircle size={16}/> WhatsApp
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Floating Cart Button (Mobile) */}
      {!isCartOpen && cart.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-24 right-6 lg:hidden z-40 bg-stone-900 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce-slow"
          >
              <ShoppingBag size={24}/>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-stone-900">{cart.length}</span>
          </button>
      )}

      {/* Item Modifier Modal */}
      {modalItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                  <div className="relative h-48 shrink-0">
                      <img src={modalItem.imageUrl} className="w-full h-full object-cover" alt={modalItem.name}/>
                      <button onClick={() => setModalItem(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition">
                          <X size={20}/>
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                          <h3 className="text-2xl font-bold text-white leading-tight">{modalItem.name}</h3>
                          <p className="text-white/80 text-sm mt-1">{modalItem.description}</p>
                      </div>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      <div className="flex justify-between items-center mb-6">
                          <span className="text-2xl font-bold text-stone-900">${modalItem.price}</span>
                          <div className="flex items-center gap-4 bg-stone-100 rounded-xl p-1">
                              <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="p-2 hover:bg-white rounded-lg shadow-sm transition"><Minus size={16}/></button>
                              <span className="font-bold text-stone-900 w-4 text-center">{modalQuantity}</span>
                              <button onClick={() => setModalQuantity(modalQuantity + 1)} className="p-2 hover:bg-white rounded-lg shadow-sm transition"><Plus size={16}/></button>
                          </div>
                      </div>

                      {modalItem.modifierGroups?.map(group => (
                          <div key={group.id} className="mb-6">
                              <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-bold text-stone-800">{group.name}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${group.required ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                                      {group.required ? 'Required' : 'Optional'}
                                  </span>
                              </div>
                              <div className="space-y-2">
                                  {group.options.map(option => {
                                      const isSelected = (modalSelections[group.id] || []).some(o => o.id === option.id);
                                      return (
                                          <button
                                            key={option.id}
                                            onClick={() => handleModifierToggle(group, option)}
                                            className={`w-full flex justify-between items-center p-3 rounded-xl border text-sm transition-all ${
                                                isSelected 
                                                ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                            }`}
                                          >
                                              <span>{option.name}</span>
                                              {option.price > 0 && <span>+${option.price}</span>}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}

                      <div>
                          <label className="block font-bold text-stone-800 text-sm mb-2">Special Instructions</label>
                          <textarea 
                            value={modalInstructions}
                            onChange={(e) => setModalInstructions(e.target.value)}
                            placeholder="e.g. Allergy to peanuts, sauce on side..."
                            className="w-full p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-stone-900 min-h-[80px]"
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-stone-100 bg-stone-50">
                      <button 
                        onClick={addToCart}
                        className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition flex items-center justify-center gap-2"
                      >
                          <ShoppingBag size={20}/>
                          {editingCartIndex !== null ? 'Update Item' : 'Add to Order'} - ${(
                              (modalItem.price + Object.values(modalSelections).flat().reduce((acc, m) => acc + m.price, 0)) * modalQuantity
                          ).toFixed(2)}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Menu;
