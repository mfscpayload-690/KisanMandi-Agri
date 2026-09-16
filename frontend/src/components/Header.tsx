import React from 'react';
import { Sprout, Globe, TrendingUp, LineChart, Users, Bell, Mountain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../i18n/translations';

import { CustomSelect } from './CustomSelect';

interface HeaderProps {
  activeTab: 'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil';
  setActiveTab: (tab: 'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { language, setLanguage, t, languages } = useLanguage();

  const languageOptions = languages.map((l) => ({
    value: l.code,
    label: l.nativeName,
    sublabel: l.name,
  }));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  {t('appName')}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse"></span>
                  {t('liveBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              {t('dashboardNav')}
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'trends'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LineChart className="w-4 h-4 text-emerald-600" />
              {t('trendsNav')}
            </button>
            <button
              onClick={() => setActiveTab('buyers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'buyers'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              {t('buyersNav')}
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'alerts'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-600" />
              {t('alertsNav')}
            </button>
            <button
              onClick={() => setActiveTab('soil')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'soil'
                  ? 'bg-emerald-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Mountain className="w-4 h-4 text-emerald-500" />
              Soil & Ecology
            </button>
          </nav>

          {/* Right Controls: Custom CSS Language Dropdown */}
          <div className="flex items-center">
            <CustomSelect
              value={language}
              onChange={(val) => setLanguage(val as SupportedLanguage)}
              options={languageOptions}
              icon={<Globe className="w-4 h-4 text-emerald-600 shrink-0" />}
              align="right"
              buttonClassName="py-1.5 sm:py-2 px-3 bg-slate-50 hover:bg-white border-slate-200 text-xs sm:text-sm font-medium rounded-xl"
              dropdownClassName="w-60"
            />
          </div>

        </div>
      </div>
    </header>
  );
};
