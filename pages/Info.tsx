
import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, HelpCircle, MapPin, Briefcase, Phone, Info as InfoIcon } from 'lucide-react';

const Info: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const { t } = useLanguage();

  const renderContent = () => {
    switch (section) {
      case 'about':
        return (
          <div className="max-w-3xl mx-auto text-center">
             <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <InfoIcon size={40} />
             </div>
             <h1 className="text-4xl font-bold mb-6">{t('info_about_title')}</h1>
             <p className="text-lg text-stone-600 leading-relaxed mb-8">{t('info_about_desc')}</p>
             <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Restaurant Interior" className="rounded-2xl shadow-xl" />
          </div>
        );
      
      case 'faq':
        return (
          <div className="max-w-3xl mx-auto">
             <h1 className="text-4xl font-bold mb-10 text-center flex items-center justify-center gap-3">
                <HelpCircle className="text-orange-500" /> {t('info_faq_title')}
             </h1>
             <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                        <h3 className="font-bold text-lg mb-2 text-stone-800">Do you offer vegan options?</h3>
                        <p className="text-stone-600">Yes, we have a dedicated section in our menu for vegan and gluten-free dishes.</p>
                    </div>
                ))}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                        <h3 className="font-bold text-lg mb-2 text-stone-800">Do I need a reservation?</h3>
                        <p className="text-stone-600">Reservations are highly recommended for dinner service on weekends.</p>
                </div>
             </div>
          </div>
        );

      case 'contact':
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-10 text-center">{t('info_contact_title')}</h1>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                        <h3 className="font-bold text-xl mb-6">Contact Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-stone-600">
                                <Phone className="text-green-500" /> <span>+971 504291207</span>
                            </div>
                            <div className="flex items-center gap-3 text-stone-600">
                                <MapPin className="text-red-500" /> <span>Downtown Dubai, UAE</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-xl mb-6">Business Hours</h3>
                        <div className="space-y-2">
                            <p className="flex justify-between border-b border-stone-700 pb-2"><span>Mon-Fri</span> <span>09:00 - 22:00</span></p>
                            <p className="flex justify-between border-b border-stone-700 pb-2"><span>Sat-Sun</span> <span>10:00 - 23:00</span></p>
                        </div>
                    </div>
                </div>
            </div>
        );

      case 'team':
        return (
            <div className="max-w-5xl mx-auto">
                 <h1 className="text-4xl font-bold mb-10 text-center flex items-center justify-center gap-3">
                    <Users className="text-purple-500" /> {t('info_team_title')}
                 </h1>
                 <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="text-center group">
                            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-4 shadow-lg">
                                <img src={`https://i.pravatar.cc/300?img=${i + 10}`} alt="Team Member" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <h3 className="font-bold text-xl">Chef Alex {String.fromCharCode(64 + i)}</h3>
                            <p className="text-stone-500 text-sm uppercase tracking-widest">Executive Chef</p>
                        </div>
                    ))}
                 </div>
            </div>
        );

        case 'services':
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-10 flex items-center justify-center gap-3">
                        <Briefcase className="text-blue-500" /> {t('info_services_title')}
                    </h1>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-stone-100">
                            <h3 className="font-bold text-xl mb-2">Catering</h3>
                            <p className="text-stone-500">Premium catering for weddings and corporate events.</p>
                        </div>
                        <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-stone-100">
                            <h3 className="font-bold text-xl mb-2">Private Dining</h3>
                            <p className="text-stone-500">Exclusive rooms for special occasions.</p>
                        </div>
                        <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-stone-100">
                            <h3 className="font-bold text-xl mb-2">Delivery</h3>
                            <p className="text-stone-500">Fast and fresh delivery within 30 mins.</p>
                        </div>
                         <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-stone-100">
                            <h3 className="font-bold text-xl mb-2">Event Hosting</h3>
                            <p className="text-stone-500">Host your parties with our full service team.</p>
                        </div>
                    </div>
                </div>
            );

      case 'location':
        return (
            <div className="max-w-4xl mx-auto text-center">
                 <h1 className="text-4xl font-bold mb-10 flex items-center justify-center gap-3">
                    <MapPin className="text-red-500" /> {t('info_location_title')}
                 </h1>
                 <div className="bg-stone-200 rounded-2xl h-96 w-full flex items-center justify-center text-stone-500">
                    {/* Placeholder for Map */}
                    <div className="text-center">
                        <MapPin size={64} className="mx-auto mb-2 opacity-50"/>
                        <p>Interactive Map Integration</p>
                        <p className="text-sm mt-2">Downtown Dubai, Sheikh Mohammed bin Rashid Blvd</p>
                    </div>
                 </div>
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
