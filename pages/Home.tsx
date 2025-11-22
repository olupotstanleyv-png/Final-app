
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, MessageCircle, Smartphone, Clock, Calendar, ShoppingBag, Utensils, Star, ShieldCheck, Heart, Award, Quote, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// 3 Specific High Quality Slides
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", // Dark Moody Plating
  "https://images.unsplash.com/photo-1504754524776-3f4f30440be4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", // Vibrant Table Spread
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"  // Chef Action
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
      {/* Hero Section - Refined for Value Proposition & Aesthetics */}
      <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-stone-900">
        
        {/* Background Slider */}
        {BACKGROUND_IMAGES.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out transform ${
              index === bgIndex ? 'opacity-60 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}

        {/* Gradient Overlay for Text Contrast (Dark Mode) */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/90 via-stone-900/40 to-stone-900/90 z-10"></div>
        
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center text-white mt-10">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 shadow-lg">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
             <span className="text-xs font-bold tracking-widest uppercase text-stone-200">AI-Powered Dining Experience</span>
          </div>

          {/* Headline: Clear Value Prop */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 delay-100 drop-shadow-2xl">
             The Future of <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-orange-300 to-amber-200">Fine Dining.</span>
          </h1>

          {/* Subheadline: Why Buy? */}
          <p className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-6 delay-200 drop-shadow-md">
             Stanley's combines <strong>Michelin-star culinary artistry</strong> with seamless <strong>AI service</strong>. 
             Order instantly via WhatsApp or our Web App and experience the perfect blend of tradition and technology.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-8 delay-300 w-full sm:w-auto">
            <Link 
                to="/menu" 
                className="group w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2"
            >
               <span>Start Order</span>
               <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            
            <Link 
                to="/info/about" 
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 text-white hover:border-white/40"
            >
              <span>Our Story</span>
            </Link>
          </div>

          {/* Scannable Key Benefits */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-3 gap-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-10 delay-500">
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-stone-800/50 rounded-2xl border border-white/10 group-hover:border-orange-500/50 transition-colors backdrop-blur-sm">
                     <ChefHat size={24} className="text-orange-400" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-white">Chef Curated</h3>
                 <p className="text-xs text-stone-400 mt-1 hidden md:block">Exquisite recipes & ingredients</p>
              </div>
              
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-stone-800/50 rounded-2xl border border-white/10 group-hover:border-green-500/50 transition-colors backdrop-blur-sm">
                     <Clock size={24} className="text-green-400" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-white">Instant Service</h3>
                 <p className="text-xs text-stone-400 mt-1 hidden md:block">No waiting, just dining</p>
              </div>
              
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-stone-800/50 rounded-2xl border border-white/10 group-hover:border-blue-500/50 transition-colors backdrop-blur-sm">
                     <ShieldCheck size={24} className="text-blue-400" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-white">100% Secure</h3>
                 <p className="text-xs text-stone-400 mt-1 hidden md:block">Safe payments & data</p>
              </div>
          </div>
        </div>
      </div>

      {/* Features Grid - More Clean & Minimal */}
      <div className="py-24 bg-white relative z-20">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Technology meets Taste</h2>
                <p className="text-stone-500 max-w-2xl mx-auto">We leverage advanced AI to streamline your experience, allowing our chefs to focus on what matters most: the food.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-xl transition-all duration-300 group flex flex-col items-start text-left">
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                        <MessageCircle size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-stone-800">{t('feature_chat_title')}</h3>
                    <p className="text-stone-500 leading-relaxed text-sm mb-4">{t('feature_chat_desc')}</p>
                    <Link to="/menu" className="mt-auto text-orange-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">Try AI Chat <ArrowRight size={16}/></Link>
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
                <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">Loved by Locals</h2>
                <p className="text-stone-500">See what our guests are saying about their dining experience.</p>
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

      {/* Scan & Connect Section */}
      <div className="bg-stone-900 text-white py-24 overflow-hidden relative">
         {/* Background elements */}
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

         <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('scan_qr_title')}</h2>
               <p className="text-stone-400 text-lg max-w-2xl mx-auto">{t('scan_qr_subtitle')}</p>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24">
               {/* WhatsApp QR */}
               <div className="group relative">
                  <div className="absolute inset-0 bg-green-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative bg-white/5 backdrop-blur-lg p-8 rounded-3xl flex flex-col items-center text-center border border-white/10 hover:border-green-500/50 transition duration-300">
                      <div className="w-48 h-48 bg-white rounded-xl overflow-hidden mb-6 p-2">
                         <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/971504291207`} 
                           alt="WhatsApp QR" 
                           className="w-full h-full object-cover"
                         />
                      </div>
                      <div className="flex items-center gap-2 text-white font-bold text-xl mb-1">
                         <MessageCircle className="text-green-500 fill-green-500" /> {t('scan_whatsapp')}
                      </div>
                      <p className="text-stone-400 text-sm font-mono">+971 504291207</p>
                  </div>
               </div>

               {/* System QR (Current URL) */}
               <div className="group relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative bg-white/5 backdrop-blur-lg p-8 rounded-3xl flex flex-col items-center text-center border border-white/10 hover:border-blue-500/50 transition duration-300">
                      <div className="w-48 h-48 bg-white rounded-xl overflow-hidden mb-6 p-2">
                         <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} 
                           alt="System QR" 
                           className="w-full h-full object-cover"
                         />
                      </div>
                      <div className="flex items-center gap-2 text-white font-bold text-xl mb-1">
                         <Smartphone className="text-blue-500" /> {t('scan_website')}
                      </div>
                      <p className="text-stone-400 text-sm font-mono">Order via Web App</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Home;
