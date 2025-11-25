
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, ChefHat, ShoppingBag, X, User, MessageCircle, MapPin, Phone, CreditCard, Check, ExternalLink, ArrowLeft, CheckCheck, Loader2 } from 'lucide-react';
import { MenuItem, ChatMessage, Order } from '../types';
import { initChatSession, sendMessageToBot, parseOrderFromChat } from '../services/gemini';
import { createOrder, generateWhatsAppLinkWithContext } from '../services/menuRepository';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  
  // --- Verification State ---
  // 'choice' is the new entry point
  const [verificationStep, setVerificationStep] = useState<'choice' | 'details' | 'otp' | 'verified'>('choice');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
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

  const shouldHide = location.pathname.startsWith('/admin') || location.pathname.startsWith('/agent');

  useEffect(() => {
    if (menu.length > 0) {
      initChatSession(menu);
    }
  }, [menu]);

  useEffect(() => {
    const handleOpen = () => {
        setIsOpen(true);
        if (!hasOpened) setHasOpened(true);
    };
    window.addEventListener('open-chat-widget', handleOpen);
    return () => window.removeEventListener('open-chat-widget', handleOpen);
  }, [hasOpened]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, verificationStep, detectedOrder, orderPlaced]);

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
      const [responseText] = await Promise.all([
         sendMessageToBot(userMsg.text),
         checkOrderIntent(userMsg)
      ]);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "I'm having trouble connecting to the kitchen right now. Please try again or use WhatsApp.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const checkOrderIntent = async (lastUserMsg: ChatMessage) => {
     try {
        const conversation = messages.concat(lastUserMsg).map(m => `${m.sender}: ${m.text}`).join('\n');
        const orderData: any = await parseOrderFromChat(conversation, menu);

        if (orderData && orderData.items && orderData.items.length > 0) {
            const total = orderData.items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
            setDetectedOrder({ 
                items: orderData.items, 
                total,
                customerName: orderData.customerName || userName || null,
                deliveryAddress: orderData.deliveryAddress || userAddress || null,
                phoneNumber: userPhone || orderData.phoneNumber || null,
                paymentMethod: orderData.paymentMethod || null
            });
        }
     } catch (e) {
         console.warn("Intent detection failed silently:", e);
     }
  };

  const handleSendOtp = async () => {
      if (!userName.trim() || !userPhone.trim() || !userAddress.trim()) {
          setVerificationError("Please enter all details.");
          return;
      }
      setVerificationError('');
      setIsVerifying(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsVerifying(false);
      setVerificationStep('otp');
  };

  const handleVerifyOtp = async () => {
      if (otpInput !== '123456') {
          setVerificationError("Invalid Code. Try 123456.");
          return;
      }
      setVerificationError('');
      setIsVerifying(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsVerifying(false);
      setVerificationStep('verified');
      
      setMessages([{
        id: 'welcome',
        sender: 'bot',
        text: `👋 Hi ${userName}! I'm Stanley. I can take your order right here. What are you craving today? 🍔`,
        timestamp: new Date()
      }]);
  };

  const handlePlaceOrder = async () => {
    if (!detectedOrder) return;
    setPlacingOrder(true);

    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: detectedOrder.customerName || userName,
        phoneNumber: userPhone,
        items: detectedOrder.items.map((i: any) => ({...i, id: i.id, available: true, description: '', imageUrl: '', category: ''})),
        total: detectedOrder.total,
        status: 'pending_approval',
        timestamp: new Date().toISOString(),
        type: 'delivery',
        source: 'web_chat',
        paymentMethod: detectedOrder.paymentMethod || 'cash',
        paymentStatus: 'pending',
        deliveryAddress: detectedOrder.deliveryAddress || userAddress,
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
      const url = generateWhatsAppLinkWithContext("I'd like to place an order via WhatsApp.");
      window.open(url, '_blank');
  };

  if (shouldHide) return null;

  return (
    <>
      {!isOpen && location.pathname === '/' && !hasOpened && (
          <div className="fixed bottom-24 right-6 z-40 animate-bounce-slow">
              <div className="bg-white px-4 py-3 rounded-xl shadow-xl border border-stone-100 flex items-center gap-3 relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                      <p className="text-xs font-bold text-stone-800">Hungry? 🍔</p>
                      <p className="text-[10px] text-stone-500">Order here or WhatsApp!</p>
                  </div>
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 border-r border-b border-stone-100"></div>
              </div>
          </div>
      )}

      {!isOpen && (
        <button
            onClick={() => { setIsOpen(true); setHasOpened(true); }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20b858] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
        >
            <MessageCircle size={28} fill="white" className="text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      <div 
        className={`fixed bottom-6 right-4 md:right-6 w-[90vw] md:w-[380px] h-[600px] max-h-[85vh] bg-[#efeae2] rounded-[1.5rem] shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}
        style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}
      >
          <div className="bg-[#008069] text-white p-3 flex items-center justify-between shrink-0 shadow-md z-10">
            <div className="flex items-center gap-3">
              {verificationStep !== 'choice' && (
                  <button onClick={() => setVerificationStep('choice')} className="hover:bg-white/10 p-1 rounded-full transition">
                      <ArrowLeft size={20}/>
                  </button>
              )}
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
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-white" />
            </button>
          </div>

          {/* STEP 0: CHOICE SCREEN */}
          {verificationStep === 'choice' && (
            <div className="flex-1 p-6 flex flex-col justify-center bg-white overflow-y-auto relative">
                <div className="text-center mb-8 animate-in zoom-in">
                    <div className="w-24 h-24 bg-[#e7fce3] rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl">🤖</span>
                    </div>
                    <h3 className="text-2xl font-black text-stone-800 mb-2">How would you like to order?</h3>
                    <p className="text-stone-500 text-sm max-w-[260px] mx-auto leading-relaxed">
                        Choose your preferred way to chat with us.
                    </p>
                </div>

                <div className="space-y-4 animate-in slide-in-from-bottom-8 fade-in">
                    <button 
                        onClick={handleSwitchToWhatsApp}
                        className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-[#20b858] transition flex items-center justify-center gap-3 transform hover:-translate-y-1 group"
                    >
                        <MessageCircle size={24} className="fill-white text-white group-hover:scale-110 transition"/>
                        <span>Order on WhatsApp</span>
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-stone-100"></div>
                        <span className="flex-shrink-0 mx-3 text-stone-300 text-[10px] font-bold uppercase tracking-widest">OR</span>
                        <div className="flex-grow border-t border-stone-100"></div>
                    </div>

                    <button 
                        onClick={() => setVerificationStep('details')}
                        className="w-full bg-stone-100 text-stone-800 py-4 rounded-2xl font-bold text-sm hover:bg-stone-200 transition flex items-center justify-center gap-3 group border border-stone-200"
                    >
                        <Sparkles size={20} className="text-[#008069] group-hover:scale-110 transition"/> 
                        <span>Chat with AI Waiter</span>
                    </button>
                </div>
                
                <div className="mt-auto pt-8 text-center">
                    <p className="text-[10px] text-stone-300 font-medium">Powered by Gemini 2.5</p>
                </div>
            </div>
          )}

          {/* STEP 1: DETAILS */}
          {verificationStep === 'details' && (
              <div className="flex-1 p-6 flex flex-col justify-center bg-white overflow-y-auto">
                  <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-stone-800">{t('chat_start_order')}</h3>
                      <p className="text-sm text-stone-500">{t('chat_enter_details')}</p>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-3">
                      <input 
                          type="text" 
                          value={userName} 
                          onChange={e => setUserName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#25D366] outline-none text-sm"
                          placeholder={t('chat_label_name')}
                          required
                      />
                      <input 
                          type="tel" 
                          value={userPhone} 
                          onChange={e => setUserPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#25D366] outline-none text-sm"
                          placeholder={t('chat_label_phone')}
                          required
                      />
                      <textarea 
                          value={userAddress} 
                          onChange={e => setUserAddress(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#25D366] outline-none text-sm min-h-[80px] resize-none"
                          placeholder={t('chat_label_address')}
                          required
                      />
                      {verificationError && <p className="text-xs text-red-500 font-bold text-center">{verificationError}</p>}
                      <button 
                          type="submit"
                          disabled={isVerifying}
                          className="w-full bg-[#008069] text-white py-3 rounded-xl font-bold hover:bg-[#006d59] transition shadow-lg flex items-center justify-center gap-2 mt-2"
                      >
                          {isVerifying ? <Loader2 className="animate-spin" size={18}/> : t('chat_btn_verify')}
                      </button>
                  </form>
              </div>
          )}

          {/* STEP 2: OTP */}
          {verificationStep === 'otp' && (
              <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                  <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-stone-800">{t('chat_verify_title')}</h3>
                      <p className="text-sm text-stone-500 mt-1">{t('chat_verify_desc')} {userPhone}</p>
                      <p className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mt-2">Code: 123456</p>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-6">
                      <input 
                          type="text" 
                          maxLength={6}
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value)}
                          className="w-full py-3 text-center text-3xl tracking-[0.5em] font-bold border-b-2 border-stone-300 focus:border-[#008069] outline-none bg-transparent"
                          placeholder="000000"
                          autoFocus
                      />
                      {verificationError && <p className="text-xs text-red-500 font-bold text-center">{verificationError}</p>}
                      <button 
                          type="submit"
                          disabled={isVerifying}
                          className="w-full bg-[#008069] text-white py-3 rounded-xl font-bold hover:bg-[#006d59] transition shadow-lg flex items-center justify-center gap-2"
                      >
                          {isVerifying ? <Loader2 className="animate-spin"/> : t('chat_btn_verify_confirm')}
                      </button>
                  </form>
              </div>
          )}

          {/* STEP 3: CHAT */}
          {verificationStep === 'verified' && (
              <>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar scroll-smooth relative">
                    {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-2 px-3 rounded-lg text-sm leading-relaxed relative shadow-sm ${
                        msg.sender === 'user' ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' : 'bg-white text-[#111b21] rounded-tl-none'
                        }`}>
                        {msg.text}
                        <div className="flex justify-end items-center gap-1 mt-1 select-none">
                            <span className="text-[10px] text-[#667781] min-w-fit">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {msg.sender === 'user' && <CheckCheck size={14} className="text-[#53bdeb]" />}
                        </div>
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
                                        <div className="flex items-center gap-1"><MapPin size={10}/> {detectedOrder.deliveryAddress || userAddress}</div>
                                        <div className="flex items-center gap-1"><CreditCard size={10}/> {detectedOrder.paymentMethod || <span className="text-red-500">Payment needed</span>}</div>
                                    </div>
                                    {detectedOrder.paymentMethod ? (
                                        <button onClick={handlePlaceOrder} disabled={placingOrder} className="w-full bg-[#008069] text-white py-2 rounded shadow-sm text-xs font-bold flex items-center justify-center gap-2">
                                            {placingOrder ? <Loader2 className="animate-spin" size={12}/> : <Check size={14}/>} {t('chat_draft_submit')}
                                        </button>
                                    ) : <p className="text-[10px] text-red-500 text-center">Please specify payment method.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="bg-[#f0f2f5] px-2 py-2">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2 mb-2">
                        <QuickActionPill icon={ShoppingBag} label={t('view_menu')} onClick={() => {setIsOpen(false); navigate('/menu');}}/>
                        <QuickActionPill icon={MapPin} label={t('chat_track_order')} onClick={() => handleSend("I want to track my order")} />
                    </div>
                    <div className="flex items-end gap-2 bg-white p-1 rounded-[1.5rem] shadow-sm border border-[#e9edef]">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('chat_placeholder')}
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-[#111b21] py-2.5 px-3"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className={`p-2 rounded-full transition shadow-sm mb-0.5 ${input.trim() ? 'bg-[#008069] text-white' : 'bg-transparent text-[#8696a0]'}`}
                        >
                            <Send size={20} />
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
