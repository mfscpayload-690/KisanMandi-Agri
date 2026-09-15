import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import { api, type PriceAlert } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface AlertsPageProps {
  initialCrop?: string;
  initialPrice?: number;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  initialCrop = 'Wheat',
  initialPrice = 2500,
}) => {
  const { t, translateCrop } = useLanguage();

  const userId = 'farmer_local'; // Local farmer device user identifier
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [crop, setCrop] = useState(initialCrop);
  const [thresholdPrice, setThresholdPrice] = useState(initialPrice || 2500);
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [cropsList, setCropsList] = useState<string[]>([]);

  const loadAlerts = () => {
    setLoading(true);
    api.getAlerts(userId)
      .then((res) => {
        setAlerts(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlerts();
    api.getCrops().then((res) => {
      setCropsList(res.map((c) => c.name));
    }).catch(console.error);
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdPrice || thresholdPrice <= 0) return;

    try {
      setIsSubmitting(true);
      await api.createAlert({
        user_id: userId,
        crop,
        threshold_price: Number(thresholdPrice),
        alert_type: alertType,
      });
      setFeedback('Alert created successfully!');
      setTimeout(() => setFeedback(null), 3000);
      loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await api.deleteAlert(id);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 to-emerald-800 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <Bell className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('priceAlertsTitle')}</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              {t('priceAlertsSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Create Alert Form */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>{t('createNewAlert')}</span>
          </h3>

          <form onSubmit={handleCreateAlert} className="space-y-4">
            
            {/* Select Crop */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('selectCrop')}</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {cropsList.map((c) => (
                  <option key={c} value={c}>
                    {translateCrop(c)} ({c})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('targetPrice')}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={thresholdPrice}
                  onChange={(e) => setThresholdPrice(Number(e.target.value))}
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Alert Condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('alertType')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertType('above')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    alertType === 'above'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('alertAbove')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlertType('below')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    alertType === 'below'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('alertBelow')}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Saving...' : t('saveAlert')}
            </button>

            {feedback && (
              <div className="text-xs text-emerald-700 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

          </form>
        </div>

        {/* Right: Active Alerts List */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>{t('activeAlerts')}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {alerts.length}
            </span>
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-slate-200/70 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No active price alerts set yet.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isTriggered = alert.is_triggered;
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isTriggered
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                      : 'bg-white border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {translateCrop(alert.crop)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isTriggered
                            ? 'bg-emerald-600 text-white live-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isTriggered ? t('triggered') : t('monitoring')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span>Target: <strong>₹{Math.round(alert.threshold_price)}</strong> ({alert.alert_type})</span>
                      {alert.current_market_price && (
                        <span className="text-slate-400">• Current: <strong>₹{Math.round(alert.current_market_price)}</strong></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    title={t('deleteAlert')}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
