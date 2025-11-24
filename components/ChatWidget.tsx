
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, ChefHat, ShoppingBag, X, User, MessageCircle, MapPin, Phone, CreditCard, CheckCircle, Check, HelpCircle, ExternalLink, Smartphone, Lock, Loader2, ArrowLeft, MoreVertical, CheckCheck } from 'lucide-react';
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
        className="flex items-center gap-1.5 bg-white border border-[#e9edef] hover:bg-[#f0f2f5] px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm whitespace-nowrap text-[#54656f]"
    >
        <Icon size={14} className="text-[#00a884]"/> {label}
    </button>
);

const ChatWidget: React.FC<ChatWidgetProps> = ({ menu }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  
  // --- Verification State ---
  const [verificationStep, setVerificationStep] = useState<'details' | 'otp' | 'verified'>('details');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState(''); // New State for Address
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  
  // --- Chat State ---
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Order Logic State ---
  const [detectedOrder, setDetectedOrder] = useState<DetectedOrder | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Initialize AI when menu loads
  useEffect(() => {
    if (menu.length > 0) {
      initChatSession(menu);
    }
  }, [menu]);

  // Listen for external open events
  useEffect(() => {
    const handleOpen = () => {
        setIsOpen(true);
        if (!hasOpened) setHasOpened(true);
    };
    window.addEventListener('open-chat-widget', handleOpen);
    return () => window.removeEventListener('open-chat-widget', handleOpen);
  }, [hasOpened]);

  // Auto-scroll logic
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, verificationStep, detectedOrder, orderPlaced]);

  // --- CORE LOGIC: Input Handling & Decision Tree ---
  const handleSend = async (overrideText?: string) => {
    // 1. INPUT HANDLING
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    // Optimistic UI Update
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    // 2. PROCESSING & ERROR HANDLING
    try {
      // Parallel Execution: Get conversational response AND check for order intent
      const [responseText] = await Promise.all([
         sendMessageToBot(userMsg.text),
         checkOrderIntent(userMsg)
      ]);

      // 3. OUTPUT GENERATION
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      // 4. ERROR RECOVERY
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "I'm having trouble connecting to the DR right now. Please try again or use WhatsApp.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- DECISION TREE: Order Intent Recognition ---
  const checkOrderIntent = async (lastUserMsg: ChatMessage) => {
     try {
        const conversation = messages.concat(lastUserMsg).map(m => `${m.sender}: ${m.text}`).join('\n');
        
        // AI Call to parse structure
        const orderData: any = await parseOrderFromChat(conversation, menu);

        // DECISION NODE: Does the data look like a valid order?
        if (orderData && orderData.items && orderData.items.length > 0) {
            const total = orderData.items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
            
            // Logic: Merge detected data with verified user data
            setDetectedOrder({ 
                items: orderData.items, 
                total,
                customerName: orderData.customerName || userName || null,
                deliveryAddress: orderData.deliveryAddress || userAddress || null, // Use captured address
                phoneNumber: userPhone || orderData.phoneNumber || null, // Prefer verified phone
                paymentMethod: orderData.paymentMethod || null
            });
        }
     } catch (e) {
         console.warn("Intent detection failed silently:", e);
     }
  };

  // --- VERIFICATION WORKFLOW ---

  const handleSendOtp = async () => {
      if (!userName.trim() || !userPhone.trim() || !userAddress.trim()) {
          setVerificationError("Please enter all details (Name, Phone, Address).");
          return;
      }
      setVerificationError('');
      setIsVerifying(true);
      
      // Simulate API Network Delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsVerifying(false);
      setVerificationStep('otp');
      // In a real app, this triggers SMS API.
  };

  const handleVerifyOtp = async () => {
      if (otpInput !== '123456') {
          setVerificationError("Invalid Code. Try 123456.");
          return;
      }
      setVerificationError('');
      setIsVerifying(true);

      // Simulate Verification Delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsVerifying(false);
      setVerificationStep('verified');
      
      // Initialize Chat Welcome
      setMessages([{
        id: 'welcome',
        sender: 'bot',
        text: `👋 Hi ${userName}! I see you're at ${userAddress}. Check out the menu below or just tell me what you're craving! 🍔🥗`,
        timestamp: new Date()
      }]);
  };

  const handlePlaceOrder = async () => {
    if (!detectedOrder) return;
    setPlacingOrder(true);

    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: detectedOrder.customerName || userName,
        phoneNumber: userPhone, // Use verified phone
        items: detectedOrder.items.map((i: any) => ({...i, id: i.id, available: true, description: '', imageUrl: '', category: ''})),
        total: detectedOrder.total,
        status: 'pending_approval',
        timestamp: new Date().toISOString(),
        type: 'delivery',
        source: 'web_chat',
        paymentMethod: detectedOrder.paymentMethod || 'cash',
        paymentStatus: 'pending',
        deliveryAddress: detectedOrder.deliveryAddress || userAddress, // Use detected or initial address
        deliveryLocation: { lat: 25.2048, lng: 55.2708 }
    };

    try {
        await createOrder(newOrder);
        const myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
        localStorage.setItem('my_orders', JSON.stringify([...myOrders, newOrder.id]));

        setOrderPlaced(newOrder.id);
        setDetectedOrder(null);
        
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            text: `✅ ${t('chat_order_placed')} Waiting for admin approval. You will be notified here shortly.`,
            timestamp: new Date()
        }]);

    } catch (e) {
        console.error(e);
        alert("Failed to place order.");
    } finally {
        setPlacingOrder(false);
    }
  };

  const handleSwitchToWhatsApp = () => {
      const lastBotMessage = messages.filter(m => m.sender === 'bot').pop()?.text;
      const draftOrderData = detectedOrder ? { 
          items: detectedOrder.items, 
          customerName: userName,
          total: detectedOrder.total
      } : undefined;
      
      const url = generateWhatsAppLinkWithContext(lastBotMessage, draftOrderData);
      window.open(url, '_blank');
  };

  // We consider order ready if we have items and payment. Address is now pre-filled via userAddress
  const isOrderReady = detectedOrder && 
                       detectedOrder.items.length > 0 && 
                       detectedOrder.paymentMethod;

  return (
    <>
      {/* 
        REMOVED FLOATING BUTTON AS PER REQUEST 
        Trigger logic is now handled solely by top bar via 'open-chat-widget' event.
      */}

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-4 md:right-6 w-[90vw] md:w-[380px] h-[600px] max-h-[85vh] bg-[#efeae2] rounded-[1.5rem] shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}
        style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}
      >
          {/* WhatsApp Header */}
          <div className="bg-[#008069] text-white p-3 flex items-center justify-between shrink-0 shadow-md z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsOpen(false)} className="md:hidden"><ArrowLeft size={20}/></button>
              <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <ChefHat size={20} className="text-[#008069]" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#008069] rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-base leading-tight">{t('chat_header')}</h3>
                <p className="text-[11px] text-green-100">{t('chat_reply_time')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleSwitchToWhatsApp} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Open in WhatsApp"
                >
                    <ExternalLink size={20} className="text-white" />
                </button>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-white" />
                </button>
            </div>
          </div>

          {/* VERIFICATION STEP 1: DETAILS */}
          {verificationStep === 'details' && (
              <div className="flex-1 p-6 flex flex-col justify-center bg-white overflow-y-auto">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center mx-auto mb-3">
                          <MessageCircle size={32} className="text-white fill-white"/>
                      </div>
                      <h3 className="text-xl font-bold text-stone-800">{t('chat_start_order')}</h3>
                      <p className="text-sm text-stone-500">{t('chat_enter_details')}</p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-3">
                      <div>
                          <label className="text-[10px] font-bold text-[#008069] uppercase ml-1 block mb-1">{t('chat_label_name')}</label>
                          <div className="relative">
                              <User size={16} className="absolute left-3 top-3 text-stone-400"/>
                              <input 
                                  type="text" 
                                  value={userName} 
                                  onChange={e => setUserName(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#25D366] outline-none text-sm"
                                  placeholder="John Doe"
                                  required
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-[#008069] uppercase ml-1 block mb-1">{t('chat_label_phone')}</label>
                          <div className="relative">
                              <Phone size={16} className="absolute left-3 top-3 text-stone-400"/>
                              <input 
                                  type="tel" 
                                  value={userPhone} 
                                  onChange={e => setUserPhone(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#25D366] outline-none text-sm"
                                  placeholder="+971 50..."
                                  required
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-[#008069] uppercase ml-1 block mb-1">{t('chat_label_address')}</label>
                          <div className="relative">
                              <MapPin size={16} className="absolute left-3 top-3 text-stone-400"/>
                              <textarea 
                                  value={userAddress} 
                                  onChange={e => setUserAddress(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#25D366] outline-none text-sm min-h-[80px] resize-none"
                                  placeholder="Building, Street, Area..."
                                  required
                              />
                          </div>
                      </div>

                      {verificationError && <p className="text-xs text-red-500 font-bold text-center">{verificationError}</p>}

                      <button 
                          type="submit"
                          disabled={isVerifying}
                          className="w-full bg-[#008069] text-white py-3 rounded-full font-bold hover:bg-[#006d59] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                      >
                          {isVerifying ? <Loader2 className="animate-spin" size={18}/> : t('chat_btn_verify')}
                      </button>
                  </form>
              </div>
          )}

          {/* VERIFICATION STEP 2: OTP */}
          {verificationStep === 'otp' && (
              <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                  <button onClick={() => setVerificationStep('details')} className="absolute top-20 left-4 text-stone-400 hover:text-stone-800">
                      <ArrowLeft size={20}/>
                  </button>

                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#008069]">
                          <Lock size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-stone-800">{t('chat_verify_title')}</h3>
                      <p className="text-sm text-stone-500 mt-1">{t('chat_verify_desc')} {userPhone}</p>
                      <p className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mt-2">Mock Code: 123456</p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-6">
                      <input 
                          type="text" 
                          maxLength={6}
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value)}
                          className="w-full py-3 text-center text-3xl tracking-[0.5em] font-bold border-b-2 border-stone-300 focus:border-[#008069] outline-none bg-transparent text-stone-800"
                          placeholder="000000"
                          autoFocus
                      />

                      {verificationError && <p className="text-xs text-red-500 font-bold text-center">{verificationError}</p>}

                      <button 
                          type="submit"
                          disabled={isVerifying}
                          className="w-full bg-[#008069] text-white py-3 rounded-full font-bold hover:bg-[#006d59] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                          {isVerifying ? <Loader2 className="animate-spin"/> : t('chat_btn_verify_confirm')}
                      </button>
                  </form>
              </div>
          )}

          {/* VERIFIED: CHAT INTERFACE */}
          {verificationStep === 'verified' && (
              <>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar scroll-smooth relative">
                    {/* Date Divider */}
                    <div className="flex justify-center mb-4">
                        <span className="bg-[#e4eaf1] text-[#54656f] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium uppercase">Today</span>
                    </div>

                    {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                        className={`max-w-[85%] p-2 px-3 rounded-lg text-sm leading-relaxed relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${
                        msg.sender === 'user'
                            ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                            : 'bg-white text-[#111b21] rounded-tl-none'
                        }`}
                        >
                        {msg.text}
                        <div className="flex justify-end items-center gap-1 mt-1 select-none">
                            <span className="text-[10px] text-[#667781] min-w-fit">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {msg.sender === 'user' && <CheckCheck size={14} className="text-[#53bdeb]" />}
                        </div>
                        
                        {/* Little Triangle Tail */}
                        <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent ${
                             msg.sender === 'user' 
                             ? 'right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]' 
                             : 'left-[-6px] border-t-white border-r-white'
                        }`}></div>

                        </div>
                    </div>
                    ))}

                    {isTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm flex gap-1 items-center">
                            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    )}

                    {/* Detected Order Card */}
                    {detectedOrder && !isTyping && !orderPlaced && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 mb-4 mx-2">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-[#008069]">
                                <div className="bg-[#f0f2f5] p-2 flex items-center justify-between border-b border-[#e9edef]">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag size={14} className="text-[#008069]"/>
                                        <span className="font-bold text-xs text-[#54656f]">{t('chat_draft_order')}</span>
                                    </div>
                                    <span className="text-xs font-bold text-[#008069]">${detectedOrder.total.toFixed(2)}</span>
                                </div>
                                
                                <div className="p-3 space-y-2">
                                    <ul className="space-y-1">
                                        {detectedOrder.items.map((item, i) => (
                                            <li key={i} className="flex justify-between text-xs text-[#111b21]">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="bg-[#f0f2f5] p-2 rounded text-[10px] space-y-1 text-[#54656f]">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={10}/> {detectedOrder.deliveryAddress || userAddress || <span className="text-red-500 italic">Address required</span>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CreditCard size={10}/> {detectedOrder.paymentMethod || <span className="text-red-500 italic">Payment required</span>}
                                        </div>
                                    </div>

                                    {isOrderReady ? (
                                        <button 
                                            onClick={handlePlaceOrder}
                                            disabled={placingOrder}
                                            className="w-full bg-[#008069] hover:bg-[#006d59] text-white py-2 rounded shadow-sm text-xs font-bold flex items-center justify-center gap-2"
                                        >
                                            {placingOrder ? <Loader2 className="animate-spin" size={12}/> : <Check size={14}/>} {t('chat_draft_submit')}
                                        </button>
                                    ) : (
                                        <p className="text-[10px] text-center text-red-500 italic">Please provide payment method.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {orderPlaced && (
                        <div className="flex flex-col items-center justify-center my-4 animate-in zoom-in gap-2">
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-xs font-bold text-center">
                                {t('chat_order_placed')} waiting for Admin Approval.
                            </div>
                            <button 
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate(`/tracking/${orderPlaced}`);
                                }}
                                className="bg-[#e9edef] text-[#008069] px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-[#d1d7db] transition border border-[#d1d7db]"
                            >
                                {t('chat_track_order')} #{orderPlaced}
                            </button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-[#f0f2f5] px-2 py-2">
                        <div className="animate-in fade-in mb-2">
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2">
                                <QuickActionPill icon={ShoppingBag} label={t('view_menu')} onClick={() => {setIsOpen(false); navigate('/menu');}}/>
                                <QuickActionPill icon={MapPin} label={t('chat_track_order')} onClick={() => handleSend("I want to track my order")} />
                                <QuickActionPill icon={MessageCircle} label="WhatsApp" onClick={handleSwitchToWhatsApp} />
                            </div>
                        </div>

                    <div className="flex items-end gap-2 bg-white p-1 rounded-[1.5rem] shadow-sm border border-[#e9edef]">
                         <button className="p-2 text-[#8696a0] hover:text-[#54656f] transition rounded-full hover:bg-stone-100">
                             <Sparkles size={20}/>
                         </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={orderPlaced ? "Anything else?" : t('chat_placeholder')}
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-[#111b21] placeholder:text-[#8696a0] py-2.5 max-h-24"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className={`p-2 rounded-full transition shadow-sm mb-0.5 ${input.trim() ? 'bg-[#008069] text-white hover:bg-[#006d59]' : 'bg-transparent text-[#8696a0]'}`}
                        >
                            <Send size={20} className={input.trim() ? "ml-0.5" : ""} />
                        </button>
                    </div>
                </div>
              </>
          )}
      </div>
    </>
  );
};

export default ChatWidget;
