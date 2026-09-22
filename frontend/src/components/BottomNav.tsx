import React from 'react';
import { TrendingUp, LineChart, Users, Bell, Mountain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: 'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil';
  setActiveTab: (tab: 'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('dashboardNav'), icon: TrendingUp },
    { id: 'trends', label: t('trendsNav'), icon: LineChart },
    { id: 'buyers', label: t('buyersNav'), icon: Users },
    { id: 'alerts', label: t('alertsNav'), icon: Bell },
    { id: 'soil', label: 'Soil & Eco', icon: Mountain },
  ] as const;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-100/90 text-emerald-800' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
