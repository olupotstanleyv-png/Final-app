
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, MessageCircle, Clock, Calendar, ShoppingBag, Utensils, Star, ShieldCheck, Heart, Award, Quote, ChevronRight, Phone, Facebook, Instagram, Twitter, Linkedin, MapPin, Mail, CreditCard, Navigation } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// 3 Specific High Quality Slides
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", // Restaurant Interior / Atmosphere
  "https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", // Chef Action / Kitchen
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"  // Plated Food / Culinary
];

const Home: React.FC = () => {
  const { t } = useLanguage();
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Hero Section - Light Blue Theme */}
      <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-sky-50">
        
        {/* Background Slider - Low Opacity to blend with light theme */}
        {BACKGROUND_IMAGES.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${
              index === bgIndex ? 'opacity-30' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}

        {/* Light Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/80 via-sky-50/50 to-sky-50/90 z-10"></div>
        
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center mt-10">
          
          {/* Headline: Clear Value Prop */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 delay-100 text-slate-900">
             {t('hero_headline_prefix')} <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-sky-500 to-teal-400">{t('hero_headline_highlight')}</span>
          </h1>

          {/* Subheadline: Why Buy? */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-6 delay-200">
             {t('hero_description')}
          </p>
          
          {/* Scannable Key Benefits */}
          <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-10 delay-500">
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:border-blue-500/50 transition-colors">
                     <ChefHat size={24} className="text-blue-600" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-slate-800">{t('benefit_chef')}</h3>
                 <p className="text-xs text-slate-500 mt-1 hidden md:block">{t('benefit_chef_desc')}</p>
              </div>
              
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:border-green-500/50 transition-colors">
                     <Clock size={24} className="text-green-600" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-slate-800">{t('benefit_instant')}</h3>
                 <p className="text-xs text-slate-500 mt-1 hidden md:block">{t('benefit_instant_desc')}</p>
              </div>
              
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:border-purple-500/50 transition-colors">
                     <ShieldCheck size={24} className="text-purple-600" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-slate-800">{t('benefit_secure')}</h3>
                 <p className="text-xs text-slate-500 mt-1 hidden md:block">{t('benefit_secure_desc')}</p>
              </div>
          </div>
        </div>
      </div>

      {/* Features Grid - More Clean & Minimal */}
      <div className="py-24 bg-white relative z-20">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{t('tech_title')}</h2>
                <p className="text-stone-500 max-w-2xl mx-auto">{t('tech_desc')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-xl transition-all duration-300 group flex flex-col items-start text-left">
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                        <MessageCircle size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-stone-800">{t('feature_chat_title')}</h3>
                    <p className="text-stone-500 leading-relaxed text-sm mb-4">{t('feature_chat_desc')}</p>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))}
                        className="mt-auto text-orange-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        Try AI Chat <ArrowRight size={16}/>
                    </button>
                </div>
                
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-xl transition-all duration-300 group flex flex-col items-start text-left">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                        <ChefHat size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-stone-800">{t('feature_menu_title')}</h3>
                    <p className="text-stone-500 leading-relaxed text-sm mb-4">{t('feature_menu_desc')}</p>
                    <Link to="/menu" className="mt-auto text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">Browse Menu <ArrowRight size={16}/></Link>
                </div>
            </div>
        </div>
      </div>

      {/* Social Proof / Testimonials */}
      <div className="bg-stone-50 py-24 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">{t('testimonials_title')}</h2>
                <p className="text-stone-500">{t('testimonials_subtitle')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { name: "Sarah Jenkins", role: "Food Critic", comment: "The fusion of tech and taste is incredible. The Wagyu Burger is a masterpiece.", rating: 5 },
                    { name: "Michael Chen", role: "Verified Buyer", comment: "Ordering via WhatsApp was so smooth. The food arrived hot and fresh.", rating: 5 },
                    { name: "Emma Wilson", role: "Regular Guest", comment: "Stanley's never disappoints. The AI suggestions were actually spot on!", rating: 4 }
                ].map((review, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 relative hover:shadow-md transition duration-300 hover:-translate-y-1">
                        <Quote size={40} className="absolute top-6 right-6 text-orange-100" />
                        <div className="flex items-center gap-1 mb-4 text-yellow-400">
                            {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={16} fill={idx < review.rating ? "currentColor" : "none"} className={idx < review.rating ? "" : "text-stone-200"} />
                            ))}
                        </div>
                        <p className="text-stone-600 mb-6 italic leading-relaxed">"{review.comment}"</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-stone-200 to-stone-300 rounded-full flex items-center justify-center font-bold text-stone-600">
                                {review.name[0]}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-stone-900">{review.name}</h4>
                                <p className="text-xs text-stone-400">{review.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0">
                <div className="flex items-center gap-3">
                    <Award size={28} className="text-stone-800"/>
                    <div className="text-left">
                        <span className="block font-bold text-stone-700 text-sm">Top Rated</span>
                        <span className="text-[10px] text-stone-500">2024 Excellence</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ShieldCheck size={28} className="text-stone-800"/>
                     <div className="text-left">
                        <span className="block font-bold text-stone-700 text-sm">Secure</span>
                        <span className="text-[10px] text-stone-500">SSL Encrypted</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Heart size={28} className="text-stone-800"/>
                     <div className="text-left">
                        <span className="block font-bold text-stone-700 text-sm">Local</span>
                        <span className="text-[10px] text-stone-500">Farm Sourced</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Operating Hours Section */}
      <div className="bg-white py-24 border-t border-stone-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <h2 className="text-3xl font-bold text-stone-800 mb-12 tracking-tight">{t('operating_title')}</h2>
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-stone-50 p-10 rounded-3xl shadow-sm hover:shadow-xl transition duration-300 flex flex-col items-center border border-stone-200/50">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mb-6 transform rotate-3">
                    <Clock size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-1">Weekdays</h3>
                  <p className="text-stone-500">{t('operating_week')}</p>
              </div>
              <div className="bg-stone-50 p-10 rounded-3xl shadow-sm hover:shadow-xl transition duration-300 flex flex-col items-center border border-stone-200/50">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mb-6 transform -rotate-3">
                    <Calendar size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-1">Weekends</h3>
                  <p className="text-stone-500">{t('operating_weekend')}</p>
              </div>
           </div>
           <div className="mt-12 inline-block px-8 py-4 bg-white rounded-full border border-stone-200 text-stone-500 italic shadow-sm text-sm">
              {t('reservation_note')}
           </div>
        </div>
      </div>

      {/* COMPREHENSIVE FOOTER */}
      <footer className="bg-stone-950 text-stone-400 py-16 border-t border-stone-900">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                  {/* Column 1: Brand & Lead Capture */}
                  <div className="space-y-6">
                      <Link to="/" className="flex items-center gap-2 text-white group w-fit">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-serif font-black text-xl italic shadow-lg group-hover:rotate-6 transition duration-300">S</div>
                          <div className="flex flex-col">
                            <span className="font-serif font-bold text-2xl leading-none">Stanley's</span>
                            <span className="text-[10px] uppercase tracking-widest text-stone-500">Fine Dining</span>
                          </div>
                      </Link>
                      <p className="text-sm leading-relaxed text-stone-500">
                          Blending culinary tradition with modern AI technology to create the world's most seamless dining experience.
                      </p>
                      
                      {/* Newsletter Sign-up */}
                      <div>
                          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Join our Newsletter</h4>
                          <div className="flex gap-2">
                              <input 
                                type="email" 
                                placeholder="Your email..." 
                                className="bg-stone-900 border border-stone-800 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-orange-600 transition"
                              />
                              <button className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition">
                                  <ArrowRight size={18}/>
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Column 2: Navigation Links */}
                  <div>
                      <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Navigation size={16} className="text-orange-600"/> Quick Links</h4>
                      <ul className="space-y-3 text-sm">
                          <li><Link to="/" className="hover:text-orange-500 transition flex items-center gap-2"><ChevronRight size={12}/> Home</Link></li>
                          <li><Link to="/menu" className="hover:text-orange-500 transition flex items-center gap-2"><ChevronRight size={12}/> Our Menu</Link></li>
                          <li><Link to="/info/about" className="hover:text-orange-500 transition flex items-center gap-2"><ChevronRight size={12}/> Our Story</Link></li>
                          <li><Link to="/info/services" className="hover:text-orange-500 transition flex items-center gap-2"><ChevronRight size={12}/> Services</Link></li>
                          <li><Link to="/info/location" className="hover:text-orange-500 transition flex items-center gap-2"><ChevronRight size={12}/> Locations</Link></li>
                      </ul>
                  </div>

                  {/* Column 3: Customer Support */}
                  <div>
                      <h4 className="text-white font-bold mb-6 flex items-center gap-2"><ShieldCheck size={16} className="text-orange-600"/> Support</h4>
                      <ul className="space-y-3 text-sm">
                          <li><Link to="/info/faq" className="hover:text-orange-500 transition">FAQ & Help Center</Link></li>
                          <li><Link to="/info/contact" className="hover:text-orange-500 transition">Contact Us</Link></li>
                          <li><a href="#" className="hover:text-orange-500 transition">Shipping Policy</a></li>
                          <li><a href="#" className="hover:text-orange-500 transition">Returns & Refunds</a></li>
                          <li><a href="#" className="hover:text-orange-500 transition">Terms of Service</a></li>
                          <li><a href="#" className="hover:text-orange-500 transition">Privacy Policy</a></li>
                      </ul>
                  </div>

                  {/* Column 4: Contact & Location */}
                  <div>
                      <h4 className="text-white font-bold mb-6 flex items-center gap-2"><MapPin size={16} className="text-orange-600"/> Find Us</h4>
                      <ul className="space-y-4 text-sm">
                          <li className="flex items-start gap-3">
                              <MapPin size={18} className="text-stone-600 shrink-0 mt-0.5"/>
                              <span>Sheikh Mohammed bin Rashid Blvd,<br/>Downtown Dubai, UAE</span>
                          </li>
                          <li className="flex items-center gap-3">
                              <Phone size={18} className="text-stone-600 shrink-0"/>
                              <a href="tel:+971504291207" className="hover:text-orange-500 transition">+971 50 429 1207</a>
                          </li>
                          <li className="flex items-center gap-3">
                              <Mail size={18} className="text-stone-600 shrink-0"/>
                              <a href="mailto:support@stanleys.com" className="hover:text-orange-500 transition">support@stanleys.com</a>
                          </li>
                          <li className="pt-4">
                              <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 hover:text-orange-500 border border-orange-900 bg-orange-900/10 px-4 py-2 rounded-full transition">
                                  <MapPin size={12}/> View on Map
                              </a>
                          </li>
                      </ul>
                  </div>
              </div>

              {/* Bottom Bar: Trust & Legal */}
              <div className="border-t border-stone-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  {/* Copyright */}
                  <div className="text-xs text-stone-600">
                      &copy; 2025 Stanley's Restaurant. All Rights Reserved.
                  </div>

                  {/* Social Media */}
                  <div className="flex gap-4">
                      <a href="#" className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:text-white transition"><Facebook size={14}/></a>
                      <a href="#" className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:text-white transition"><Instagram size={14}/></a>
                      <a href="#" className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:text-white transition"><Twitter size={14}/></a>
                      <a href="#" className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:text-white transition"><Linkedin size={14}/></a>
                  </div>

                  {/* Payment Methods */}
                  <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition duration-300">
                      <div className="flex items-center gap-1 text-xs font-bold text-stone-500"><CreditCard size={14}/> Secure Payment</div>
                      {/* Simple visual representation of cards */}
                      <div className="w-8 h-5 bg-stone-800 rounded"></div>
                      <div className="w-8 h-5 bg-stone-800 rounded"></div>
                      <div className="w-8 h-5 bg-stone-800 rounded"></div>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default Home;
