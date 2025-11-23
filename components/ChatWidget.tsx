
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, ChefHat, ShoppingBag, X, User, MessageCircle, MapPin, Phone, CreditCard, CheckCircle, Check, HelpCircle, ExternalLink } from 'lucide-react';
import { MenuItem, ChatMessage, Order } from '../types';
import { initChatSession, sendMessageToBot, parseOrderFromChat } from '../services/gemini';
import { createOrder, generateWhatsAppLinkWithContext } from '../services/menuRepository';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface ChatWidgetProps {
  menu: MenuItem[];
}

interface DetectedOrder {
    items: {name: string, quantity: number, price: number, id: string}[];
    total: number;
    customerName: string | null;
    deliveryAddress: string | null;
    phoneNumber: string | null;
    paymentMethod: 'cash' | 'card' | 'online_link' | null;
}

const QuickActionPill: React.FC<{icon: any, label: string, onClick: () => void}> = ({icon: Icon, label, onClick}) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-1.5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-orange-200 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm whitespace-nowrap"
    >
        <Icon size={12} className="text-orange-500"/> {label}
    </button>
);

const ChatWidget: React.FC<ChatWidgetProps> = ({ menu }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  
  // User State
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  
  // Chat State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Order Detection State
  const [detectedOrder, setDetectedOrder] = useState<DetectedOrder | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Initialize AI when menu loads
  useEffect(() => {
    if (menu.length > 0) {
      initChatSession(menu);
    }
  }, [menu]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isNameSet, detectedOrder, orderPlaced]);

  // Welcome Message on first open
  useEffect(() => {
    if (isOpen && !hasOpened && messages.length === 0) {
       setHasOpened(true);
       setIsTyping(true);
       setTimeout(() => {
         setMessages([{
            id: 'welcome',
            sender: 'bot',
            text: "👋 Hi there! I'm Stanley, your AI waiter. I can take your order right here. What's your name?",
            timestamp: new Date()
          }]);
          setIsTyping(false);
       }, 1000);
    }
  }, [isOpen, hasOpened, messages.length]);

  const handleNameSubmit = () => {
    if (!userName.trim()) return;
    setIsNameSet(true);
    setMessages(prev => [...prev, {
        id: 'name-response',
        sender: 'user',
        text: `My name is ${userName}`,
        timestamp: new Date()
    }, {
        id: 'bot-greeting',
        sender: 'bot',
        text: `Nice to meet you, ${userName}! What would you like to order today?`,
        timestamp: new Date()
    }]);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    try {
      // 1. Get Text Response
      const responseText = await sendMessageToBot(userMsg.text);
      
      // 2. Check for Order Intent in background
      const conversation = messages.concat(userMsg).map(m => `${m.sender}: ${m.text}`).join('\n');
      parseOrderFromChat(conversation, menu).then((orderData: any) => {
           if (orderData && orderData.items && orderData.items.length > 0) {
                const total = orderData.items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
                setDetectedOrder({ 
                    items: orderData.items, 
                    total,
                    customerName: orderData.customerName || userName || null,
                    deliveryAddress: orderData.deliveryAddress || null,
                    phoneNumber: orderData.phoneNumber || null,
                    paymentMethod: orderData.paymentMethod || null
                });
           }
      }).catch(e => console.log("Parsing failed", e));

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "I'm having trouble connecting to the kitchen right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!detectedOrder) return;
    setPlacingOrder(true);

    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: detectedOrder.customerName || userName,
        phoneNumber: detectedOrder.phoneNumber || '',
        items: detectedOrder.items.map((i: any) => ({...i, id: i.id, available: true, description: '', imageUrl: '', category: ''})), // Simplified cast
        total: detectedOrder.total,
        status: 'pending_approval',
        timestamp: new Date().toISOString(),
        type: 'delivery',
        source: 'web_chat',
        paymentMethod: detectedOrder.paymentMethod || 'cash',
        paymentStatus: detectedOrder.paymentMethod === 'online_link' ? 'pending' : 'pending',
        deliveryAddress: detectedOrder.deliveryAddress || '',
        deliveryLocation: { lat: 25.2048, lng: 55.2708 }
    };

    try {
        await createOrder(newOrder);
        
        // Track my order for notifications
        const myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
        localStorage.setItem('my_orders', JSON.stringify([...myOrders, newOrder.id]));

        setOrderPlaced(newOrder.id);
        setDetectedOrder(null); // Clear detection
        
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            text: `✅ Order #${newOrder.id} Placed! I've sent it to the kitchen for approval. You'll be notified once it's on the way.`,
            timestamp: new Date()
        }]);

    } catch (e) {
        console.error(e);
        alert("Failed to place order.");
    } finally {
        setPlacingOrder(false);
    }
  };

  // --- WhatsApp Switch Logic ---
  const handleSwitchToWhatsApp = () => {
      // Get context to pass
      const lastBotMessage = messages.filter(m => m.sender === 'bot').pop()?.text;
      const draftOrderData = detectedOrder ? { 
          items: detectedOrder.items, 
          customerName: detectedOrder.customerName || userName,
          total: detectedOrder.total
      } : undefined;
      
      const url = generateWhatsAppLinkWithContext(lastBotMessage, draftOrderData);
      window.open(url, '_blank');
  };

  const isOrderReady = detectedOrder && 
                       detectedOrder.items.length > 0 && 
                       detectedOrder.deliveryAddress && 
                       detectedOrder.phoneNumber && 
                       detectedOrder.paymentMethod;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform hover:scale-105 ${isOpen ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <div className="relative group">
           <div className="absolute inset-0 bg-orange-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
           <div className="relative bg-stone-900 text-white p-4 pr-6 rounded-full shadow-2xl border border-stone-700 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2.5 rounded-full shadow-lg">
                <ChefHat size={22} className="text-white" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-sm leading-none">AI Assistant</span>
                <span className="text-[10px] text-stone-400 font-medium mt-0.5">Order & Chat</span>
              </div>
           </div>
           {!hasOpened && (
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-stone-900 animate-bounce"></span>
           )}
        </div>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-4 md:right-6 w-[90vw] md:w-[380px] h-[600px] max-h-[80vh] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl z-50 flex flex-col overflow-hidden border border-stone-200/50 transition-all duration-500 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}
      >
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5 flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500 via-transparent to-transparent"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                <ChefHat size={24} className="text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">Stanley's AI</h3>
                <p className="text-[11px] text-stone-300 flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"/> Online | Orders Active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
                <button 
                    onClick={handleSwitchToWhatsApp}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                    title="Continue on WhatsApp"
                >
                    <MessageCircle size={20} className="text-green-400 group-hover:scale-110 transition-transform" />
                </button>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-stone-400 hover:text-white" />
                </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-stone-50/50 custom-scrollbar scroll-smooth">
              <div className="text-center mb-6 mt-2">
                 <span className="bg-stone-200/60 text-stone-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Today</span>
              </div>
              
              {messages.map((msg) => (
              <div
                  key={msg.id}
                  className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mr-2 mt-1 border border-white shadow-sm">
                        <ChefHat size={14} className="text-stone-600"/>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed relative shadow-sm ${
                    msg.sender === 'user'
                        ? 'bg-orange-500 text-white rounded-tr-sm'
                        : 'bg-white text-stone-800 border border-stone-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
              </div>
              ))}

              {isTyping && (
              <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mr-2 border border-white shadow-sm">
                        <Sparkles size={14} className="text-stone-600 animate-pulse"/>
                  </div>
                  <div className="bg-white border border-stone-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center h-12">
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
              </div>
              )}

              {/* Detected Order Card */}
              {detectedOrder && !isTyping && !orderPlaced && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 mb-4">
                      <div className="bg-white p-0 rounded-2xl border border-stone-200 shadow-lg mx-2 overflow-hidden">
                          <div className="bg-stone-900 p-3 flex items-center gap-2">
                              <ShoppingBag size={16} className="text-orange-400"/>
                              <span className="font-bold text-white text-sm">Draft Order</span>
                          </div>
                          
                          <div className="p-4 space-y-3">
                              {/* Items */}
                              <ul className="space-y-2 border-b border-stone-100 pb-3">
                                  {detectedOrder.items.map((item, i) => (
                                      <li key={i} className="flex justify-between text-xs">
                                          <span className="text-stone-700 font-medium"><span className="text-orange-600 font-bold">{item.quantity}x</span> {item.name}</span>
                                          <span className="font-bold text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                                      </li>
                                  ))}
                              </ul>

                              {/* Details Check */}
                              <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2">
                                      <MapPin size={14} className={detectedOrder.deliveryAddress ? "text-green-500" : "text-stone-300"} />
                                      <span className={detectedOrder.deliveryAddress ? "text-stone-800" : "text-stone-400 italic"}>
                                          {detectedOrder.deliveryAddress || "Address missing..."}
                                      </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Phone size={14} className={detectedOrder.phoneNumber ? "text-green-500" : "text-stone-300"} />
                                      <span className={detectedOrder.phoneNumber ? "text-stone-800" : "text-stone-400 italic"}>
                                          {detectedOrder.phoneNumber || "Phone missing..."}
                                      </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <CreditCard size={14} className={detectedOrder.paymentMethod ? "text-green-500" : "text-stone-300"} />
                                      <span className={detectedOrder.paymentMethod ? "text-stone-800 uppercase" : "text-stone-400 italic"}>
                                          {detectedOrder.paymentMethod ? detectedOrder.paymentMethod.replace('_', ' ') : "Payment method..."}
                                      </span>
                                  </div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                                  <span className="text-xs font-bold text-stone-500">Total</span>
                                  <span className="text-lg font-bold text-orange-600">${detectedOrder.total.toFixed(2)}</span>
                              </div>

                              {isOrderReady ? (
                                <div className="space-y-2">
                                    <button 
                                        onClick={handlePlaceOrder}
                                        disabled={placingOrder}
                                        className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition"
                                    >
                                        {placingOrder ? "Sending..." : <><CheckCircle size={16}/> Confirm on Website</>}
                                    </button>
                                    <button 
                                        onClick={handleSwitchToWhatsApp}
                                        className="w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"
                                    >
                                        <MessageCircle size={16}/> Finalize on WhatsApp
                                    </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-center text-stone-400 italic bg-stone-50 py-2 rounded-lg">
                                    Bot is collecting details...
                                </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
              
              {orderPlaced && (
                 <div className="text-center my-4 animate-in zoom-in">
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            navigate(`/tracking/${orderPlaced}`);
                        }}
                        className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-stone-800 transition"
                    >
                        Track Order #{orderPlaced}
                    </button>
                 </div>
              )}

              <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-stone-100">
              {!isNameSet ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <label className="block text-xs font-bold text-stone-500 mb-2 ml-1 uppercase tracking-wider">Please enter your name to chat</label>
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                            <User size={16} className="absolute left-3 top-3 text-stone-400" />
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                placeholder="Your Name"
                                className="w-full bg-stone-100 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <button 
                            onClick={handleNameSubmit}
                            disabled={!userName.trim()}
                            className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-orange-600 transition shadow-md"
                        >
                            Start
                        </button>
                     </div>
                  </div>
              ) : (
                  <div className="animate-in fade-in">
                    {/* Quick Actions */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-1 scrollbar-hide">
                        <QuickActionPill icon={ShoppingBag} label="View Menu" onClick={() => {setIsOpen(false); navigate('/menu');}}/>
                        <QuickActionPill icon={MapPin} label="Track Order" onClick={() => handleSend("I want to track my order")} />
                        <QuickActionPill icon={ExternalLink} label="Open in WhatsApp" onClick={handleSwitchToWhatsApp} />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-stone-100 p-2 pl-4 rounded-full transition-all focus-within:ring-2 focus-within:ring-orange-100 focus-within:bg-white focus-within:shadow-md border border-transparent focus-within:border-orange-200">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={orderPlaced ? "Order placed! Anything else?" : "Type your order..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-stone-800 placeholder:text-stone-400"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="bg-stone-900 text-white w-10 h-10 rounded-full hover:bg-orange-600 transition disabled:opacity-50 disabled:hover:bg-stone-900 shadow-md flex items-center justify-center"
                        >
                            <Send size={16} className={input.trim() ? "ml-0.5" : ""} />
                        </button>
                    </div>
                  </div>
              )}
              <div className="text-center mt-3">
                  <p className="text-[10px] text-stone-400 font-medium flex items-center justify-center gap-1">
                    Powered by <span className="text-stone-600 font-bold">Gemini</span> • Artificial Intelligence
                  </p>
              </div>
          </div>
      </div>
    </>
  );
};

export default ChatWidget;
