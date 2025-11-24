
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ArrowLeft, Printer, MapPin, Phone, User, CreditCard, Clock, 
    ShoppingBag, Truck, CheckCircle, XCircle, AlertCircle, Navigation, 
    Calendar, Mail, Shield, Send, MessageCircle, Lock, Info
} from 'lucide-react';
import { Order, DeliveryAgent, OrderMessage } from '../types';
import { fetchOrders, fetchAgents, updateOrderStatus, fetchOrderMessages, sendOrderMessage, maskPhoneNumber, updateOrderPickupTime } from '../services/menuRepository';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [assignedAgent, setAssignedAgent] = useState<DeliveryAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Map State
  const [agentPos, setAgentPos] = useState({ lat: 25.1950, lng: 55.2650 });
  const defaultDest = { lat: 25.2048, lng: 55.2708 };
  const destination = order?.deliveryLocation || defaultDest;

  useEffect(() => {
    const loadData = async () => {
        if (!orderId) return;
        const allOrders = await fetchOrders();
        const allAgents = fetchAgents();
        
        const foundOrder = allOrders.find(o => o.id === orderId);
        setAgents(allAgents);
        
        if (foundOrder) {
            setOrder(foundOrder);
            if (foundOrder.deliveryAgentId) {
                const agent = allAgents.find(a => a.id === foundOrder.deliveryAgentId);
                setAssignedAgent(agent || null);
                if (agent) {
                    setAgentPos({ lat: agent.currentLat, lng: agent.currentLng });
                }
            }
        }
        setLoading(false);
    };
    loadData();
  }, [orderId]);

  // Auto-print logic
  useEffect(() => {
      if (!loading && order && searchParams.get('autoPrint') === 'true') {
          // Small delay to ensure rendering
          setTimeout(() => {
              window.print();
          }, 500);
      }
  }, [loading, order, searchParams]);

  // Chat Polling
  useEffect(() => {
      if (!orderId) return;
      const pollMessages = () => {
          const msgs = fetchOrderMessages(orderId);
          setMessages(msgs);
      };
      pollMessages();
      const interval = setInterval(pollMessages, 3000);
      return () => clearInterval(interval);
  }, [orderId]);

  // Scroll Chat to bottom
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live Map Simulation
  useEffect(() => {
    if (!assignedAgent) return;
    
    const interval = setInterval(() => {
        setAgentPos(prev => {
            const latDiff = destination.lat - prev.lat;
            const lngDiff = destination.lng - prev.lng;
            
            if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) return prev;

            // Simulate movement towards destination
            const newLat = prev.lat + (latDiff * 0.05) + (Math.random() - 0.5) * 0.0001;
            const newLng = prev.lng + (lngDiff * 0.05) + (Math.random() - 0.5) * 0.0001;
            return { lat: newLat, lng: newLng };
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [assignedAgent, destination]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setIsUpdating(true);
    await updateOrderStatus(order.id, newStatus);
    // Refresh local state
    const allOrders = await fetchOrders();
    const found = allOrders.find(o => o.id === order.id);
    if (found) setOrder(found);
    setIsUpdating(false);
  };

  const handleSetPickupTime = async (time: string) => {
    if (!order) return;
    await updateOrderPickupTime(order.id, time);
    // Refresh local state
    const allOrders = await fetchOrders();
    const found = allOrders.find(o => o.id === order.id);
    if (found) setOrder(found);
  };

  const handleAgentAssign = async (agentId: string) => {
      if (!order) return;
      setIsUpdating(true);
      await updateOrderStatus(order.id, order.status, agentId, 'ready_for_logistics');
      
      const allOrders = await fetchOrders();
      const found = allOrders.find(o => o.id === order.id);
      if (found) {
          setOrder(found);
          const agent = agents.find(a => a.id === agentId);
          setAssignedAgent(agent || null);
      }
      setIsUpdating(false);
  };

  const handleSendMessage = () => {
      if (!newMessage.trim() || !order) return;
      sendOrderMessage(order.id, newMessage, 'customer');
      setNewMessage('');
      setMessages(fetchOrderMessages(order.id)); // Instant update
  };

  // Map Projection Helper
  const getOffset = (pos: {lat: number, lng: number}) => {
      const MAP_SCALE = 40000;
      const dx = (pos.lng - destination.lng) * MAP_SCALE;
      const dy = -(pos.lat - destination.lat) * MAP_SCALE;
      return { x: dx, y: dy };
  };
  
  const agentOffset = getOffset(agentPos);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-spin w-8 h-8 border-4 border-stone-900 border-t-transparent rounded-full"></div></div>;
  }

  if (!order) {
      return <div className="min-h-screen flex items-center justify-center">Order not found.</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 font-sans print:bg-white print:pb-0">
        <style>{`
            @media print {
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                @page { margin: 0; size: auto; }
                body { margin: 0; padding: 0; background: white; }
            }
        `}</style>

        {/* PRINT ONLY INVOICE TEMPLATE */}
        <div className="hidden print-only p-8 bg-white text-stone-900 max-w-4xl mx-auto">
            <div className="border-b-2 border-stone-800 pb-8 mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-serif font-black mb-2">Stanley's</h1>
                    <p className="text-sm uppercase tracking-widest text-stone-500">Fine Dining &bull; Delivery</p>
                    <p className="text-sm mt-4 text-stone-600">
                        Sheikh Mohammed bin Rashid Blvd<br/>
                        Downtown Dubai, UAE<br/>
                        +971 50 429 1207
                    </p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase tracking-tight text-stone-300">Invoice</h2>
                    <p className="font-mono text-lg font-bold mt-2">#{order.id}</p>
                    <p className="text-sm text-stone-500 mt-1">{new Date(order.timestamp).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                    <h3 className="font-bold text-xs uppercase text-stone-400 mb-2 border-b border-stone-200 pb-1">Bill To</h3>
                    <p className="font-bold text-lg">{order.customerName}</p>
                    <p className="text-sm text-stone-600">{order.phoneNumber}</p>
                    {order.deliveryAddress && <p className="text-sm text-stone-600 mt-1 max-w-xs">{order.deliveryAddress}</p>}
                </div>
                <div className="text-right">
                    <h3 className="font-bold text-xs uppercase text-stone-400 mb-2 border-b border-stone-200 pb-1">Payment Details</h3>
                    <p className="font-bold">{order.paymentMethod.toUpperCase()}</p>
                    <p className="text-sm text-stone-600">Status: {order.paymentStatus.toUpperCase()}</p>
                    <p className="text-sm text-stone-600 mt-2">Type: {order.type.toUpperCase()}</p>
                </div>
            </div>

            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-stone-800 text-xs uppercase">
                        <th className="text-left py-2 font-bold">Item Description</th>
                        <th className="text-center py-2 font-bold">Qty</th>
                        <th className="text-right py-2 font-bold">Price</th>
                        <th className="text-right py-2 font-bold">Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {order.items.map((item, i) => (
                        <tr key={i} className="border-b border-stone-100">
                            <td className="py-3">
                                <span className="font-bold block">{item.name}</span>
                                {item.modifiers && <span className="text-xs text-stone-500">{item.modifiers}</span>}
                            </td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right">${item.price.toFixed(2)}</td>
                            <td className="py-3 text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-1/3">
                    <div className="flex justify-between py-2 text-sm text-stone-600 border-b border-stone-100">
                        <span>Subtotal</span>
                        <span>${(order.total / 1.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm text-stone-600 border-b border-stone-100">
                        <span>Tax (5%)</span>
                        <span>${(order.total - (order.total / 1.05)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-4 text-xl font-bold text-stone-900">
                        <span>Total Due</span>
                        <span>${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-16 pt-8 border-t border-stone-200 text-center text-xs text-stone-400">
                <p>Thank you for dining with Stanley's. For any inquiries, please contact support@stanleys.com</p>
            </div>
        </div>

        {/* REGULAR SCREEN VIEW */}
        <header className="no-print bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link to="/admin" className="p-2 hover:bg-stone-100 rounded-lg transition text-stone-500">
                        <ArrowLeft size={20}/>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                            Order #{order.id.replace('ORD-', '')}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                                order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                order.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                order.status === 'completed' ? 'bg-stone-100 text-stone-700 border-stone-200' :
                                'bg-red-100 text-red-700 border-red-200'
                            }`}>
                                {order.status.replace('_', ' ')}
                            </span>
                        </h1>
                        <p className="text-xs text-stone-400 font-mono mt-0.5 flex items-center gap-2">
                            <Calendar size={12}/> {new Date(order.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-sm font-bold text-stone-600 flex items-center gap-2 shadow-sm transition">
                        <Printer size={16}/> Print / Download Invoice
                    </button>
                    {order.status === 'pending_approval' && (
                        <>
                            <button onClick={() => handleStatusUpdate('cancelled')} disabled={isUpdating} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                                <XCircle size={16}/> Reject
                            </button>
                            <button onClick={() => handleStatusUpdate('approved')} disabled={isUpdating} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition">
                                <CheckCircle size={16}/> Approve Order
                            </button>
                        </>
                    )}
                    {order.status === 'approved' && (
                        <button onClick={() => handleStatusUpdate('completed')} disabled={isUpdating} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition">
                            <CheckCircle size={16}/> Mark Completed
                        </button>
                    )}
                </div>
            </div>
        </header>

        <div className="no-print max-w-6xl mx-auto px-6 py-8 space-y-6">
            
            {/* TOP SECTION: ORDER ITEMS TABLE */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><ShoppingBag size={18}/> Order Summary</h3>
                    <span className="text-xs font-bold bg-stone-200 text-stone-600 px-3 py-1 rounded-full">{order.items.length} Items</span>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-6 py-4 text-center">Quantity</th>
                                <th className="px-6 py-4 text-right">Unit Price</th>
                                <th className="px-6 py-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {order.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-stone-50/30 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-stone-900">{item.name}</div>
                                        {item.modifiers && (
                                            <div className="text-xs text-orange-600 italic mt-0.5">Note: {item.modifiers}</div>
                                        )}
                                        <div className="text-xs text-stone-400 mt-1 uppercase tracking-wide font-medium bg-stone-100 inline-block px-1.5 py-0.5 rounded">{item.category}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-stone-100 text-stone-800 font-bold px-3 py-1 rounded-lg text-sm">{item.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-stone-600 font-medium">${item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-stone-900">${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-6 bg-stone-50 border-t border-stone-100 flex flex-col items-end">
                    <div className="w-full md:w-1/3 space-y-3">
                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Subtotal</span>
                            <span>${(order.total / 1.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Tax (5%)</span>
                            <span>${(order.total - (order.total / 1.05)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-stone-900 pt-4 border-t border-stone-200 mt-2">
                            <span>Total Amount</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM GRID: CUSTOMER & DELIVERY INFO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: CUSTOMER & PAYMENT */}
                <div className="space-y-6">
                    {/* Customer Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden h-full">
                        <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><User size={16}/> Customer Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg border border-orange-100">
                                    {order.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-stone-900 leading-tight">{order.customerName}</p>
                                    <p className="text-xs text-stone-400">Regular Customer</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-stone-50 space-y-4">
                                 <div className="flex items-center gap-4 text-sm text-stone-600">
                                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400"><Phone size={16}/></div>
                                    {/* MASKED PHONE DISPLAY */}
                                    <div className="flex flex-col">
                                        <span className="font-mono font-bold tracking-wider">{maskPhoneNumber(order.phoneNumber)}</span>
                                        <span className="text-[10px] text-green-600 flex items-center gap-1"><Lock size={10}/> Privacy Protected</span>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-4 text-sm text-stone-600">
                                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 shrink-0"><MapPin size={16}/></div>
                                    <span className="mt-1.5">{order.deliveryAddress || "No address provided (Pickup/Dine-in)"}</span>
                                 </div>
                                 <div className="flex items-center gap-4 text-sm text-stone-600">
                                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400"><Mail size={16}/></div>
                                    <span className="italic text-stone-400">email@hidden.com</span>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                         <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><CreditCard size={16}/> Payment Info</h3>
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{order.paymentStatus}</span>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-stone-500 font-medium">Method</span>
                                <span className="font-bold text-stone-900 capitalize flex items-center gap-2 bg-stone-50 px-3 py-1 rounded-lg">
                                    {order.paymentMethod === 'cash' && <span className="text-green-600">💵</span>}
                                    {order.paymentMethod === 'card' && <span className="text-blue-600">💳</span>}
                                    {order.paymentMethod.replace('_', ' ')}
                                </span>
                            </div>
                            {order.paymentMethod === 'online_link' && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs mt-4">
                                    <span className="font-bold text-blue-700 block mb-2">Payment Link Generated:</span>
                                    <a href={order.paymentLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all font-mono">{order.paymentLink || "Generating..."}</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: FULFILLMENT & MAP */}
                <div className="space-y-6">
                    {order.type === 'pickup' ? (
                        /* PICKUP CARD */
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                             <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Clock size={16}/> Pickup Coordination</h3>
                            </div>
                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Customer Pickup Time</label>
                                    <input 
                                        type="time" 
                                        className="w-full p-3 border border-stone-200 rounded-xl text-lg font-bold text-stone-900 focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={order.pickupTime || ''}
                                        onChange={(e) => handleSetPickupTime(e.target.value)}
                                    />
                                    <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                                        <Info size={12}/>
                                        {order.pickupTime ? `Scheduled for ${order.pickupTime}` : "Please set a pickup time with the customer."}
                                    </p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4">
                                    <h4 className="font-bold text-orange-800 text-sm mb-1">Pickup Instructions</h4>
                                    <p className="text-xs text-orange-700">
                                        Verify customer ID or Order # upon arrival. Ensure food is kept warm until pickup.
                                    </p>
                                </div>

                                {order.status === 'approved' && (
                                    <button onClick={() => handleStatusUpdate('completed')} disabled={isUpdating} className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition">
                                        <CheckCircle size={18}/> Mark as Picked Up
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* DELIVERY CARD (Existing) */
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                             <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Truck size={16}/> Delivery Fulfillment</h3>
                            </div>
                            <div className="p-6">
                                {assignedAgent ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                                            <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center text-white shrink-0 shadow-md">
                                                <User size={24}/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-stone-900 text-lg">{assignedAgent.name}</p>
                                                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                                                    <Phone size={10} />
                                                    <span className="font-mono">{maskPhoneNumber(assignedAgent.phone)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${assignedAgent.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                    <span className="text-xs font-bold uppercase text-stone-600 tracking-wide">{assignedAgent.status}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleAgentAssign('')} className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1 hover:bg-red-50 rounded-lg transition">Unassign</button>
                                        </div>
                                        
                                        {/* IN-APP CHAT INTERFACE */}
                                        <div className="bg-stone-100 rounded-xl border border-stone-200 p-3 h-64 flex flex-col">
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-500 uppercase">
                                                <MessageCircle size={12}/> Driver Chat
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 custom-scrollbar">
                                                {messages.length === 0 && (
                                                    <div className="text-center text-stone-400 text-xs py-10">No messages yet.</div>
                                                )}
                                                {messages.map(msg => (
                                                    <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                                                            msg.sender === 'customer' 
                                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                                            : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                                                        }`}>
                                                            <p>{msg.text}</p>
                                                            <span className={`text-[9px] block mt-1 text-right ${msg.sender === 'customer' ? 'text-blue-100' : 'text-stone-400'}`}>
                                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={chatEndRef} />
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                    placeholder="Message driver..."
                                                    className="flex-1 text-xs p-2 rounded border border-stone-300 focus:outline-none focus:border-blue-500"
                                                />
                                                <button 
                                                    onClick={handleSendMessage}
                                                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                                                >
                                                    <Send size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="inline-flex items-center gap-2 text-stone-500 mb-4 text-sm bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
                                            <AlertCircle size={16} className="text-yellow-600"/> No agent assigned yet.
                                        </div>
                                        {order.type === 'delivery' && (
                                        <div className="relative">
                                            <label className="text-xs font-bold text-stone-400 uppercase block mb-2 text-left ml-1">Assign Driver</label>
                                            <select 
                                                className="w-full p-3 border border-stone-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-200 outline-none shadow-sm cursor-pointer"
                                                onChange={(e) => handleAgentAssign(e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select available driver...</option>
                                                {agents.filter(a => a.status === 'available').map(a => (
                                                    <option key={a.id} value={a.id}>{a.name} — {a.status.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LIVE TRACKING MAP */}
                    {order.type === 'delivery' && (
                        <div className="bg-stone-900 rounded-2xl shadow-xl border border-stone-700 overflow-hidden relative h-80 group">
                             {/* Map Header */}
                             <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-stone-800 uppercase tracking-wider">Live View</span>
                             </div>

                             {/* Simulated Map Layer */}
                             <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/13/5286/3427.png')] bg-cover opacity-60"></div>
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                             {/* Map Content centered on Screen Center (Customer Destination) */}
                             <div className="absolute top-1/2 left-1/2 w-0 h-0">
                                 
                                 {/* Agent Marker */}
                                 {assignedAgent && (
                                    <div 
                                        className="absolute z-30 flex flex-col items-center transition-transform duration-1000 ease-linear"
                                        style={{ transform: `translate(${agentOffset.x}px, ${agentOffset.y}px)` }}
                                    >
                                        <div className="relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-orange-500/30 rounded-full animate-ping"></div>
                                            <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white relative z-20">
                                                <Navigation size={14} className="transform rotate-45"/>
                                            </div>
                                        </div>
                                        <div className="mt-1 bg-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm text-stone-800 whitespace-nowrap">
                                            {assignedAgent.name}
                                        </div>
                                    </div>
                                 )}

                                 {/* Destination Marker (Center) */}
                                 <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                                    <div className="w-4 h-4 bg-white rounded-full border-2 border-stone-900 shadow-xl"></div>
                                    <div className="bg-stone-900 text-white px-2 py-1 rounded text-[10px] font-bold mt-1 whitespace-nowrap shadow-lg">Customer</div>
                                 </div>

                             </div>

                             {!assignedAgent && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                     <div className="text-center text-white/70">
                                         <Truck size={32} className="mx-auto mb-2 opacity-50"/>
                                         <p className="text-sm font-bold tracking-wide">Waiting for Dispatch</p>
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default OrderDetails;
