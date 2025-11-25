
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Truck, CheckCircle, User, Phone, Navigation, MessageCircle, Clock, Map as MapIcon, ShoppingBag, Utensils, Home, X, Send } from 'lucide-react';
import { Order, DeliveryAgent, OrderMessage } from '../types';
import { fetchOrders, fetchAgents, fetchOrderMessages, sendOrderMessage } from '../services/menuRepository';

const Tracking: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [agent, setAgent] = useState<DeliveryAgent | null>(null);
    const [loading, setLoading] = useState(true);

    // Live Tracking State
    const [agentPos, setAgentPos] = useState({ lat: 25.1950, lng: 55.2650 });
    const [eta, setEta] = useState<string>('--');
    const [distance, setDistance] = useState<string>('--');
    
    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    // Default Destination (Downtown Dubai)
    const defaultDest = { lat: 25.2048, lng: 55.2708 };
    const destination = order?.deliveryLocation || defaultDest;

    // Map Scale (Pixels per Degree) - Controls "Zoom"
    const MAP_SCALE = 40000;

    useEffect(() => {
        const loadData = async () => {
            if (!orderId) return;
            const orders = await fetchOrders();
            const agents = fetchAgents();
            const found = orders.find(o => o.id === orderId);
            if (found) {
                setOrder(found);
                if (found.deliveryAgentId) {
                    const da = agents.find(a => a.id === found.deliveryAgentId);
                    if (da) {
                        setAgent(da);
                    }
                }
            }
            setLoading(false);
        };
        loadData();

        // Simulation Interval for Movement & ETA
        const interval = setInterval(() => {
            setAgentPos(prev => {
                // Simulate movement towards destination
                const latDiff = destination.lat - prev.lat;
                const lngDiff = destination.lng - prev.lng;
                
                // Stop if arrived
                if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
                    return prev;
                }

                // Move 2% of the remaining distance each tick + noise
                const newLat = prev.lat + (latDiff * 0.02) + (Math.random() - 0.5) * 0.00005;
                const newLng = prev.lng + (lngDiff * 0.02) + (Math.random() - 0.5) * 0.00005;

                return { lat: newLat, lng: newLng };
            });
        }, 1000); // Faster updates for smoother UI

        return () => clearInterval(interval);
    }, [orderId, destination.lat, destination.lng]);

    // Chat Polling
    useEffect(() => {
        if (!isChatOpen || !orderId) return;
        const pollMessages = () => {
            const msgs = fetchOrderMessages(orderId);
            setMessages(msgs);
        };
        pollMessages();
        const interval = setInterval(pollMessages, 3000);
        return () => clearInterval(interval);
    }, [isChatOpen, orderId]);

    // Auto-scroll chat
    useEffect(() => {
        if (isChatOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !orderId) return;
        sendOrderMessage(orderId, newMessage, 'customer');
        setNewMessage('');
        setMessages(fetchOrderMessages(orderId));
    };

    // Recalculate ETA whenever positions change
    useEffect(() => {
        if (!agentPos) return;

        // Haversine Formula for Distance (km)
        const R = 6371; 
        const dLat = (destination.lat - agentPos.lat) * Math.PI / 180;
        const dLon = (destination.lng - agentPos.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(agentPos.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in km
        
        setDistance(d < 0.1 ? 'Arrived' : d.toFixed(1) + ' km');

        // Calculate ETA (Assume avg speed 40km/h in city)
        const speedKmH = 40;
        const timeHours = d / speedKmH;
        const timeMins = Math.ceil(timeHours * 60);
        
        if (d < 0.1) setEta('Arrived');
        else if (timeMins < 1) setEta('Arriving Now');
        else setEta(timeMins + ' mins');

    }, [agentPos, destination]);

    // Projection Helper: Lat/Lng -> X/Y Pixels relative to Destination (Center)
    const getOffset = (pos: {lat: number, lng: number}) => {
        // x = longitude diff * scale
        const dx = (pos.lng - destination.lng) * MAP_SCALE;
        // y = -latitude diff * scale (screen Y is down, Lat is up)
        const dy = -(pos.lat - destination.lat) * MAP_SCALE;
        return { x: dx, y: dy };
    };

    const agentOffset = getOffset(agentPos);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-500 gap-3">
             <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-sm font-bold animate-pulse">Locating Order...</p>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
            <h1 className="text-2xl font-bold text-stone-800 mb-4">Order Not Found</h1>
            <Link to="/" className="text-orange-600 underline font-bold">Return Home</Link>
        </div>
    );

    // Timeline Logic
    const steps = [
        { id: 'pending_approval', label: 'Order Placed', icon: ShoppingBag },
        { id: 'approved', label: 'Kitchen Preparing', icon: Utensils },
        { id: 'on_way', label: 'Out for Delivery', icon: Truck },
        { id: 'completed', label: 'Delivered', icon: CheckCircle },
    ];

    const getCurrentStepIndex = (status: string) => {
        if (status === 'pending_approval') return 0;
        if (status === 'approved') return 1;
        if (status === 'on_way' || (agent && status !== 'completed')) return 2;
        if (status === 'completed') return 3;
        if (status === 'cancelled') return -1;
        return 0;
    };
    const currentStepIdx = getCurrentStepIndex(order.status);

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row font-sans overflow-hidden">
            {/* Sidebar / Info Panel */}
            <div className="w-full md:w-96 bg-white shadow-2xl z-20 flex flex-col h-[50vh] md:h-screen overflow-y-auto relative border-r border-stone-200">
                <div className="p-6 bg-stone-900 text-white sticky top-0 z-20 shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
                                <MapIcon size={20} className="text-orange-500"/> Tracking Order
                            </h1>
                            <p className="font-mono text-stone-400 text-xs uppercase tracking-wider">ID: #{order.id}</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 flex-1 space-y-8">
                     {/* ORDER TIMELINE */}
                     <div className="flex justify-between relative px-2">
                        {/* Connector Line */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200 -z-10"></div>
                        <div className={`absolute top-4 left-4 h-0.5 bg-green-500 -z-10 transition-all duration-500`} style={{ right: `${100 - (currentStepIdx / (steps.length - 1)) * 100}%` }}></div>

                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isCompleted = index <= currentStepIdx;
                            const isCurrent = index === currentStepIdx;
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-stone-300 text-stone-300'}`}>
                                        <Icon size={14} />
                                    </div>
                                    <span className={`text-[10px] font-bold text-center w-16 ${isCurrent ? 'text-stone-900' : 'text-stone-400'}`}>{step.label}</span>
                                </div>
                            )
                        })}
                     </div>
                    
                    {/* LIVE ETA CARD */}
                    {agent && (
                        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-lg transform hover:scale-[1.02] transition duration-300 border border-stone-700 relative overflow-hidden">
                            {/* Background Pulse */}
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                            
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <div>
                                    <p className="text-stone-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Estimated Arrival</p>
                                    <h2 className="text-4xl font-bold text-white tracking-tight">{eta}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-stone-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Distance</p>
                                    <h3 className="text-2xl font-bold text-orange-500">{distance}</h3>
                                </div>
                            </div>
                            <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden relative z-10">
                                <div className="h-full bg-orange-500 rounded-full animate-pulse w-3/4"></div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Agent Info */}
                    {agent ? (
                        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-xs uppercase text-stone-400 mb-4 tracking-wider flex items-center gap-2">
                                <Truck size={14} /> Courier Details
                            </h4>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold border border-orange-100">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-stone-800 text-lg leading-none mb-1">{agent.name}</p>
                                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Active
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${agent.phone}`} className="bg-stone-50 hover:bg-stone-100 text-stone-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border border-stone-200">
                                    <Phone size={14} className="text-stone-400"/> Call
                                </a>
                                <button 
                                    onClick={() => setIsChatOpen(true)}
                                    className="bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
                                >
                                    <MessageCircle size={14} /> Chat
                                </button>
                            </div>
                        </div>
                    ) : (
                         <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                <Truck size={20} className="animate-bounce"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-800 text-sm">Finding Driver...</h4>
                                <p className="text-xs text-stone-500">Assigning nearest available agent.</p>
                            </div>
                         </div>
                    )}

                    {/* Order Summary */}
                     <div>
                        <h4 className="font-bold text-xs uppercase text-stone-400 mb-3 tracking-wider">Order Items</h4>
                         <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm py-1">
                                    <span className="text-stone-600 font-medium">
                                        <span className="font-bold text-stone-900">{item.quantity}x</span> {item.name}
                                    </span>
                                    <span className="font-bold text-stone-800">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                             <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t border-stone-200 text-stone-900">
                                <span>Total</span>
                                <span>${order.total}</span>
                             </div>
                         </div>
                     </div>
                </div>
                
                <div className="p-4 border-t border-stone-200 bg-white sticky bottom-0 z-20">
                    <Link to="/" className="block w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white text-center rounded-xl font-bold text-sm transition shadow-lg">
                        Back to Menu
                    </Link>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-stone-200 h-[50vh] md:h-screen overflow-hidden">
                {/* Simulated Map Tiles */}
                <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/13/5286/3427.png')] bg-cover opacity-60 mix-blend-multiply"></div>
                
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                
                {/* MAP PROJECTION CONTAINER */}
                {/* We anchor 0,0 to the center of the screen (Destination) */}
                <div className="absolute top-1/2 left-1/2 w-0 h-0">
                    
                    {/* Route Line SVG Layer */}
                    <svg className="absolute top-0 left-0 overflow-visible" style={{ transform: 'translate(0,0)' }}>
                         <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                                <path d="M0,0 L10,5 L0,10" fill="#f97316" />
                            </marker>
                         </defs>
                         {/* The route line from Agent (x,y) to Customer (0,0) */}
                         <line 
                            x1={agentOffset.x} 
                            y1={agentOffset.y} 
                            x2={0} 
                            y2={0} 
                            stroke="#f97316" 
                            strokeWidth="4" 
                            strokeDasharray="8 6"
                            strokeLinecap="round"
                            className="animate-[dash_1s_linear_infinite]"
                         />
                         {/* Shadow Line */}
                         <line 
                            x1={agentOffset.x} 
                            y1={agentOffset.y} 
                            x2={0} 
                            y2={0} 
                            stroke="rgba(0,0,0,0.1)" 
                            strokeWidth="6" 
                            className="blur-[2px]"
                         />
                    </svg>

                    {/* Customer / Destination Marker (Fixed at Center) */}
                    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group">
                        <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white relative z-20 animate-bounce">
                            <Home size={20} fill="currentColor" />
                        </div>
                        <div className="w-8 h-3 bg-black/20 rounded-[100%] blur-sm mt-[-10px] z-10"></div>
                        <div className="bg-white px-3 py-1 rounded-lg shadow-md text-[10px] font-bold text-stone-800 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-full whitespace-nowrap">
                            Delivery Location
                        </div>
                    </div>

                    {/* Moving Agent Marker */}
                    <div 
                        className="absolute z-30 flex flex-col items-center transition-transform duration-1000 ease-linear"
                        style={{ transform: `translate(${agentOffset.x}px, ${agentOffset.y}px)` }}
                    >
                        <div className="relative">
                            {/* Radar Ping */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/20 rounded-full animate-ping opacity-50"></div>
                            
                            {/* Truck Icon */}
                            <div 
                                className="w-12 h-12 bg-stone-900 rounded-xl border-4 border-white shadow-2xl flex items-center justify-center text-white relative z-20 transform transition-transform"
                                // style={{ transform: `rotate(${angle}deg)` }} // Simple rotation if needed
                            >
                                <Navigation size={20} className="text-orange-500 transform rotate-45"/>
                            </div>
                        </div>
                        
                        {/* Label */}
                        <div className="mt-2 bg-stone-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1">
                            <Truck size={10} className="text-orange-400"/>
                            {agent ? agent.name : 'Driver'}
                        </div>
                    </div>

                </div>

                {/* Live Indicator Overlay */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl text-xs font-mono border border-stone-200 z-40">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="font-bold text-stone-800 tracking-wider">LIVE TRACKING</span>
                    </div>
                    <div className="space-y-1 opacity-60">
                        <p>LAT: {agentPos.lat.toFixed(4)}</p>
                        <p>LNG: {agentPos.lng.toFixed(4)}</p>
                        <p>SPD: 32 km/h</p>
                    </div>
                </div>
            </div>

            {/* Customer Chat Modal */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md h-[500px] rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 flex flex-col">
                        <div className="bg-stone-900 text-white p-4 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 relative">
                                    <User size={20} />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-stone-800 rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Chat with {agent ? agent.name : 'Driver'}</h3>
                                    <p className="text-[10px] text-stone-400">Typically replies in 2m</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-3">
                             {messages.length === 0 && (
                                <div className="text-center text-stone-400 text-xs mt-10 bg-stone-100 py-2 rounded-full mx-10">Start the conversation regarding your order.</div>
                             )}
                             {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                        msg.sender === 'customer' 
                                        ? 'bg-stone-900 text-white rounded-tr-none' 
                                        : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                        <span className={`text-[9px] block mt-1 text-right ${msg.sender === 'customer' ? 'text-stone-400' : 'text-stone-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-stone-200 flex gap-2 shrink-0">
                             <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Message driver..."
                                className="flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm transition"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-stone-900 text-white p-3 rounded-xl hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -14;
                    }
                }
            `}</style>
        </div>
    );
};

export default Tracking;
