import React, { useState, useEffect } from 'react';
import { Users, Phone, MessageCircle, ShieldCheck, MapPin, Package } from 'lucide-react';
import { api, type Buyer } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { CustomSelect } from './CustomSelect';
import { ShareButton } from './ShareButton';

interface BuyersPageProps {
  initialCrop?: string;
  initialLocation?: string;
  onFilterChange?: (crop?: string, location?: string) => void;
}

export const BuyersPage: React.FC<BuyersPageProps> = ({
  initialCrop = '',
  initialLocation = '',
  onFilterChange,
}) => {
  const { t, translateCrop } = useLanguage();

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  const [cropsList, setCropsList] = useState<string[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    api.getBuyers(selectedCrop || undefined, selectedLocation || undefined)
      .then((res) => {
        setBuyers(res);
        setLoading(false);

        // Collect unique crops and locations
        const crops = Array.from(new Set(res.map((b) => b.crop)));
        const locs = Array.from(new Set(res.map((b) => b.location)));
        if (cropsList.length === 0) setCropsList(crops);
        if (locationsList.length === 0) setLocationsList(locs);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedCrop, selectedLocation]);

  // Sync filters to URL
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selectedCrop || undefined, selectedLocation || undefined);
    }
  }, [selectedCrop, selectedLocation, onFilterChange]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <Users className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('buyerDirectoryTitle')}</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              {t('buyerSubtitle')}
            </p>
          </div>
        </div>
        <ShareButton
          variant="button"
          label="Share Directory"
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 self-start sm:self-auto"
          title={`Verified Crop Buyers ${selectedCrop ? `for ${selectedCrop}` : ''} ${selectedLocation ? `in ${selectedLocation}` : ''}`}
          description={`Browse direct corporate buyers, food processors and institutional traders on KisanMandi.`}
          params={{
            tab: 'buyers',
            buyerCrop: selectedCrop || undefined,
            buyerLocation: selectedLocation || undefined,
          }}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1">{t('filterAllCrops')}</label>
          <CustomSelect
            value={selectedCrop}
            onChange={(val) => setSelectedCrop(val)}
            options={[
              { value: '', label: t('filterAllCrops') },
              ...cropsList.map((c) => ({
                value: c,
                label: translateCrop(c),
                sublabel: c,
              })),
            ]}
            placeholder={t('filterAllCrops')}
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1">{t('location')}</label>
          <CustomSelect
            value={selectedLocation}
            onChange={(val) => setSelectedLocation(val)}
            options={[
              { value: '', label: t('filterAllStates') },
              ...locationsList.map((loc) => ({ value: loc, label: loc })),
            ]}
            placeholder={t('filterAllStates')}
            searchable={true}
          />
        </div>
      </div>

      {/* Buyer Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200/70 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : buyers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">{t('noData')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyers.map((buyer) => {
            const cleanPhone = buyer.contact.replace(/[^0-9+]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
              `Namaste, I am a farmer interested in selling ${buyer.crop}. Let me know your current procurement requirements.`
            )}`;

            return (
              <div
                key={buyer.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Buyer Title & Verified Tag */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {buyer.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified
                    </span>
                  </div>

                  {/* Commodity & Minimum Qty */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {translateCrop(buyer.crop)}
                    </span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      {t('minOrderQuantity')}: <strong>{buyer.min_quantity} Qtl</strong>
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{buyer.location}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t('callBuyer')}</span>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{t('whatsappBuyer')}</span>
                  </a>
                  <ShareButton
                    variant="icon"
                    title={`Verified Buyer: ${buyer.name}`}
                    description={`Buying ${buyer.crop} in ${buyer.location} (Min: ${buyer.min_quantity} Qtl). Find on KisanMandi.`}
                    params={{
                      tab: 'buyers',
                      buyerCrop: buyer.crop,
                      buyerLocation: buyer.location,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
