
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, CheckCircle, Package, Navigation, Clock, RefreshCw, Camera, PenTool, X, ShieldCheck, Box, MessageCircle, Send, User } from 'lucide-react';
import { Order, DeliveryAgent, ProofOfDelivery, OrderMessage } from '../types';
import { fetchOrders, fetchAgents, updateOrderStatus, saveAgent, fetchOrderMessages, sendOrderMessage } from '../services/menuRepository';

const AgentPortal: React.FC = () => {
    const { agentId } = useParams<{ agentId: string }>();
    const [agent, setAgent] = useState<DeliveryAgent | null>(null);
    const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    
    // POD Modal State
    const [showPOD, setShowPOD] = useState<string | null>(null);
    const [podType, setPodType] = useState<'code' | 'photo'>('code');
    const [verifyCode, setVerifyCode] = useState('');
    const [photoFile, setPhotoFile] = useState<string | null>(null);

    // Chat Modal State
    const [chatOrderId, setChatOrderId] = useState<string | null>(null);
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        if (!agentId) return;
        setLoading(true);
        const agents = fetchAgents();
        const currentAgent = agents.find(a => a.id === agentId);
        
        if (currentAgent) {
            setAgent(currentAgent);
            const allOrders = await fetchOrders();
            // Filter for orders assigned to this agent that are active or completed today
            const myOrders = allOrders.filter(o => 
                o.deliveryAgentId === agentId && 
                o.status !== 'cancelled' &&
                ['ready_for_logistics', 'picking', 'packing', 'picked_up', 'on_way', 'delivered', 'completed'].includes(o.deliveryStatus || '')
            );
            setAssignedOrders(myOrders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [agentId]);

    // Chat polling when modal open
    useEffect(() => {
        if (!chatOrderId) return;
        const poll = () => {
            setMessages(fetchOrderMessages(chatOrderId));
        };
        poll();
        const interval = setInterval(poll, 3000);
        return () => clearInterval(interval);
    }, [chatOrderId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!chatOrderId || !newMessage.trim()) return;
        sendOrderMessage(chatOrderId, newMessage, 'agent');
        setNewMessage('');
        setMessages(fetchOrderMessages(chatOrderId));
    };

    const handleStatusUpdate = async (orderId: string, newDeliveryStatus: string) => {
        await updateOrderStatus(orderId, 'approved', agentId, newDeliveryStatus);
        await loadData();
    };

    const handleCompleteDelivery = async (orderId: string) => {
        const order = assignedOrders.find(o => o.id === orderId);
        if (!order) return;

        let podData: ProofOfDelivery | null = null;

        if (podType === 'code') {
            if (verifyCode !== order.deliveryCode) {
                alert("Incorrect Verification Code!");
                return;
            }
            podData = { type: 'code', data: 'Verified via PIN', timestamp: new Date().toISOString() };
        } else {
             if (!photoFile) {
                 alert("Please upload a photo.");
                 return;
             }
             podData = { type: 'photo', data: photoFile, timestamp: new Date().toISOString() };
        }

        // Mark as delivered AND completed
        await updateOrderStatus(orderId, 'completed', agentId, 'delivered', podData);
        
        // Reset Modal
        setShowPOD(null);
        setVerifyCode('');
        setPhotoFile(null);
        
        // Refresh
        await loadData();
        alert("Delivery Completed Successfully!");
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoFile(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading && !agent) return <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-white"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div><p>Connecting to Fleet Network...</p></div>;
    if (!agent) return <div className="min-h-screen flex items-center justify-center bg-stone-100 p-6 text-center font-bold text-stone-500">Agent Access Denied.</div>;

    return (
        <div className="min-h-screen bg-stone-100 font-sans pb-20">
            {/* Header */}
            <header className="bg-stone-900 text-white p-5 sticky top-0 z-20 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-xl flex items-center gap-2 tracking-tight">
                            <Navigation size={20} className="text-orange-500"/> FLEET<span className="text-orange-500">GO</span>
                        </h1>
                        <p className="text-xs text-stone-400 mt-0.5">Driver: {agent.name}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-stone-800 px-3 py-1.5 rounded-full border border-stone-700">
                        <div className={`w-2.5 h-2.5 rounded-full ${agent.status === 'available' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : agent.status === 'on_break' ? 'bg-yellow-400' : 'bg-orange-400'}`}></div>
                        <span className="text-xs font-bold uppercase tracking-wide">{agent.status.replace('_', ' ')}</span>
                    </div>
                </div>
            </header>

            <div className="p-4 max-w-md mx-auto space-y-6">
                {/* Status Bar */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-stone-200">
                     <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Active Tasks</p>
                        <p className="text-2xl font-bold text-stone-900">{assignedOrders.filter(o => o.deliveryStatus !== 'delivered').length}</p>
                     </div>
                     <button onClick={loadData} className="bg-stone-100 p-3 rounded-full hover:bg-stone-200 transition"><RefreshCw size={18} className="text-stone-600"/></button>
                </div>

                {/* Order List */}
                <div className="space-y-4">
                    {assignedOrders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <Package size={64} className="opacity-20 mb-4"/>
                            <p className="text-sm font-bold">No active assignments.</p>
                            <p className="text-xs">You are currently {agent.status.replace('_', ' ')}.</p>
                        </div>
                    )}

                    {assignedOrders.map(order => {
                        const isDelivered = order.deliveryStatus === 'delivered';
                        
                        // State Logic
                        const isNew = order.deliveryStatus === 'ready_for_logistics';
                        const isPicking = order.deliveryStatus === 'picking';
                        const isPickedUp = order.deliveryStatus === 'picked_up' || order.deliveryStatus === 'packing';
                        const isOnWay = order.deliveryStatus === 'on_way';

                        return (
                            <div key={order.id} className={`bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden transition-all duration-300 ${isDelivered ? 'opacity-60 grayscale' : 'ring-1 ring-stone-200'}`}>
                                
                                {/* Card Header */}
                                <div className={`px-5 py-4 border-b border-stone-100 flex justify-between items-center ${isNew ? 'bg-orange-50' : isOnWay ? 'bg-blue-50' : 'bg-white'}`}>
                                    <div>
                                        <span className="text-xs font-bold text-stone-500 block mb-0.5">ORDER ID</span>
                                        <span className="font-mono font-bold text-stone-900">#{order.id.slice(-6)}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                        isNew ? 'bg-orange-100 text-orange-700' : 
                                        isOnWay ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                        isDelivered ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                                    }`}>
                                        {order.deliveryStatus?.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                <div className="p-5">
                                    {/* Customer Details Section */}
                                    <div className="bg-stone-50 rounded-xl p-3 mb-4 border border-stone-100">
                                        <h4 className="text-xs font-bold text-stone-400 uppercase mb-2 flex items-center gap-1"><User size={12}/> Customer Details</h4>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-stone-800 text-sm">{order.customerName}</p>
                                                <p className="text-xs text-stone-500">{order.phoneNumber}</p>
                                            </div>
                                            <a href={`tel:${order.phoneNumber}`} className="bg-white border border-stone-200 p-2 rounded-full text-stone-600 hover:text-green-600"><Phone size={14}/></a>
                                        </div>
                                        <div className="text-xs text-stone-600 border-t border-stone-200 pt-2 mt-2">
                                            <span className="font-bold">Items:</span> {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </div>
                                    </div>

                                    {/* Route Info */}
                                    <div className="flex flex-col gap-4 mb-6 relative">
                                        {/* Connector Line */}
                                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-stone-200"></div>
                                        
                                        <div className="flex gap-3 items-start relative z-10">
                                            <div className="w-4 h-4 rounded-full bg-stone-900 border-2 border-white shadow-sm mt-1"></div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-500 uppercase">Pickup</p>
                                                <p className="font-bold text-stone-800 text-sm">Stanley's Restaurant HQ</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 items-start relative z-10">
                                            <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm mt-1"></div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-500 uppercase">Dropoff</p>
                                                <p className="font-bold text-stone-800 text-sm">{order.deliveryAddress || "Client Location"}</p>
                                                <div className="flex gap-4 mt-2">
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || '')}`} target="_blank" className="flex items-center gap-1 text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded hover:bg-stone-200"><Navigation size={12}/> Map</a>
                                                    {/* Chat Trigger */}
                                                    <button 
                                                        onClick={() => setChatOrderId(order.id)}
                                                        className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                                                    >
                                                        <MessageCircle size={12}/> Chat Customer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Area */}
                                    {!isDelivered && (
                                        <div className="pt-4 border-t border-stone-100">
                                            {isNew && (
                                                <button onClick={() => handleStatusUpdate(order.id, 'picking')} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                                    <Box size={18}/> Accept & Start Picking
                                                </button>
                                            )}
                                            
                                            {isPicking && (
                                                <button onClick={() => handleStatusUpdate(order.id, 'picked_up')} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                                    <CheckCircle size={18}/> Confirm Items Picked
                                                </button>
                                            )}

                                            {isPickedUp && (
                                                <button onClick={() => handleStatusUpdate(order.id, 'on_way')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                                    <Navigation size={18}/> Start Route
                                                </button>
                                            )}

                                            {isOnWay && (
                                                <button onClick={() => setShowPOD(order.id)} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                                    <ShieldCheck size={18}/> Arrived & Verify
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    
                                    {isDelivered && (
                                        <div className="text-center py-2 bg-green-50 rounded-lg border border-green-100">
                                            <p className="text-green-700 font-bold text-xs flex items-center justify-center gap-2">
                                                <CheckCircle size={14}/> Completed Successfully
                                            </p>
                                            <p className="text-[10px] text-green-600 mt-1">
                                                {order.proofOfDelivery?.type === 'code' ? 'Verified via Code' : 'Photo Proof Uploaded'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CHAT MODAL */}
            {chatOrderId && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md h-[500px] rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 flex flex-col">
                        <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold flex items-center gap-2"><MessageCircle size={20}/> Customer Chat</h3>
                            <button onClick={() => setChatOrderId(null)}><X size={24} className="text-blue-200 hover:text-white"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 bg-stone-100 space-y-3">
                             {messages.length === 0 && (
                                <div className="text-center text-stone-400 text-sm mt-10">Start conversation...</div>
                             )}
                             {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${
                                        msg.sender === 'agent' 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                        <span className={`text-[10px] block mt-1 text-right opacity-70`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-stone-200 flex gap-2 shrink-0">
                             <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <button 
                                onClick={handleSendMessage}
                                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"
                            >
                                <Send size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROOF OF DELIVERY MODAL */}
            {showPOD && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
                        <div className="bg-stone-900 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-green-400"/> Proof of Delivery</h3>
                            <button onClick={() => setShowPOD(null)}><X size={24} className="text-stone-400 hover:text-white"/></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <p className="text-sm text-stone-600 text-center">Complete the delivery by verifying with the customer.</p>
                            
                            <div className="flex bg-stone-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setPodType('code')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${podType === 'code' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}
                                >
                                    Verify Code
                                </button>
                                <button 
                                    onClick={() => setPodType('photo')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${podType === 'photo' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}
                                >
                                    Take Photo
                                </button>
                            </div>

                            {podType === 'code' && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-stone-400 uppercase mb-2">Ask Customer for 4-Digit PIN</p>
                                        <input 
                                            type="text" 
                                            maxLength={4}
                                            placeholder="0 0 0 0"
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value)}
                                            className="w-full text-center text-3xl font-mono font-bold tracking-[1em] py-4 border-b-2 border-stone-300 focus:border-stone-900 outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}

                            {podType === 'photo' && (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center hover:bg-stone-50 transition relative">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            onChange={handlePhotoUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {photoFile ? (
                                            <img src={photoFile} alt="POD" className="max-h-48 mx-auto rounded-lg shadow-sm"/>
                                        ) : (
                                            <div className="flex flex-col items-center text-stone-400">
                                                <Camera size={48} className="mb-2"/>
                                                <span className="font-bold text-sm">Tap to Capture</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => handleCompleteDelivery(showPOD)}
                                disabled={podType === 'code' ? verifyCode.length !== 4 : !photoFile}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={24}/> Complete Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentPortal;