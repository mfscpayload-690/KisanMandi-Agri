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
import { api, type StatsResponse } from './api/client';

export const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trends' | 'buyers' | 'alerts'>('dashboard');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  
  // Navigation parameter passing
  const [trendCrop, setTrendCrop] = useState<string>('Wheat');
  const [trendState, setTrendState] = useState<string>('');
  const [alertCrop, setAlertCrop] = useState<string>('Wheat');
  const [alertPrice, setAlertPrice] = useState<number>(2500);

  // Polling states
  const [lastUpdatedSeconds, setLastUpdatedSeconds] = useState(0);

  const fetchStatsData = useCallback(() => {
    api.getStats()
      .then((res) => {
        setStats(res);
        setLastUpdatedSeconds(0);
      })
      .catch((err) => console.error('Stats polling error:', err));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  // 5-second polling interval as requested in Step 2.5
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchStatsData();
    }, 5000);

    const secondsTicker = setInterval(() => {
      setLastUpdatedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(secondsTicker);
    };
  }, [fetchStatsData]);

  const handleNavigateToTrends = (crop: string, state?: string) => {
    setTrendCrop(crop);
    setTrendState(state || '');
    setActiveTab('trends');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAlerts = (crop: string, currentPrice?: number) => {
    setAlertCrop(crop);
    if (currentPrice) setAlertPrice(currentPrice);
    setActiveTab('alerts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastUpdatedSeconds={lastUpdatedSeconds}
        onRefresh={fetchStatsData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Market Stats & Crop Quick Filter Ticker */}
        <StatsTicker
          stats={stats}
          selectedCrop={selectedCrop}
          onSelectCrop={(crop) => {
            setSelectedCrop(crop);
            if (activeTab !== 'dashboard') setActiveTab('dashboard');
          }}
        />

        {/* Tab Pages */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            selectedCrop={selectedCrop}
            onSelectCrop={setSelectedCrop}
            onNavigateToTrends={handleNavigateToTrends}
            onNavigateToAlerts={handleNavigateToAlerts}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsPage
            initialCrop={trendCrop}
            initialState={trendState}
          />
        )}

        {activeTab === 'buyers' && <BuyersPage />}

        {activeTab === 'alerts' && (
          <AlertsPage
            initialCrop={alertCrop}
            initialPrice={alertPrice}
          />
        )}
      </main>

      {/* Footer with Government AgMarkNet Attribution */}
      <Footer />

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
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
