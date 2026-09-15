import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, ArrowUpDown, ChevronLeft, ChevronRight, BellRing, TrendingUp } from 'lucide-react';
import { api, type PriceRecord } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface DashboardPageProps {
  selectedCrop: string;
  onSelectCrop?: (crop: string) => void;
  onNavigateToTrends: (crop: string, state?: string) => void;
  onNavigateToAlerts: (crop: string, currentPrice?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  selectedCrop,
  onNavigateToTrends,
  onNavigateToAlerts,
}) => {
  const { t, translateCrop } = useLanguage();

  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDays, setSelectedDays] = useState<number | undefined>(undefined);
  const sortBy = 'date';
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Available states list
  const [statesList, setStatesList] = useState<string[]>([]);

  // Load distinct states
  useEffect(() => {
    api.getStats().then((res) => {
      if (res && res.states_covered) {
        setStatesList(res.states_covered);
      }
    }).catch(console.error);
  }, []);

  // Fetch prices with debouncing
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const offset = (page - 1) * limit;
    const cropQuery = searchQuery.trim() || selectedCrop || undefined;

    api.getPrices({
      crop: cropQuery,
      state: selectedState || undefined,
      days: selectedDays,
      limit,
      offset,
      sort_by: sortBy,
      order: sortOrder,
    })
      .then((res) => {
        if (isMounted) {
          setPrices(res.data);
          setTotal(res.total);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCrop, searchQuery, selectedState, selectedDays, page, sortBy, sortOrder]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t('searchCropPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* State Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('filterAllStates')}</option>
              {statesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDays ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDays(val ? parseInt(val) : undefined);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('daysAll')}</option>
              <option value="7">{t('days7')}</option>
              <option value="30">{t('days30')}</option>
              <option value="90">{t('days90')}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                setPage(1);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
            >
              <ArrowUpDown className="w-4 h-4 text-emerald-600" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>

        </form>

        {/* Results count header */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            <strong className="text-slate-800 font-semibold">{total.toLocaleString()}</strong> {t('recordsFound')}
          </span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200/70 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">{t('noData')}</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing some filters or searching for a different crop.</p>
        </div>
      ) : (
        <>
          {/* Card Grid View (Mobile First & Tablet/Desktop Responsive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((record) => {
              const modalPrice = record.modal_price || record.price_per_unit;
              const minP = record.min_price || modalPrice;
              const maxP = record.max_price || modalPrice;

              return (
                <div
                  key={record.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between"
                >
                  {/* Top: Crop name + Variety + Date */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {record.crop_name}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                          {translateCrop(record.crop_name)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{record.date}</span>
                      </div>
                    </div>

                    {/* Mandi & Location */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{record.mandi_name}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 truncate">{record.state}</span>
                    </div>

                    {/* Variety and Quantity */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                      {record.variety && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 truncate max-w-[140px]">
                          {t('variety')}: {record.variety}
                        </span>
                      )}
                      {record.quantity > 0 && (
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200/40">
                          {record.quantity} Qtl
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Modal Price Highlight */}
                  <div className="my-3.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-100 flex items-baseline justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                        {t('modalPrice')}
                      </div>
                      <div className="text-2xl font-black text-emerald-950 flex items-baseline gap-1">
                        <span>₹{Math.round(modalPrice).toLocaleString('en-IN')}</span>
                        <span className="text-xs font-semibold text-emerald-700">/{t('quintal')}</span>
                      </div>
                    </div>
                    {minP !== maxP && (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">{t('priceSpread')}</div>
                        <div className="text-xs font-bold text-slate-700">
                          ₹{Math.round(minP)} - ₹{Math.round(maxP)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => onNavigateToTrends(record.crop_name, record.state)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('trendsNav')}</span>
                    </button>
                    <button
                      onClick={() => onNavigateToAlerts(record.crop_name, modalPrice)}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{t('alertsNav')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Bar */}
          <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-2xl border border-slate-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <div className="text-xs sm:text-sm font-medium text-slate-600">
              Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
