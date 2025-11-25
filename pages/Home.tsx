
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChefHat, MessageCircle, Clock, ShieldCheck, Sparkles, Database, Camera } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ASSETS } from '../assets';

// 3 Specific High Quality Slides from Assets
const BACKGROUND_IMAGES = [
  ASSETS.backgrounds.hero_interior,
  ASSETS.backgrounds.hero_chef,
  ASSETS.backgrounds.hero_food
];

const Home: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Hero Section - Premium Dark Theme */}
      <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-stone-950">
        
        {/* Background Slider - Balanced Opacity for Dark Theme */}
        {BACKGROUND_IMAGES.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${
              index === bgIndex ? 'opacity-40' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}

        {/* Luxury Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/50 to-stone-950 z-10"></div>
        
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center mt-10">
          
          {/* Headline: Clear Value Prop */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 delay-100 text-white drop-shadow-lg">
             {t('hero_headline_prefix')} <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 filter drop-shadow-sm">{t('hero_headline_highlight')}</span>
          </h1>

          {/* Subheadline: Why Buy? */}
          <p className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-6 delay-200">
             {t('hero_description')}
          </p>
          
          {/* Scannable Key Benefits - Glassmorphism */}
          <div className="mt-16 pt-10 border-t border-stone-800 grid grid-cols-3 gap-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-10 delay-500">
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-stone-900/60 backdrop-blur-md rounded-2xl border border-stone-800 shadow-lg group-hover:border-orange-500/50 transition-colors">
                     <ChefHat size={24} className="text-orange-500" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-stone-200">{t('benefit_chef')}</h3>
                 <p className="text-xs text-stone-500 mt-1 hidden md:block">{t('benefit_chef_desc')}</p>
              </div>
              
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-stone-900/60 backdrop-blur-md rounded-2xl border border-stone-800 shadow-lg group-hover:border-green-500/50 transition-colors">
                     <Clock size={24} className="text-emerald-400" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-stone-200">{t('benefit_instant')}</h3>
                 <p className="text-xs text-stone-500 mt-1 hidden md:block">{t('benefit_instant_desc')}</p>
              </div>
              
              <div className="flex flex-col items-center group">
                 <div className="mb-3 p-3 bg-stone-900/60 backdrop-blur-md rounded-2xl border border-stone-800 shadow-lg group-hover:border-amber-500/50 transition-colors">
                     <ShieldCheck size={24} className="text-amber-400" />
                 </div>
                 <h3 className="font-bold text-sm md:text-base text-stone-200">{t('benefit_secure')}</h3>
                 <p className="text-xs text-stone-500 mt-1 hidden md:block">{t('benefit_secure_desc')}</p>
              </div>
          </div>
        </div>
      </div>

      {/* Features Grid - Clean & Minimal */}
      <div className="py-24 bg-white relative z-20">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{t('tech_title')}</h2>
                <p className="text-stone-500 max-w-2xl mx-auto">{t('tech_desc')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                {/* Feature 1: Chat */}
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-xl transition-all duration-300 group flex flex-col items-start text-left hover:border-orange-200">
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
                
                {/* Feature 2: Menu */}
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-xl transition-all duration-300 group flex flex-col items-start text-left hover:border-blue-200">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                        <Database size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-stone-800">{t('feature_menu_title')}</h3>
                    <p className="text-stone-500 leading-relaxed text-sm mb-4">{t('feature_menu_desc')}</p>
                    <Link 
                        to="/admin"
                        className="mt-auto text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        Manage Menu <ArrowRight size={16}/>
                    </Link>
                </div>

                {/* Feature 3: Gen AI */}
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-xl transition-all duration-300 group flex flex-col items-start text-left hover:border-purple-200">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                        <Sparkles size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-stone-800">{t('feature_gen_title')}</h3>
                    <p className="text-stone-500 leading-relaxed text-sm mb-4">{t('feature_gen_desc')}</p>
                    <Link 
                        to="/ai-lab"
                        className="mt-auto text-purple-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        Open Studio <Camera size={16} className="ml-1"/>
                    </Link>
                </div>
            </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-stone-900 text-white py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-stone-800 to-transparent opacity-50 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6">{t('cta_ready_title')}</h2>
              <p className="text-stone-400 text-lg mb-10 max-w-2xl mx-auto">{t('cta_ready_desc')}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/menu" className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-500 transition shadow-lg hover:shadow-orange-500/25">
                      {t('cta_view_menu')}
                  </Link>
                  <Link to="/info/contact" className="bg-transparent border border-stone-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-stone-800 transition">
                      {t('cta_visit')}
                  </Link>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Home;
