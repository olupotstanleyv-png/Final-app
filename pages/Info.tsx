
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, HelpCircle, MapPin, Briefcase, Phone, Info as InfoIcon, Mail, Globe, MessageCircle, Clock, Link as LinkIcon, Instagram, Facebook, Zap, Award, TrendingUp, ArrowRight, ChefHat, Star, Coffee, Timer, Linkedin, Twitter, Navigation, Wifi, Car, Accessibility, Sun, Truck, Send, CheckCircle, Wine, Calendar, FileText, Shield, Download, Search, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { getContactInfo } from '../services/menuRepository';
import { ContactInfo } from '../types';
import { ASSETS } from '../assets';

// Mock Data for Branches
const BRANCHES = [
    {
        id: 'downtown',
        name: "Stanley's Flagship",
        area: "Downtown Dubai",
        address: "Sheikh Mohammed bin Rashid Blvd, Downtown",
        phone: "+971 50 429 1207",
        hours: "9:00 AM - 11:00 PM",
        status: "Open Now",
        coordinates: { x: 55, y: 40 }, // % positions for mock map
        amenities: ["Valet Parking", "Outdoor Seating", "Wheelchair Accessible", "Free Wi-Fi"],
        image: ASSETS.backgrounds.locations.downtown,
        mapLink: "https://goo.gl/maps/downtown"
    },
    {
        id: 'marina',
        name: "Stanley's Marina",
        area: "Dubai Marina",
        address: "Marina Walk, Pier 7",
        phone: "+971 50 999 8888",
        hours: "10:00 AM - 12:00 AM",
        status: "Open Now",
        coordinates: { x: 25, y: 65 },
        amenities: ["Waterfront View", "Bar Service", "Wheelchair Accessible"],
        image: ASSETS.backgrounds.locations.marina,
        mapLink: "https://goo.gl/maps/marina"
    },
    {
        id: 'alquoz',
        name: "Stanley's Express",
        area: "Al Quoz",
        address: "Alserkal Avenue, Warehouse 4",
        phone: "+971 50 777 6666",
        hours: "8:00 AM - 10:00 PM",
        status: "Closing Soon",
        coordinates: { x: 65, y: 70 },
        amenities: ["Pickup Only", "Coffee Bar", "Free Parking"],
        image: ASSETS.backgrounds.locations.alquoz,
        mapLink: "https://goo.gl/maps/alquoz"
    }
];

const FAQ_ITEMS = [
    {
        id: '1',
        category: 'Ordering & Payment',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and Cash on Delivery. For corporate catering, bank transfers are available upon request.'
    },
    {
        id: '2',
        category: 'Ordering & Payment',
        question: 'Can I modify my order after placing it?',
        answer: 'Orders can be modified within 5 minutes of placement. Please call our support line immediately or use the "Chat with Driver" feature in the tracking page if the order is already assigned.'
    },
    {
        id: '3',
        category: 'Delivery & Pickup',
        question: 'How do I track my delivery?',
        answer: 'Once your order is approved, you will receive a tracking link via WhatsApp/SMS. You can also view the live map tracking by clicking "Track Order" in the main menu.'
    },
    {
        id: '4',
        category: 'Delivery & Pickup',
        question: 'What is your delivery radius?',
        answer: 'We deliver within a 15km radius of our Downtown and Marina branches. For Al Quoz, we currently offer pickup only.'
    },
    {
        id: '5',
        category: 'Dietary & Menu',
        question: 'Do you offer vegan or gluten-free options?',
        answer: 'Yes! Our menu features specific icons for Vegan (VG), Vegetarian (V), and Gluten-Free (GF) items. You can filter the menu by these categories.'
    },
    {
        id: '6',
        category: 'Dietary & Menu',
        question: 'Is your meat Halal certified?',
        answer: 'Yes, 100% of our meat is Halal certified and sourced from reputable local suppliers.'
    },
    {
        id: '7',
        category: 'Reservations',
        question: 'Do I need a reservation for dinner?',
        answer: 'Reservations are highly recommended for dinner service (7 PM - 10 PM) and weekends. Walk-ins are welcome but wait times may vary.'
    },
    {
        id: '8',
        category: 'Reservations',
        question: 'Can I book a private room?',
        answer: 'Absolutely. We offer private dining rooms at our Downtown and Marina locations. Please visit the "Services" page to book.'
    }
];

const Info: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const { t } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo>(getContactInfo());
  
  // Location State
  const [activeBranchId, setActiveBranchId] = useState<string>('downtown');
  const activeBranch = BRANCHES.find(b => b.id === activeBranchId) || BRANCHES[0];

  // FAQ State
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All');
  const [faqOpenId, setFaqOpenId] = useState<string | null>(null);

  const getAmenityIcon = (amenity: string) => {
      if (amenity.includes("Parking")) return <Car size={14}/>;
      if (amenity.includes("Wi-Fi")) return <Wifi size={14}/>;
      if (amenity.includes("Wheelchair")) return <Accessibility size={14}/>;
      if (amenity.includes("Outdoor") || amenity.includes("View")) return <Sun size={14}/>;
      return <CheckCircle size={14}/>;
  };

  const Footer = () => (
    <footer className="bg-stone-900 text-stone-400 pt-20 pb-10 mt-[-3rem] pt-[6rem] px-6 md:px-20 relative z-0 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-stone-800 pb-12 mb-12">
            <div className="col-span-1 md:col-span-1">
                <Link to="/" className="flex items-center gap-2 mb-6 text-white group">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-serif font-black text-xl italic shadow-lg group-hover:rotate-6 transition">S</div>
                    <span className="font-serif font-bold text-2xl">Stanley's</span>
                </Link>
                <p className="text-sm leading-relaxed mb-6">
                    Blending culinary tradition with modern technology to create the world's most seamless dining experience.
                </p>
                <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition"><Facebook size={18}/></a>
                    <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition"><Instagram size={18}/></a>
                    <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition"><Twitter size={18}/></a>
                    <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition"><Linkedin size={18}/></a>
                </div>
            </div>
            
            <div>
                <h4 className="text-white font-bold mb-6">Quick Links</h4>
                <ul className="space-y-3 text-sm">
                    <li><Link to="/" className="hover:text-orange-500 transition">Home</Link></li>
                    <li><Link to="/menu" className="hover:text-orange-500 transition">Our Menu</Link></li>
                    <li><Link to="/info/about" className="hover:text-orange-500 transition">Our Story</Link></li>
                    <li><Link to="/info/services" className="hover:text-orange-500 transition">Services</Link></li>
                    <li><Link to="/admin" className="hover:text-orange-500 transition">Admin Login</Link></li>
                </ul>
            </div>
            
            <div>
                <h4 className="text-white font-bold mb-6">Contact</h4>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <MapPin size={18} className="text-orange-500 shrink-0 mt-0.5"/>
                        <span>{contactInfo.address}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Phone size={18} className="text-orange-500 shrink-0"/>
                        <a href={`tel:${contactInfo.phone}`} className="hover:text-orange-500 transition">{contactInfo.phone}</a>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail size={18} className="text-orange-500 shrink-0"/>
                        <span>{contactInfo.email}</span>
                    </li>
                </ul>
            </div>
            
            <div>
                <h4 className="text-white font-bold mb-6">Opening Hours</h4>
                <ul className="space-y-3 text-sm">
                    <li className="flex justify-between border-b border-stone-800 pb-2">
                        <span>Weekdays</span>
                        <span className="text-white">{contactInfo.hoursWeekdays}</span>
                    </li>
                    <li className="flex justify-between border-b border-stone-800 pb-2">
                        <span>Weekends</span>
                        <span className="text-white">{contactInfo.hoursWeekends}</span>
                    </li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-stone-600">
            <p>&copy; 2024 Stanley's Restaurant. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-stone-400">Privacy Policy</a>
                <a href="#" className="hover:text-stone-400">Terms of Service</a>
                <a href="#" className="hover:text-stone-400">Cookie Settings</a>
            </div>
        </div>
    </footer>
  );

  const renderContent = () => {
    switch (section) {
      case 'about':
        return (
          <div className="w-full">
             {/* 1. HOOK AND VALUE PROPOSITION (HERO SECTION) */}
             <div className="relative h-[600px] rounded-3xl overflow-hidden mb-16 shadow-2xl">
                <img 
                    src={ASSETS.backgrounds.about_kitchen}
                    alt="Chefs working" 
                    className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition duration-[2000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 max-w-4xl">
                    <span className="text-orange-500 font-bold tracking-[0.2em] uppercase mb-4 animate-in fade-in slide-in-from-left-4 flex items-center gap-2">
                        <span className="w-8 h-0.5 bg-orange-500"></span>Our Mission
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] animate-in fade-in slide-in-from-left-4 delay-100">
                        Preserving Tradition.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">Accelerating Service.</span>
                    </h1>
                    <p className="text-xl text-stone-300 mb-10 leading-relaxed max-w-2xl animate-in fade-in slide-in-from-left-4 delay-200 font-light">
                        Fine dining shouldn't mean waiting 45 minutes for a check. We started Stanley's to solve a simple problem: how to serve Michelin-quality food at the speed of modern life.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left-4 delay-300">
                        <Link to="/menu" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
                            Experience the Speed <ArrowRight size={18}/>
                        </Link>
                         <button onClick={() => document.getElementById('origin-story')?.scrollIntoView({behavior: 'smooth'})} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition backdrop-blur-md border border-white/10">
                            Read Our Story
                        </button>
                    </div>
                </div>
             </div>

             {/* 2. ORIGIN STORY & JOURNEY (NARRATIVE ARC) */}
             <div id="origin-story" className="max-w-6xl mx-auto mb-24 px-4 scroll-mt-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">The Origin Story</h2>
                    <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
                    <div className="space-y-6 text-stone-600 text-lg leading-relaxed">
                        <p>
                            <span className="text-5xl float-left mr-3 font-serif text-stone-900 font-black leading-none mt-2">I</span>t began on a rainy Tuesday in 2023. Our founder, Chef Stanley, sat in a crowded bistro, staring at an empty plate for 45 minutes, waiting for the bill. The food had been excellent, but the memory was ruined by the logistics.
                        </p>
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6 italic text-stone-700 font-medium">
                            "That was the 'Aha!' moment. What if technology could handle the boring stuff—ordering, payments, inventory—so the hospitality team could focus entirely on warmth and culinary perfection?"
                        </div>
                        <p>
                            We started coding in a garage kitchen. We merged a Michelin-star culinary team with top-tier AI engineers. The result is <em>Stanley's</em>: A dining experience where you order via WhatsApp, get served in minutes, and eat food that tastes like home.
                        </p>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-orange-200 rounded-3xl transform rotate-3 transition-transform group-hover:rotate-6"></div>
                        <img 
                            src={ASSETS.backgrounds.hero_chef}
                            alt="The beginning" 
                            className="relative rounded-2xl shadow-xl transform -rotate-3 transition-transform group-hover:rotate-0 w-full"
                        />
                    </div>
                </div>

                {/* Visual Timeline */}
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-200 -z-10 hidden md:block"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 border border-stone-200 rounded-2xl shadow-sm text-center relative">
                            <div className="w-4 h-4 bg-orange-500 rounded-full border-4 border-white absolute top-[-10px] left-1/2 -translate-x-1/2 hidden md:block"></div>
                            <div className="text-orange-500 font-black text-4xl mb-2">2023</div>
                            <h4 className="font-bold text-stone-800 text-xl">The Concept</h4>
                            <p className="text-stone-500 mt-2">Coding the first AI Waiter prototype in a garage kitchen.</p>
                        </div>
                        <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-xl transform md:-translate-y-4 text-center relative z-10">
                             <div className="w-4 h-4 bg-stone-900 rounded-full border-4 border-orange-500 absolute top-[-10px] left-1/2 -translate-x-1/2 hidden md:block"></div>
                            <div className="text-orange-400 font-black text-4xl mb-2">2024</div>
                            <h4 className="font-bold text-xl">Grand Opening</h4>
                            <p className="text-stone-400 mt-2">Served our first 1,000 customers with zero wait time.</p>
                        </div>
                        <div className="bg-white p-8 border border-stone-200 rounded-2xl shadow-sm text-center relative">
                             <div className="w-4 h-4 bg-orange-500 rounded-full border-4 border-white absolute top-[-10px] left-1/2 -translate-x-1/2 hidden md:block"></div>
                            <div className="text-orange-500 font-black text-4xl mb-2">2025</div>
                            <h4 className="font-bold text-stone-800 text-xl">Global Vision</h4>
                            <p className="text-stone-500 mt-2">Expanding our AI kitchen technology to 10 cities worldwide.</p>
                        </div>
                    </div>
                </div>
             </div>

             {/* 3. THE HUMAN ELEMENT (TEAM & CULTURE) */}
             <div className="bg-stone-100 -mx-6 md:-mx-20 px-6 md:px-20 py-24 mb-24 skew-y-3 transform origin-top-left">
                <div className="-skew-y-3 max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-orange-600 font-bold uppercase tracking-wider text-sm">Our People</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2">More Than Just Algorithms</h2>
                        <p className="text-stone-600 mt-6 max-w-2xl mx-auto text-lg">
                            While AI powers our speed, people power our soul. Meet the minds blending binary code with béchamel sauce.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Founder 1 */}
                        <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition flex flex-col md:flex-row gap-8 items-center border border-stone-200/50">
                            <img src={ASSETS.team.chef_stanley} alt="Chef" className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-white" />
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold text-stone-900">Stanley Chef</h3>
                                <span className="text-orange-600 text-sm font-bold uppercase tracking-wide">The Taste</span>
                                <p className="text-stone-600 mt-4 italic leading-relaxed">
                                    "I wanted to cook, not manage tickets. The AI handles the chaos, I handle the flavor. Every dish tells a story."
                                </p>
                            </div>
                        </div>

                        {/* Founder 2 */}
                        <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition flex flex-col md:flex-row gap-8 items-center border border-stone-200/50">
                            <img src={ASSETS.team.elena_tech} alt="Tech Lead" className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-white" />
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold text-stone-900">Elena Tech</h3>
                                <span className="text-blue-600 text-sm font-bold uppercase tracking-wide">The Brain</span>
                                <p className="text-stone-600 mt-4 italic leading-relaxed">
                                    "We're not removing humans from hospitality; we're giving them superpowers. Our code serves the chef."
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-16 text-center">
                         <img src={ASSETS.team.kitchen_crew} alt="Team Kitchen" className="w-full h-80 object-cover rounded-3xl shadow-xl filter grayscale hover:grayscale-0 transition duration-700"/>
                         <p className="mt-4 text-stone-500 text-sm font-bold uppercase tracking-widest">Our Kitchen Team at Work</p>
                    </div>
                </div>
             </div>

             {/* 4. CREDIBILITY & SOCIAL PROOF */}
             <div className="max-w-6xl mx-auto mb-24 px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:-translate-y-2 transition duration-300">
                        <div className="flex justify-center mb-4 text-orange-500"><TrendingUp size={40}/></div>
                        <div className="text-4xl font-black text-stone-900 mb-2">50k+</div>
                        <div className="text-xs font-bold uppercase text-stone-400 tracking-wider">Orders Served</div>
                    </div>
                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:-translate-y-2 transition duration-300">
                         <div className="flex justify-center mb-4 text-orange-500"><Timer size={40}/></div>
                        <div className="text-4xl font-black text-stone-900 mb-2">12m</div>
                        <div className="text-xs font-bold uppercase text-stone-400 tracking-wider">Avg. Prep Time</div>
                    </div>
                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:-translate-y-2 transition duration-300">
                        <div className="flex justify-center mb-4 text-orange-500"><Star size={40}/></div>
                        <div className="text-4xl font-black text-stone-900 mb-2">4.9</div>
                        <div className="text-xs font-bold uppercase text-stone-400 tracking-wider">Customer Rating</div>
                    </div>
                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:-translate-y-2 transition duration-300">
                        <div className="flex justify-center mb-4 text-orange-500"><Award size={40}/></div>
                        <div className="text-4xl font-black text-stone-900 mb-2">#1</div>
                        <div className="text-xs font-bold uppercase text-stone-400 tracking-wider">Food Tech Award</div>
                    </div>
                </div>

                <div className="mt-20 bg-stone-900 text-white p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" alt="Featured Dish" className="w-24 h-24 rounded-2xl object-cover border-4 border-stone-700 shadow-lg"/>
                        <div>
                            <h4 className="font-bold text-2xl italic leading-tight mb-2">"The Best Dining Experience of 2024"</h4>
                            <p className="text-orange-400 font-bold uppercase tracking-wide text-sm">- Dubai Food Weekly</p>
                        </div>
                    </div>
                    <div className="flex gap-8 opacity-60 grayscale hover:grayscale-0 transition duration-500 relative z-10">
                        <div className="text-center font-serif font-bold text-2xl tracking-widest border border-white/30 px-4 py-2">VOGUE</div>
                        <div className="text-center font-sans font-black text-2xl tracking-tighter border border-white/30 px-4 py-2">WIRED</div>
                        <div className="text-center font-mono font-bold text-2xl border border-white/30 px-4 py-2">EATER</div>
                    </div>
                </div>
             </div>

             {/* 5. CLEAR NEXT STEP (CTA) */}
             <div className="text-center bg-gradient-to-br from-orange-50 to-white rounded-[3rem] p-12 md:p-24 border border-orange-100 mb-0 shadow-inner">
                <ChefHat size={64} className="mx-auto text-orange-500 mb-8 drop-shadow-md"/>
                <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-8 tracking-tight">Ready to Taste the Future?</h2>
                <p className="text-stone-600 max-w-xl mx-auto mb-12 text-xl leading-relaxed font-light">
                    Join thousands of happy diners who have said goodbye to waiting and hello to flavor.
                </p>
                <div className="flex flex-col md:flex-row justify-center gap-6">
                    <Link 
                        to="/menu" 
                        className="bg-stone-900 text-white px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:bg-stone-800 hover:scale-105 transition transform flex items-center justify-center gap-2"
                    >
                        View Our Menu <ArrowRight size={20}/>
                    </Link>
                    <Link 
                        to="/info/contact" 
                        className="bg-white text-stone-800 border border-stone-200 px-10 py-5 rounded-full font-bold text-lg hover:bg-stone-50 transition shadow-sm"
                    >
                        Visit Location
                    </Link>
                </div>
             </div>

             <Footer />
          </div>
        );
      
      case 'faq':
        const categories = ['All', ...Array.from(new Set(FAQ_ITEMS.map(i => i.category)))];
        const filteredFaqs = FAQ_ITEMS.filter(item => {
            const matchesSearch = item.question.toLowerCase().includes(faqSearch.toLowerCase()) || item.answer.toLowerCase().includes(faqSearch.toLowerCase());
            const matchesCategory = faqCategory === 'All' || item.category === faqCategory;
            return matchesSearch && matchesCategory;
        });

        return (
          <div className="w-full">
             {/* 1. DIAGNOSIS AND CATEGORIZATION (Structure) & 2. SEARCH & NAVIGATION */}
             <div className="text-center py-16 px-6 max-w-3xl mx-auto">
                 <h1 className="text-4xl font-bold mb-6 text-stone-900 flex items-center justify-center gap-3">
                    <HelpCircle className="text-orange-500" /> Frequently Asked Questions
                 </h1>
                 <p className="text-stone-500 mb-10 text-lg">
                    Find answers quickly about ordering, delivery, and our services.
                 </p>
                 
                 {/* Search Bar */}
                 <div className="relative max-w-xl mx-auto mb-10">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20}/>
                     <input 
                        type="text" 
                        placeholder="Search for answers (e.g. 'payment', 'vegan')"
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-full border border-stone-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-200 outline-none text-stone-700"
                     />
                 </div>

                 {/* Category Pills */}
                 <div className="flex flex-wrap justify-center gap-2 mb-8">
                     {categories.map(cat => (
                         <button
                            key={cat}
                            onClick={() => setFaqCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition border ${
                                faqCategory === cat 
                                ? 'bg-stone-900 text-white border-stone-900' 
                                : 'bg-white text-stone-600 border-stone-200 hover:border-orange-200 hover:text-orange-600'
                            }`}
                         >
                             {cat}
                         </button>
                     ))}
                 </div>
             </div>

             {/* 3. CONTENT AND CLARITY (The Answers) */}
             <div className="max-w-3xl mx-auto px-6 pb-20">
                 <div className="space-y-4">
                     {filteredFaqs.length === 0 ? (
                         <div className="text-center py-10 text-stone-400">
                             No questions found matching your search.
                         </div>
                     ) : (
                         filteredFaqs.map(item => {
                             const isOpen = faqOpenId === item.id;
                             return (
                                 <div 
                                    key={item.id} 
                                    className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                                        isOpen ? 'border-orange-200 shadow-md' : 'border-stone-100 shadow-sm hover:border-stone-200'
                                    }`}
                                 >
                                     <button 
                                        onClick={() => setFaqOpenId(isOpen ? null : item.id)}
                                        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                                     >
                                         <h3 className={`font-bold text-lg ${isOpen ? 'text-orange-600' : 'text-stone-800'}`}>
                                             {item.question}
                                         </h3>
                                         <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-orange-100 text-orange-600' : 'bg-stone-50 text-stone-400'}`}>
                                             {isOpen ? <Minus size={16}/> : <Plus size={16}/>}
                                         </div>
                                     </button>
                                     <div 
                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                     >
                                         <div className="p-6 pt-0 text-stone-600 leading-relaxed border-t border-dashed border-stone-100">
                                             {item.answer}
                                         </div>
                                     </div>
                                 </div>
                             );
                         })
                     )}
                 </div>
             </div>

             {/* 4. ESCALATION PATH (Conversion Safety Net) */}
             <div className="bg-stone-50 border-t border-stone-200 py-16 px-6">
                 <div className="max-w-4xl mx-auto text-center">
                     <h3 className="text-2xl font-bold text-stone-900 mb-4">Still can't find your answer?</h3>
                     <p className="text-stone-500 mb-8">Our support team is available 24/7 to help you.</p>
                     
                     <div className="grid md:grid-cols-3 gap-6">
                         <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition">
                             <MessageCircle size={32} className="text-blue-500 mx-auto mb-4"/>
                             <h4 className="font-bold text-stone-900 mb-2">Live Chat</h4>
                             <p className="text-xs text-stone-500 mb-4">Chat with our AI or a human agent.</p>
                             <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))} className="text-blue-600 font-bold text-sm hover:underline">Start Chat</button>
                         </div>
                         <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition">
                             <Phone size={32} className="text-green-500 mx-auto mb-4"/>
                             <h4 className="font-bold text-stone-900 mb-2">Call Us</h4>
                             <p className="text-xs text-stone-500 mb-4">Immediate support for urgent orders.</p>
                             <a href={`tel:${contactInfo.phone}`} className="text-green-600 font-bold text-sm hover:underline">{contactInfo.phone}</a>
                         </div>
                         <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition">
                             <Mail size={32} className="text-orange-500 mx-auto mb-4"/>
                             <h4 className="font-bold text-stone-900 mb-2">Email</h4>
                             <p className="text-xs text-stone-500 mb-4">For general inquiries and feedback.</p>
                             <a href={`mailto:${contactInfo.email}`} className="text-orange-600 font-bold text-sm hover:underline">Send Email</a>
                         </div>
                     </div>
                 </div>
             </div>
             
             <Footer />
          </div>
        );

      case 'contact':
        return (
            <div className="w-full">
                <div className="max-w-5xl mx-auto px-6 py-20">
                    <h1 className="text-4xl font-bold mb-10 text-center">{t('info_contact_title')}</h1>
                    
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Primary Communication Channels */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
                                <Phone className="text-green-500"/> Primary Channels
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800">Telephone Number</h4>
                                    <p className="text-sm text-stone-500 mb-1">Primary number for voice calls & reservations.</p>
                                    <a href={`tel:${contactInfo.phone}`} className="text-lg font-mono text-stone-900 font-bold hover:text-green-600 transition">{contactInfo.phone}</a>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800">Email Address</h4>
                                    <p className="text-sm text-stone-500 mb-1">Official address for inquiries.</p>
                                    <a href={`mailto:${contactInfo.email}`} className="text-lg font-mono text-stone-900 font-bold hover:text-blue-600 transition">{contactInfo.email}</a>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800">Physical Address</h4>
                                    <p className="text-sm text-stone-500 mb-1">Mailing and visiting address.</p>
                                    <p className="text-base text-stone-700">{contactInfo.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Digital & Supporting Information */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
                                <Globe className="text-blue-500"/> Digital & Supporting
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800 mb-2">Social & Messaging</h4>
                                    <div className="flex flex-wrap gap-3">
                                        <a href={contactInfo.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-100">
                                            <MessageCircle size={16}/> WhatsApp
                                        </a>
                                        <a href="#" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-100">
                                            <Facebook size={16}/> {contactInfo.facebook}
                                        </a>
                                        <a href="#" className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-pink-100">
                                            <Instagram size={16}/> {contactInfo.instagram}
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800">Website</h4>
                                    <a href={`https://${contactInfo.website}`} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-orange-500 underline decoration-dotted">{contactInfo.website}</a>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800">Hours of Operation</h4>
                                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm bg-stone-50 p-3 rounded-lg border border-stone-100">
                                        <div>
                                            <span className="block text-stone-500 text-xs uppercase font-bold">Weekdays</span>
                                            <span className="font-bold text-stone-800">{contactInfo.hoursWeekdays}</span>
                                        </div>
                                        <div>
                                            <span className="block text-stone-500 text-xs uppercase font-bold">Weekends</span>
                                            <span className="font-bold text-stone-800">{contactInfo.hoursWeekends}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location & Logistics Details */}
                    <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl mb-12">
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 border-b border-stone-700 pb-4">
                            <MapPin className="text-orange-500"/> Location & Logistics
                        </h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div>
                                <h4 className="font-bold text-stone-300 text-sm mb-2">Interactive Map</h4>
                                <p className="text-stone-400 text-sm mb-4">Guide visitors directly to our door.</p>
                                <a href={contactInfo.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-stone-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition">
                                    <LinkIcon size={14}/> Open Google Maps
                                </a>
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-300 text-sm mb-2">Logistics</h4>
                                <div className="space-y-2 text-sm text-stone-400">
                                    <p><span className="text-stone-500 font-bold">Time Zone:</span> {contactInfo.timezone}</p>
                                    <p><span className="text-stone-500 font-bold">Preferred Method:</span> {contactInfo.preferredMethod}</p>
                                </div>
                            </div>
                            <div>
                                <div className="bg-stone-800 p-4 rounded-xl border border-stone-700 h-full flex items-center justify-center text-stone-500">
                                    <MapPin size={48} className="opacity-20"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );

      case 'team':
        const teamMembers = [
            { name: 'Chef Stanley', role: 'Executive Chef', img: ASSETS.team.staff_1 },
            { name: 'Chef Elena', role: 'Sous Chef', img: ASSETS.team.staff_2 },
            { name: 'Alex', role: 'Head Server', img: ASSETS.team.staff_3 },
        ];
        return (
            <div className="max-w-5xl mx-auto px-6 py-20">
                 <h1 className="text-4xl font-bold mb-10 text-center flex items-center justify-center gap-3">
                    <Users className="text-purple-500" /> {t('info_team_title')}
                 </h1>
                 <div className="grid md:grid-cols-3 gap-8">
                    {teamMembers.map((member, i) => (
                        <div key={i} className="text-center group">
                            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-4 shadow-lg">
                                <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <h3 className="font-bold text-xl">{member.name}</h3>
                            <p className="text-stone-500 text-sm uppercase tracking-widest">{member.role}</p>
                        </div>
                    ))}
                 </div>
            </div>
        );

        case 'services':
            return (
                <div className="w-full">
                    {/* 1. HERO / HOOK SECTION */}
                    <div className="text-center py-20 px-6 max-w-4xl mx-auto">
                        <span className="text-orange-600 font-bold uppercase tracking-wider text-sm mb-4 block">Premium Services</span>
                        <h1 className="text-5xl md:text-6xl font-black text-stone-900 mb-6 leading-tight">
                            Elevate Your Dining Experience.
                        </h1>
                        <p className="text-xl text-stone-500 mb-10 leading-relaxed font-light">
                            Whether it's a corporate gala, an intimate private dinner, or a quick gourmet delivery, 
                            Stanley's combines Michelin-quality culinary art with seamless execution.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto border-t border-stone-200 pt-8">
                            <div className="flex flex-col items-center">
                                <Award className="text-orange-500 mb-2" size={24}/>
                                <span className="text-xs font-bold text-stone-800 uppercase">Michelin Rated</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Clock className="text-orange-500 mb-2" size={24}/>
                                <span className="text-xs font-bold text-stone-800 uppercase">On-Time Guarantee</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Shield className="text-orange-500 mb-2" size={24}/>
                                <span className="text-xs font-bold text-stone-800 uppercase">Quality Assured</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. CATEGORIZATION / SEGMENTATION */}
                    <div className="bg-stone-50 py-16 px-6">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-2xl font-bold text-stone-900 mb-10 text-center">Select a Service</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <button onClick={() => document.getElementById('catering')?.scrollIntoView({behavior: 'smooth'})} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition text-left border border-stone-100 group">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition">
                                        <Briefcase size={24}/>
                                    </div>
                                    <h3 className="font-bold text-lg text-stone-900">Corporate Catering</h3>
                                    <p className="text-sm text-stone-500 mt-2">Impress clients with gourmet lunch boxes and event spreads.</p>
                                </button>
                                <button onClick={() => document.getElementById('private-dining')?.scrollIntoView({behavior: 'smooth'})} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition text-left border border-stone-100 group">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
                                        <Wine size={24}/>
                                    </div>
                                    <h3 className="font-bold text-lg text-stone-900">Private Dining</h3>
                                    <p className="text-sm text-stone-500 mt-2">Exclusive rooms for intimate gatherings and celebrations.</p>
                                </button>
                                <button onClick={() => document.getElementById('delivery')?.scrollIntoView({behavior: 'smooth'})} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition text-left border border-stone-100 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition">
                                        <Truck size={24}/>
                                    </div>
                                    <h3 className="font-bold text-lg text-stone-900">Gourmet Delivery</h3>
                                    <p className="text-sm text-stone-500 mt-2">Restaurant quality food delivered to your door in 30 mins.</p>
                                </button>
                                <button onClick={() => document.getElementById('chefs-table')?.scrollIntoView({behavior: 'smooth'})} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition text-left border border-stone-100 group">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                                        <ChefHat size={24}/>
                                    </div>
                                    <h3 className="font-bold text-lg text-stone-900">Chef's Table</h3>
                                    <p className="text-sm text-stone-500 mt-2">A front-row seat to the culinary magic in our kitchen.</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. DETAILED SERVICE PRESENTATION */}
                    
                    {/* Service 1: Catering */}
                    <div id="catering" className="py-24 px-6 max-w-6xl mx-auto border-b border-stone-100 scroll-mt-12">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <span className="text-orange-600 font-bold uppercase tracking-wider text-xs mb-2 block">For Business & Events</span>
                                <h2 className="text-3xl font-black text-stone-900 mb-6">Corporate Catering</h2>
                                
                                {/* Problem / Solution */}
                                <div className="mb-8">
                                    <p className="text-stone-600 italic border-l-4 border-orange-200 pl-4 mb-4">
                                        "Tired of cold sandwiches and boring office lunches that put your team to sleep?"
                                    </p>
                                    <p className="text-stone-800 text-lg">
                                        Stanley's Catering delivers high-energy, gourmet meals that fuel productivity. From individual bento boxes to full buffet spreads, we handle everything.
                                    </p>
                                </div>

                                {/* Process */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                        <div>
                                            <h4 className="font-bold text-stone-900">Select Your Menu</h4>
                                            <p className="text-sm text-stone-500">Choose from our curated packages or customize your own.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                        <div>
                                            <h4 className="font-bold text-stone-900">AI Quantity Prediction</h4>
                                            <p className="text-sm text-stone-500">Our tool helps you order the exact right amount to minimize waste.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                                        <div>
                                            <h4 className="font-bold text-stone-900">White Glove Delivery</h4>
                                            <p className="text-sm text-stone-500">We set up, serve (optional), and clean up.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing & CTA */}
                                <div className="bg-stone-50 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div>
                                        <p className="text-sm text-stone-500">Packages start at</p>
                                        <p className="text-2xl font-bold text-stone-900">$25 <span className="text-sm font-normal text-stone-500">/ person</span></p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition">Request Quote</button>
                                        <button className="bg-white border border-stone-200 text-stone-700 px-4 py-3 rounded-xl font-bold text-sm hover:bg-stone-50 transition flex items-center gap-2"><Download size={16}/> Menu</button>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <img src="https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Catering Spread" className="rounded-3xl shadow-2xl"/>
                                {/* Social Proof Badge */}
                                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-slow">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white"></div>
                                        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white"></div>
                                        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-white"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-stone-900">Trusted by 50+ Companies</p>
                                        <div className="flex text-yellow-400 text-[10px]"><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service 2: Private Dining */}
                    <div id="private-dining" className="py-24 px-6 max-w-6xl mx-auto border-b border-stone-100 bg-stone-50 scroll-mt-12">
                         <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1 relative">
                                <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Private Dining Room" className="rounded-3xl shadow-2xl"/>
                            </div>
                            <div className="order-1 md:order-2">
                                <span className="text-purple-600 font-bold uppercase tracking-wider text-xs mb-2 block">Exclusive & Intimate</span>
                                <h2 className="text-3xl font-black text-stone-900 mb-6">Private Dining</h2>
                                
                                <div className="mb-8">
                                    <p className="text-stone-800 text-lg">
                                        Host your special occasions in our soundproof, luxury private rooms. Perfect for anniversaries, business closures, or family reunions.
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-stone-700">
                                        <CheckCircle className="text-purple-500" size={20}/> Dedicated Sommelier & Waiter
                                    </li>
                                    <li className="flex items-center gap-3 text-stone-700">
                                        <CheckCircle className="text-purple-500" size={20}/> Customizable Ambient Lighting & Music
                                    </li>
                                    <li className="flex items-center gap-3 text-stone-700">
                                        <CheckCircle className="text-purple-500" size={20}/> Custom Printed Menus
                                    </li>
                                </ul>

                                {/* CTA */}
                                <div className="flex gap-4">
                                     <button className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-purple-700 transition">Book a Room</button>
                                     <button className="text-purple-700 font-bold text-sm px-4 py-3 hover:underline">View Room Capacity</button>
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Service 3: Delivery */}
                    <div id="delivery" className="py-24 px-6 max-w-6xl mx-auto scroll-mt-12">
                        <div className="text-center max-w-3xl mx-auto">
                            <span className="text-green-600 font-bold uppercase tracking-wider text-xs mb-2 block">Fast & Fresh</span>
                            <h2 className="text-3xl font-black text-stone-900 mb-6">Gourmet Delivery</h2>
                            <p className="text-stone-600 mb-10 text-lg">
                                We use proprietary packaging technology to ensure your food arrives as hot and plated as it would be in our restaurant.
                            </p>
                            
                            <div className="grid md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                    <Clock className="mx-auto text-green-500 mb-3" size={32}/>
                                    <h4 className="font-bold text-stone-900 mb-2">30-Min Promise</h4>
                                    <p className="text-xs text-stone-500">If we're late, your next meal is on us.</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                    <MapPin className="mx-auto text-green-500 mb-3" size={32}/>
                                    <h4 className="font-bold text-stone-900 mb-2">Live Tracking</h4>
                                    <p className="text-xs text-stone-500">Watch your driver in real-time on our map.</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                    <Shield className="mx-auto text-green-500 mb-3" size={32}/>
                                    <h4 className="font-bold text-stone-900 mb-2">Tamper Proof</h4>
                                    <p className="text-xs text-stone-500">Secure seals on every bag for safety.</p>
                                </div>
                            </div>

                            <Link to="/menu" className="inline-flex items-center gap-2 bg-green-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-green-700 transition hover:-translate-y-1">
                                Order Now <ArrowRight size={20}/>
                            </Link>
                        </div>
                    </div>

                    <Footer />
                </div>
            );

      case 'location':
        return (
            <div className="w-full">
                <div className="max-w-7xl mx-auto px-6 py-20">
                     {/* 1. HOOK: IMMEDIATE IDENTIFICATION */}
                     <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-4">
                         <div>
                             <h1 className="text-4xl font-black text-stone-900 mb-2 flex items-center gap-3">
                                 <MapPin className="text-orange-600" size={32} /> Find Your Nearest Stanley's
                             </h1>
                             <p className="text-stone-500 max-w-xl">
                                 Locate our branches across the city. Experience our hospitality in person or pick up your order.
                             </p>
                         </div>
                         <button className="mt-4 md:mt-0 bg-stone-900 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-stone-800 transition shadow-lg">
                             <Navigation size={16} /> Use My Location
                         </button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
                         {/* 2. BRANCH LISTINGS (SIDEBAR) */}
                         <div className="lg:col-span-1 space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                             {BRANCHES.map(branch => (
                                 <div 
                                    key={branch.id}
                                    onClick={() => setActiveBranchId(branch.id)}
                                    className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                                        activeBranchId === branch.id 
                                        ? 'bg-stone-900 text-white shadow-xl scale-[1.02]' 
                                        : 'bg-white border-stone-200 hover:border-orange-200 hover:shadow-md'
                                    }`}
                                 >
                                     <div className="flex justify-between items-start mb-3">
                                         <h3 className={`font-bold text-lg ${activeBranchId === branch.id ? 'text-white' : 'text-stone-800'}`}>{branch.name}</h3>
                                         <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                             activeBranchId === branch.id ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                                         }`}>
                                             {branch.status}
                                         </span>
                                     </div>
                                     <p className={`text-sm mb-4 ${activeBranchId === branch.id ? 'text-stone-400' : 'text-stone-500'}`}>
                                         {branch.address}
                                     </p>
                                     <div className="space-y-2 text-sm">
                                         <div className="flex items-center gap-2">
                                             <Phone size={14} className={activeBranchId === branch.id ? 'text-orange-500' : 'text-stone-400'}/>
                                             <a href={`tel:${branch.phone}`} className="hover:underline">{branch.phone}</a>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <Clock size={14} className={activeBranchId === branch.id ? 'text-orange-500' : 'text-stone-400'}/>
                                             <span>{branch.hours}</span>
                                         </div>
                                     </div>
                                     {activeBranchId === branch.id && (
                                         <div className="mt-6 pt-4 border-t border-stone-800 flex gap-2 animate-in fade-in">
                                             <a href={branch.mapLink} target="_blank" rel="noreferrer" className="flex-1 bg-white text-stone-900 py-2 rounded-lg text-center text-xs font-bold hover:bg-stone-200 transition">Get Directions</a>
                                             <a href={`tel:${branch.phone}`} className="flex-1 bg-stone-800 text-white py-2 rounded-lg text-center text-xs font-bold hover:bg-stone-700 transition">Call Now</a>
                                         </div>
                                     )}
                                 </div>
                             ))}
                         </div>

                         {/* 1. MAP VISUALIZATION & 3. OPERATIONAL DETAILS */}
                         <div className="lg:col-span-2 space-y-6">
                             {/* Interactive Map Area */}
                             <div className="h-[400px] bg-stone-200 rounded-3xl overflow-hidden relative shadow-inner border border-stone-200 group">
                                 {/* Static Map Image Background */}
                                 <div 
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                    style={{ backgroundImage: ASSETS.backgrounds.map_pattern ? `url('${ASSETS.backgrounds.map_pattern}')` : undefined }} 
                                 />
                                 <div className="absolute inset-0 bg-stone-900/5 pointer-events-none"></div>

                                 {/* Branch Pins */}
                                 {BRANCHES.map(branch => (
                                     <button
                                        key={branch.id}
                                        onClick={() => setActiveBranchId(branch.id)}
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                                            activeBranchId === branch.id ? 'z-20 scale-110' : 'z-10 opacity-80 hover:opacity-100'
                                        }`}
                                        style={{ left: `${branch.coordinates.x}%`, top: `${branch.coordinates.y}%` }}
                                     >
                                         <div className={`relative flex flex-col items-center`}>
                                             <div className={`w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center ${
                                                 activeBranchId === branch.id ? 'bg-orange-600 text-white' : 'bg-stone-900 text-white'
                                             }`}>
                                                 <ChefHat size={20} />
                                             </div>
                                             <div className={`mt-2 px-3 py-1 rounded-lg shadow-md text-xs font-bold whitespace-nowrap ${
                                                  activeBranchId === branch.id ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                                             }`}>
                                                 {branch.name}
                                             </div>
                                             {/* Pulse Effect for Active */}
                                             {activeBranchId === branch.id && (
                                                 <div className="absolute top-0 left-0 w-12 h-12 bg-orange-500 rounded-full animate-ping -z-10 opacity-50"></div>
                                             )}
                                         </div>
                                     </button>
                                 ))}
                             </div>

                             {/* Branch Details Panel */}
                             <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 animate-in slide-in-from-bottom-4">
                                 <div className="flex flex-col md:flex-row gap-8">
                                     <div className="flex-1">
                                         <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                                             {activeBranch.name} <span className="text-stone-300">/</span> <span className="text-orange-600 text-lg">{activeBranch.area}</span>
                                         </h2>
                                         <p className="text-stone-500 mb-6 text-sm leading-relaxed">
                                             Experience our signature dining in the heart of {activeBranch.area}. 
                                             Perfect for family gatherings or quick business lunches.
                                         </p>
                                         
                                         <h3 className="font-bold text-xs uppercase text-stone-400 mb-3 tracking-wider">Amenities & Features</h3>
                                         <div className="grid grid-cols-2 gap-3 mb-6">
                                             {activeBranch.amenities.map(amenity => (
                                                 <div key={amenity} className="flex items-center gap-2 text-sm text-stone-700 bg-stone-50 p-2 rounded-lg">
                                                     <span className="text-orange-500">{getAmenityIcon(amenity)}</span>
                                                     {amenity}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                     <div className="w-full md:w-64 h-48 shrink-0 rounded-2xl overflow-hidden shadow-md relative group">
                                         <img src={activeBranch.image} alt="Branch Interior" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* 4. NON-PHYSICAL CONTACT & 5. CONVERSION GOAL */}
                     <div className="bg-stone-900 rounded-[3rem] p-12 text-white relative overflow-hidden mb-12">
                         <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                         
                         <div className="grid md:grid-cols-2 gap-16 relative z-10">
                             {/* Fallback Form */}
                             <div>
                                 <h3 className="text-2xl font-bold mb-4">Not sure which branch to visit?</h3>
                                 <p className="text-stone-400 mb-8">Send us a message and our concierge team will guide you.</p>
                                 <div className="space-y-4">
                                     <input type="text" placeholder="Your Name" className="w-full bg-stone-800 border border-stone-700 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500 transition"/>
                                     <input type="email" placeholder="Email Address" className="w-full bg-stone-800 border border-stone-700 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500 transition"/>
                                     <button className="w-full bg-white text-stone-900 font-bold py-4 rounded-xl hover:bg-stone-200 transition flex items-center justify-center gap-2">
                                         <Send size={18}/> Send Message
                                     </button>
                                 </div>
                             </div>

                             {/* Conversion CTA */}
                             <div className="flex flex-col justify-center items-center text-center border-l border-stone-800 pl-0 md:pl-16">
                                 <Truck size={64} className="text-orange-500 mb-6"/>
                                 <h2 className="text-4xl font-black mb-4">Can't make it to us?</h2>
                                 <p className="text-stone-300 mb-8 text-lg">
                                     We bring the Michelin experience to your dining table. Fast, fresh, and flawless.
                                 </p>
                                 <Link to="/menu" className="bg-orange-600 text-white px-10 py-5 rounded-full font-bold text-xl shadow-lg hover:bg-orange-700 hover:scale-105 transition transform w-full md:w-auto">
                                     Order Delivery Now
                                 </Link>
                             </div>
                         </div>
                     </div>
                </div>
                <Footer />
            </div>
        );

      default:
        return <div className="text-center py-20">Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-6">
      {renderContent()}
    </div>
  );
};

export default Info;
