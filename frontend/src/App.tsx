import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { StatsTicker } from './components/StatsTicker';
import { DashboardPage } from './components/DashboardPage';
import { TrendsPage } from './components/TrendsPage';
import { BuyersPage } from './components/BuyersPage';
import { AlertsPage } from './components/AlertsPage';
import { Footer } from './components/Footer';
import { SoilMonitorView } from './components/soil/SoilMonitorView';
import { api, type StatsResponse } from './api/client';
import { parseDeepLinkParams, syncUrlToHistory, type DeepLinkParams } from './utils/deepLinks';

export const MainApp: React.FC = () => {
  // Parse initial deep link parameters from current URL
  const initialParams = parseDeepLinkParams();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil'>(
    initialParams.tab || 'dashboard'
  );
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>(initialParams.crop || '');

  // Dashboard filter deep linking parameters
  const [dashboardState, setDashboardState] = useState<string>(initialParams.state || '');
  const [dashboardDays, setDashboardDays] = useState<number | undefined>(initialParams.days);
  const [dashboardQuery, setDashboardQuery] = useState<string>(initialParams.q || '');

  // Trends deep linking parameters
  const [trendCrop, setTrendCrop] = useState<string>(initialParams.trendCrop || initialParams.crop || 'Wheat');
  const [trendState, setTrendState] = useState<string>(initialParams.trendState || initialParams.state || '');
  const [trendDays, setTrendDays] = useState<number>(initialParams.trendDays || 30);

  // Buyers deep linking parameters
  const [buyerCrop, setBuyerCrop] = useState<string>(initialParams.buyerCrop || initialParams.crop || '');
  const [buyerLocation, setBuyerLocation] = useState<string>(initialParams.buyerLocation || initialParams.state || '');

  // Alerts deep linking parameters
  const [alertCrop, setAlertCrop] = useState<string>(initialParams.alertCrop || initialParams.crop || 'Wheat');
  const [alertPrice, setAlertPrice] = useState<number>(initialParams.alertPrice || 2500);

  const fetchStatsData = useCallback(() => {
    api.getStats()
      .then((res) => {
        setStats(res);
      })
      .catch((err) => console.error('Stats polling error:', err));
  }, []);

  // Initial stats fetch
  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  // Periodic background data polling (5s interval) and auto-sync task (30s interval)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchStatsData();
    }, 5000);

    const syncInterval = setInterval(() => {
      api.triggerSync()
        .then(() => fetchStatsData())
        .catch((err) => console.debug('Periodic background sync:', err));
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(syncInterval);
    };
  }, [fetchStatsData]);

  // Listen to browser Back / Forward buttons (popstate event) for seamless deep navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = parseDeepLinkParams();
      if (params.tab) {
        setActiveTab(params.tab);
      }
      if (params.crop !== undefined) {
        setSelectedCrop(params.crop);
      }
      if (params.state !== undefined) {
        setDashboardState(params.state);
      }
      if (params.days !== undefined) {
        setDashboardDays(params.days);
      }
      if (params.q !== undefined) {
        setDashboardQuery(params.q);
      }
      if (params.trendCrop) {
        setTrendCrop(params.trendCrop);
      }
      if (params.trendState !== undefined) {
        setTrendState(params.trendState);
      }
      if (params.trendDays !== undefined) {
        setTrendDays(params.trendDays);
      }
      if (params.buyerCrop !== undefined) {
        setBuyerCrop(params.buyerCrop);
      }
      if (params.buyerLocation !== undefined) {
        setBuyerLocation(params.buyerLocation);
      }
      if (params.alertCrop) {
        setAlertCrop(params.alertCrop);
      }
      if (params.alertPrice) {
        setAlertPrice(params.alertPrice);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize Tab transitions with Browser History
  const handleTabChange = (tab: 'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil') => {
    setActiveTab(tab);

    const params: DeepLinkParams = { tab };
    if (tab === 'dashboard') {
      params.crop = selectedCrop || undefined;
      params.state = dashboardState || undefined;
      params.days = dashboardDays;
      params.q = dashboardQuery || undefined;
    } else if (tab === 'trends') {
      params.trendCrop = trendCrop;
      params.trendState = trendState || undefined;
      params.trendDays = trendDays;
    } else if (tab === 'buyers') {
      params.buyerCrop = buyerCrop || undefined;
      params.buyerLocation = buyerLocation || undefined;
    } else if (tab === 'alerts') {
      params.alertCrop = alertCrop;
      params.alertPrice = alertPrice;
    }

    syncUrlToHistory(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToTrends = (crop: string, state?: string) => {
    setTrendCrop(crop);
    setTrendState(state || '');
    setActiveTab('trends');
    syncUrlToHistory({ tab: 'trends', trendCrop: crop, trendState: state || undefined, trendDays });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAlerts = (crop: string, currentPrice?: number) => {
    setAlertCrop(crop);
    if (currentPrice) setAlertPrice(currentPrice);
    setActiveTab('alerts');
    syncUrlToHistory({ tab: 'alerts', alertCrop: crop, alertPrice: currentPrice || alertPrice });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboardFilterChange = useCallback(
    (filters: { crop?: string; state?: string; days?: number; query?: string }) => {
      setDashboardState(filters.state || '');
      setDashboardDays(filters.days);
      setDashboardQuery(filters.query || '');
      if (filters.crop !== undefined) {
        setSelectedCrop(filters.crop);
      }

      if (activeTab === 'dashboard') {
        syncUrlToHistory(
          {
            tab: 'dashboard',
            crop: filters.crop || selectedCrop || undefined,
            state: filters.state || undefined,
            days: filters.days,
            q: filters.query || undefined,
          },
          true // replaceState on filter tweaking to keep history clean
        );
      }
    },
    [activeTab, selectedCrop]
  );

  const handleTrendsFilterChange = useCallback(
    (crop: string, state?: string, days?: number) => {
      setTrendCrop(crop);
      setTrendState(state || '');
      if (days) setTrendDays(days);

      if (activeTab === 'trends') {
        syncUrlToHistory(
          {
            tab: 'trends',
            trendCrop: crop,
            trendState: state || undefined,
            trendDays: days,
          },
          true
        );
      }
    },
    [activeTab]
  );

  const handleBuyersFilterChange = useCallback(
    (crop?: string, location?: string) => {
      setBuyerCrop(crop || '');
      setBuyerLocation(location || '');

      if (activeTab === 'buyers') {
        syncUrlToHistory(
          {
            tab: 'buyers',
            buyerCrop: crop || undefined,
            buyerLocation: location || undefined,
          },
          true
        );
      }
    },
    [activeTab]
  );

  const handleAlertsFilterChange = useCallback(
    (crop: string, price?: number) => {
      setAlertCrop(crop);
      if (price) setAlertPrice(price);

      if (activeTab === 'alerts') {
        syncUrlToHistory(
          {
            tab: 'alerts',
            alertCrop: crop,
            alertPrice: price,
          },
          true
        );
      }
    },
    [activeTab]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Main Content Area */}
      {activeTab === 'soil' ? (
        <main className="flex-1 w-full overflow-hidden">
          <SoilMonitorView />
        </main>
      ) : (
        <>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Market Stats & Crop Quick Filter Ticker */}
            <StatsTicker
              stats={stats}
              selectedCrop={selectedCrop}
              onSelectCrop={(crop) => {
                setSelectedCrop(crop);
                if (activeTab !== 'dashboard') handleTabChange('dashboard');
                else handleDashboardFilterChange({ crop, state: dashboardState, days: dashboardDays, query: dashboardQuery });
              }}
            />

            {/* Tab Pages with Deep Linking State Handlers */}
            {activeTab === 'dashboard' && (
              <DashboardPage
                selectedCrop={selectedCrop}
                initialState={dashboardState}
                initialDays={dashboardDays}
                initialSearchQuery={dashboardQuery}
                onSelectCrop={setSelectedCrop}
                onFilterChange={handleDashboardFilterChange}
                onNavigateToTrends={handleNavigateToTrends}
                onNavigateToAlerts={handleNavigateToAlerts}
              />
            )}

            {activeTab === 'trends' && (
              <TrendsPage
                initialCrop={trendCrop}
                initialState={trendState}
                initialDays={trendDays}
                onFilterChange={handleTrendsFilterChange}
              />
            )}

            {activeTab === 'buyers' && (
              <BuyersPage
                initialCrop={buyerCrop}
                initialLocation={buyerLocation}
                onFilterChange={handleBuyersFilterChange}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsPage
                initialCrop={alertCrop}
                initialPrice={alertPrice}
                onFilterChange={handleAlertsFilterChange}
              />
            )}
          </main>

          {/* Footer with Government AgMarkNet Attribution */}
          <Footer />
        </>
      )}

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
