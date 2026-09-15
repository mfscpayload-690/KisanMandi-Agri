import React from 'react';
import { Sprout, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-slate-200 mt-12 pb-20 md:pb-8 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">{t('appName')}</span>
            <span>— {t('tagline')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Source: AgMarkNet (Ministry of Agriculture & Farmers Welfare, GoI)
            </span>
            <span>•</span>
            <span>Local MVP (Zero External Deployments)</span>
          </div>

        </div>
      </div>
    </footer>
  );
};
