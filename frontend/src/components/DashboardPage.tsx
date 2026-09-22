import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  ArrowUp,
  BellRing,
  TrendingUp,
} from 'lucide-react';
import { api, type PriceRecord } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { CustomSelect } from './CustomSelect';
import { ShareButton } from './ShareButton';

interface DashboardPageProps {
  selectedCrop: string;
  initialState?: string;
  initialDays?: number;
  initialSearchQuery?: string;
  onSelectCrop?: (crop: string) => void;
  onFilterChange?: (filters: { crop?: string; state?: string; days?: number; query?: string }) => void;
  onNavigateToTrends: (crop: string, state?: string) => void;
  onNavigateToAlerts: (crop: string, currentPrice?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  selectedCrop,
  initialState = '',
  initialDays,
  initialSearchQuery = '',
  onFilterChange,
  onNavigateToTrends,
  onNavigateToAlerts,
}) => {
  const { t, translateCrop } = useLanguage();

  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter states initialized from deep link params
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedDays, setSelectedDays] = useState<number | undefined>(initialDays);
  const sortBy = 'date';
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Available states list
  const [statesList, setStatesList] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load distinct states
  useEffect(() => {
    api.getStats()
      .then((res) => {
        if (res && res.states_covered) {
          setStatesList(res.states_covered);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch initial batch of prices whenever filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const cropQuery = searchQuery.trim() || selectedCrop || undefined;

    api.getPrices({
      crop: cropQuery,
      state: selectedState || undefined,
      days: selectedDays,
      limit,
      offset: 0,
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
  }, [selectedCrop, searchQuery, selectedState, selectedDays, sortBy, sortOrder, limit]);

  // Sync active filters back to App deep linking router
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        crop: selectedCrop || undefined,
        state: selectedState || undefined,
        days: selectedDays,
        query: searchQuery.trim() || undefined,
      });
    }
  }, [selectedCrop, selectedState, selectedDays, searchQuery, onFilterChange]);

  // Append next batch of prices on Show More
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading || prices.length >= total) return;
    setLoadingMore(true);

    try {
      const cropQuery = searchQuery.trim() || selectedCrop || undefined;
      const res = await api.getPrices({
        crop: cropQuery,
        state: selectedState || undefined,
        days: selectedDays,
        limit,
        offset: prices.length,
        sort_by: sortBy,
        order: sortOrder,
      });

      setPrices((prev) => [...prev, ...res.data]);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load more prices:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, prices.length, total, searchQuery, selectedCrop, selectedState, selectedDays, limit, sortBy, sortOrder]);

  const hasMore = prices.length < total;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const percentLoaded = total > 0 ? Math.min(100, Math.round((prices.length / total) * 100)) : 0;

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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchCropPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* State Dropdown with Search */}
          <div className="md:col-span-3">
            <CustomSelect
              value={selectedState}
              onChange={(val) => setSelectedState(val)}
              options={[
                { value: '', label: t('filterAllStates') },
                ...statesList.map((st) => ({ value: st, label: st })),
              ]}
              placeholder={t('filterAllStates')}
              searchable={true}
            />
          </div>

          {/* Time Filter */}
          <div className="md:col-span-2">
            <CustomSelect
              value={selectedDays ? String(selectedDays) : ''}
              onChange={(val) => setSelectedDays(val ? parseInt(val) : undefined)}
              options={[
                { value: '', label: t('daysAll') },
                { value: '7', label: t('days7') },
                { value: '30', label: t('days30') },
                { value: '90', label: t('days90') },
              ]}
              placeholder={t('dateRangeLabel') || t('daysAll')}
            />
          </div>

          {/* Sort Order */}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4 text-emerald-600" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>

        </form>

        {/* Results count header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            <strong className="text-slate-800 font-semibold">{total.toLocaleString()}</strong> {t('recordsFound')}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              {t('showingCount')} {prices.length.toLocaleString()} {t('ofTotal')} {total.toLocaleString()}
            </span>
            <ShareButton
              variant="badge"
              label="Share Results"
              title={`Mandi Prices for ${selectedCrop || searchQuery || 'All Crops'} ${selectedState ? `in ${selectedState}` : 'across India'}`}
              description={`Viewing ${total} real-time APMC mandi price arrivals on KisanMandi.`}
              params={{
                tab: 'dashboard',
                crop: selectedCrop || undefined,
                state: selectedState || undefined,
                days: selectedDays,
                q: searchQuery.trim() || undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* Loading Skeleton for initial filter fetch */}
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
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('trendsNav')}</span>
                    </button>
                    <button
                      onClick={() => onNavigateToAlerts(record.crop_name, modalPrice)}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{t('alertsNav')}</span>
                    </button>
                    <ShareButton
                      variant="icon"
                      title={`${record.crop_name} @ ${record.mandi_name}, ${record.state}`}
                      description={`Live APMC Modal Price: ₹${Math.round(modalPrice).toLocaleString('en-IN')}/Qtl on ${record.date}.`}
                      params={{
                        tab: 'dashboard',
                        crop: record.crop_name,
                        state: record.state,
                        q: record.mandi_name,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Partial Loading & Show More Section */}
          <div ref={sentinelRef} className="mt-8 mb-6 flex flex-col items-center justify-center gap-3">
            {/* Progress Count & Percentage Pill */}
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-2">
              <span>
                {t('showingCount')} <strong className="text-slate-900 font-bold">{prices.length.toLocaleString()}</strong> {t('ofTotal')} <strong className="text-slate-900 font-bold">{total.toLocaleString()}</strong> {t('arrivals')}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs border border-emerald-200/60">
                {percentLoaded}% {t('loaded')}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full max-w-sm h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                style={{ width: `${percentLoaded}%` }}
              />
            </div>

            {/* Show More Button with Down Arrow */}
            {hasMore ? (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                aria-label="Show more market arrivals"
                className="w-full sm:w-auto min-w-[280px] mt-2 flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('loadingMore')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('loadMore')}</span>
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                  </>
                )}
              </button>
            ) : (
              <div className="mt-2 py-2.5 px-5 rounded-xl bg-slate-100 text-slate-600 text-xs sm:text-sm font-semibold border border-slate-200/80">
                ✓ {t('allLoaded')} ({total.toLocaleString()} {t('recordsFound')})
              </div>
            )}

            {/* Back to Top button when list is long */}
            {prices.length > 20 && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs font-semibold text-slate-400 hover:text-emerald-700 flex items-center gap-1.5 mt-2 transition-colors cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{t('backToTop')}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
