import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { RISK_COLORS } from '../../utils/rusle';

interface LegendItem {
  name: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Very Severe';
  range: string;
  color: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { name: 'Low', range: '< 5 t/ha/yr', color: RISK_COLORS.low },
  { name: 'Moderate', range: '5–10 t/ha/yr', color: RISK_COLORS.moderate },
  { name: 'High', range: '10–20 t/ha/yr', color: RISK_COLORS.high },
  { name: 'Severe', range: '20–40 t/ha/yr', color: RISK_COLORS.severe },
  { name: 'Very Severe', range: '> 40 t/ha/yr', color: RISK_COLORS.very_severe },
];

export const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return false;
  });
  const { activeCategories, toggleCategory } = useMapStore();

  return (
    <div className="bg-[#17201C]/90 backdrop-blur-md border border-[#2C3E36] rounded-2xl shadow-2xl p-3 text-slate-200 transition-all select-none">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-outfit uppercase tracking-wider text-[11px]">Erosion Risk (t/ha/yr)</span>
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {/* Rows */}
      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-[#2C3E36]/80 space-y-1.5">
          {LEGEND_ITEMS.map((item) => {
            const isActive = activeCategories.includes(item.name);
            return (
              <button
                key={item.name}
                onClick={() => toggleCategory(item.name)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'hover:bg-white/5 opacity-100'
                    : 'opacity-40 line-through bg-black/20'
                }`}
                title={`Click to filter ${item.name} erosion risk`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-[11px] text-slate-200">{item.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{item.range}</span>
              </button>
            );
          })}
          <div className="pt-1 text-[9px] text-slate-400/80 text-center">
            ICAR / NBSS&LUP Risk Classification
          </div>
        </div>
      )}
    </div>
  );
};
