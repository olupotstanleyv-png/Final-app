
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Printer, MapPin, Phone, User, CreditCard, Clock, 
    ShoppingBag, Truck, CheckCircle, XCircle, AlertCircle, Navigation, 
    Calendar, Mail, Shield
} from 'lucide-react';
import { Order, DeliveryAgent } from '../types';
import { fetchOrders, fetchAgents, updateOrderStatus } from '../services/menuRepository';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [assignedAgent, setAssignedAgent] = useState<DeliveryAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleAgentAssign = async (agentId: string) => {
      if (!order) return;
      setIsUpdating(true);
      await updateOrderStatus(order.id, order.status, agentId);
      
      const allOrders = await fetchOrders();
      const found = allOrders.find(o => o.id === order.id);
      if (found) {
          setOrder(found);
          const agent = agents.find(a => a.id === agentId);
          setAssignedAgent(agent || null);
      }
      setIsUpdating(false);
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
    <div className="min-h-screen bg-stone-50 pb-20 font-sans">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
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
                        <Printer size={16}/> Print Invoice
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

        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: CUSTOMER & ORDER INFO */}
            <div className="space-y-6">
                {/* Customer Card */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><User size={16}/> Customer Details</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                                {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-stone-900">{order.customerName}</p>
                                <p className="text-xs text-stone-400">Customer since 2024</p>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-stone-50 space-y-3">
                             <div className="flex items-center gap-3 text-sm text-stone-600">
                                <Phone size={16} className="text-stone-400"/> 
                                <a href={`tel:${order.phoneNumber}`} className="hover:text-orange-600 underline decoration-dotted">{order.phoneNumber}</a>
                             </div>
                             <div className="flex items-start gap-3 text-sm text-stone-600">
                                <MapPin size={16} className="text-stone-400 mt-0.5"/> 
                                <span>{order.deliveryAddress || "No address provided (Pickup/Dine-in)"}</span>
                             </div>
                             <div className="flex items-center gap-3 text-sm text-stone-600">
                                <Mail size={16} className="text-stone-400"/> 
                                <span className="italic text-stone-400">email@hidden.com</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Payment Card */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                     <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><CreditCard size={16}/> Payment Info</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{order.paymentStatus}</span>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-stone-500">Method</span>
                            <span className="font-bold text-stone-900 capitalize flex items-center gap-2">
                                {order.paymentMethod === 'cash' && <span className="text-green-600">💵</span>}
                                {order.paymentMethod === 'card' && <span className="text-blue-600">💳</span>}
                                {order.paymentMethod.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-stone-500">Order Total</span>
                            <span className="text-2xl font-bold text-stone-900">${order.total.toFixed(2)}</span>
                        </div>
                        {order.paymentMethod === 'online_link' && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs">
                                <span className="font-bold text-blue-700 block mb-1">Payment Link:</span>
                                <a href={order.paymentLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{order.paymentLink || "Generating..."}</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MIDDLE COLUMN: ORDER ITEMS */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><ShoppingBag size={16}/> Order Items</h3>
                        <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">{order.items.length} Items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-2">Item</th>
                                    <th className="px-4 py-2 text-center">Qty</th>
                                    <th className="px-4 py-2 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {order.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-stone-50/50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-sm text-stone-800">{item.name}</div>
                                            {item.modifiers && (
                                                <div className="text-xs text-orange-600 italic mt-0.5">Note: {item.modifiers}</div>
                                            )}
                                            <div className="text-[10px] text-stone-400 mt-0.5">{item.category}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-stone-900">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-sm text-stone-600">${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-stone-50 border-t border-stone-100">
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span>Subtotal</span>
                            <span>${(order.total / 1.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span>Tax (5%)</span>
                            <span>${(order.total - (order.total / 1.05)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-200 mt-2">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: FULFILLMENT & MAP */}
            <div className="lg:col-span-1 space-y-6">
                {/* Agent Assignment */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                     <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Truck size={16}/> Delivery Agent</h3>
                    </div>
                    <div className="p-5">
                        {assignedAgent ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-white">
                                    <User size={24}/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-stone-900">{assignedAgent.name}</p>
                                    <p className="text-xs text-stone-500">{assignedAgent.phone}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className={`w-2 h-2 rounded-full ${assignedAgent.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                        <span className="text-xs font-bold uppercase text-stone-600">{assignedAgent.status}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleAgentAssign('')} className="text-xs text-red-500 hover:underline">Unassign</button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 text-stone-500 mb-3 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                    <AlertCircle size={16} className="text-yellow-600"/> No agent assigned yet.
                                </div>
                                <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Assign Agent</label>
                                <select 
                                    className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50"
                                    onChange={(e) => handleAgentAssign(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select an agent...</option>
                                    {agents.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* LIVE TRACKING MAP */}
                {order.type === 'delivery' && (
                    <div className="bg-stone-800 rounded-2xl shadow-lg border border-stone-700 overflow-hidden relative h-80 group">
                         {/* Map Header */}
                         <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-stone-800 uppercase">Live Tracking</span>
                         </div>

                         {/* Simulated Map Layer */}
                         <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/13/5286/3427.png')] bg-cover opacity-50"></div>
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                         {/* Map Content centered on Screen Center (Customer Destination) */}
                         <div className="absolute top-1/2 left-1/2 w-0 h-0">
                             
                             {/* Agent Marker */}
                             {assignedAgent && (
                                <div 
                                    className="absolute z-30 flex flex-col items-center transition-transform duration-1000 ease-linear"
                                    style={{ transform: `translate(${agentOffset.x}px, ${agentOffset.y}px)` }}
                                >
                                    <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white relative z-20 animate-bounce">
                                        <Navigation size={14} className="transform rotate-45"/>
                                    </div>
                                    <div className="mt-1 bg-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm text-stone-800 whitespace-nowrap">
                                        {assignedAgent.name}
                                    </div>
                                </div>
                             )}

                             {/* Destination Marker (Center) */}
                             <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                                <div className="w-4 h-4 bg-white rounded-full border-2 border-stone-900 shadow-xl"></div>
                                <div className="bg-stone-900 text-white px-2 py-1 rounded text-[10px] font-bold mt-1 whitespace-nowrap">Customer</div>
                             </div>

                         </div>

                         {!assignedAgent && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                 <div className="text-center text-white/70">
                                     <Truck size={32} className="mx-auto mb-2 opacity-50"/>
                                     <p className="text-sm font-bold">Waiting for Agent</p>
                                 </div>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default OrderDetails;
