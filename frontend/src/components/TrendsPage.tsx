import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { api, type TrendResponse } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { CustomSelect } from './CustomSelect';
import { ShareButton } from './ShareButton';

interface TrendsPageProps {
  initialCrop?: string;
  initialState?: string;
  initialDays?: number;
  onFilterChange?: (crop: string, state?: string, days?: number) => void;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({
  initialCrop = 'Wheat',
  initialState = '',
  initialDays = 30,
  onFilterChange,
}) => {
  const { t, translateCrop } = useLanguage();

  const [crop, setCrop] = useState(initialCrop);
  const [state, setState] = useState(initialState);
  const [days, setDays] = useState(initialDays);
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [cropsList, setCropsList] = useState<string[]>([]);
  const [statesList, setStatesList] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available crops and states for the dropdowns
    api.getCrops().then((res) => {
      setCropsList(res.map((c) => c.name));
    }).catch(console.error);

    api.getStats().then((res) => {
      if (res && res.states_covered) {
        setStatesList(res.states_covered);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getTrends(crop, state || undefined, days)
      .then((res) => {
        if (isMounted) {
          setTrendData(res);
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
  }, [crop, state, days]);

  // Sync active filters to URL
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(crop, state || undefined, days);
    }
  }, [crop, state, days, onFilterChange]);

  const isPositiveTrend = (trendData?.price_change_pct ?? 0) >= 0;

  return (
    <div className="space-y-6">
      
      {/* Top Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>{t('trendAnalysis')}</span>
          </h2>
          <ShareButton
            variant="badge"
            label="Share Trend"
            title={`${crop} Price Trend (${days} Days)${state ? ` in ${state}` : ''}`}
            description={`Current avg price ₹${Math.round(trendData?.latest_price ?? trendData?.overall_avg ?? 0)}/Qtl (${trendData?.price_change_pct ?? 0}% change) on KisanMandi.`}
            params={{
              tab: 'trends',
              trendCrop: crop,
              trendState: state || undefined,
              trendDays: days,
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('selectCrop')}</label>
            <CustomSelect
              value={crop}
              onChange={(val) => setCrop(val)}
              options={cropsList.map((c) => ({
                value: c,
                label: translateCrop(c),
                sublabel: c,
              }))}
              placeholder={t('selectCrop')}
            />
          </div>

          {/* State Selector with Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('selectState')}</label>
            <CustomSelect
              value={state}
              onChange={(val) => setState(val)}
              options={[
                { value: '', label: t('filterAllStates') },
                ...statesList.map((st) => ({ value: st, label: st })),
              ]}
              placeholder={t('filterAllStates')}
              searchable={true}
            />
          </div>

          {/* Days Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('dateRangeLabel')}</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[7, 30, 90, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    days === d ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {d < 365 ? `${d}D` : '1Y'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Summary Metric Cards */}
      {trendData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">{t('averagePrice')}</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{Math.round(trendData.overall_avg).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-slate-500 ml-1">/Qtl</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">{t('priceChange')}</span>
            <div className="flex items-center gap-1 text-xl sm:text-2xl font-black mt-1">
              <span className={isPositiveTrend ? 'text-emerald-600' : 'text-rose-600'}>
                {isPositiveTrend ? '+' : ''}{trendData.price_change_pct}%
              </span>
              {isPositiveTrend ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">{t('lowestPrice')}</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{Math.round(trendData.overall_min).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">{t('highestPrice')}</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{Math.round(trendData.overall_max).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {translateCrop(crop)} ({crop}) {t('trendsNav')}
            </h3>
            <p className="text-xs text-slate-500">
              {state ? `${state} Mandis` : 'All APMC Mandis'} • {trendData?.data.length ?? 0} trading days
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-72 w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
            <span className="text-sm font-medium text-slate-400">Loading price trend data...</span>
          </div>
        ) : !trendData || trendData.data.length === 0 ? (
          <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">{t('noData')}</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting a different time window or state.</p>
          </div>
        ) : (
          <div className="h-72 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  minTickGap={25}
                />
                <YAxis
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${Math.round(v)}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700">
                          <div className="font-semibold text-slate-300 mb-1">{label}</div>
                          <div className="text-base font-black text-emerald-400">
                            Avg: ₹{Math.round(data.avg_price)}/Qtl
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex gap-2">
                            <span>Min: ₹{Math.round(data.min_price)}</span>
                            <span>Max: ₹{Math.round(data.max_price)}</span>
                          </div>
                          {data.total_quantity > 0 && (
                            <div className="text-[10px] text-amber-300 mt-1">
                              Arrivals: {Math.round(data.total_quantity)} Qtl
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avg_price"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};
