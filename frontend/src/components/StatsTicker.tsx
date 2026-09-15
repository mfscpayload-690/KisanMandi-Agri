import React from 'react';
import { Database, Store, Sprout, MapPin } from 'lucide-react';
import type { StatsResponse } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface StatsTickerProps {
  stats: StatsResponse | null;
  selectedCrop: string;
  onSelectCrop: (crop: string) => void;
}

export const StatsTicker: React.FC<StatsTickerProps> = ({
  stats,
  selectedCrop,
  onSelectCrop,
}) => {
  const { t, translateCrop } = useLanguage();

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-200/70 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: t('totalRecords'),
      value: stats.total_price_records.toLocaleString('en-IN'),
      icon: Database,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800 border-emerald-200/70',
      iconBg: 'bg-emerald-500 text-white',
    },
    {
      label: t('totalMandis'),
      value: stats.total_mandis.toLocaleString('en-IN'),
      icon: Store,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-800 border-amber-200/70',
      iconBg: 'bg-amber-500 text-white',
    },
    {
      label: t('totalCrops'),
      value: stats.total_crops.toLocaleString('en-IN'),
      icon: Sprout,
      color: 'from-lime-500/10 to-emerald-500/10 text-lime-800 border-lime-200/70',
      iconBg: 'bg-lime-600 text-white',
    },
    {
      label: t('statesCovered'),
      value: `${stats.states_covered.length} States/UTs`,
      icon: MapPin,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-800 border-blue-200/70',
      iconBg: 'bg-blue-600 text-white',
    },
  ];

  return (
    <div className="mb-6">
      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br ${card.color} border shadow-xs flex items-center gap-3.5 transition-transform hover:scale-[1.02]`}
            >
              <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-sm shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {card.label}
                </div>
                <div className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                  {card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Crop Selector Pills */}
      {stats.top_traded_crops && stats.top_traded_crops.length > 0 && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => onSelectCrop('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCrop === ''
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
            }`}
          >
            {t('filterAllCrops')}
          </button>
          {stats.top_traded_crops.map((c) => (
            <button
              key={c.crop_name}
              onClick={() => onSelectCrop(c.crop_name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCrop.toLowerCase() === c.crop_name.toLowerCase()
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span>{translateCrop(c.crop_name)}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  selectedCrop.toLowerCase() === c.crop_name.toLowerCase()
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                ₹{Math.round(c.avg_price)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
