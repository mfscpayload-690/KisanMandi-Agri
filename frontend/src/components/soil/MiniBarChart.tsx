import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';

interface MiniBarChartProps {
  timeSeries: Record<string, number>;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ timeSeries }) => {
  const { activeYear, setYear } = useMapStore();

  const entries = Object.entries(timeSeries || {}).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return null;

  const maxVal = Math.max(...entries.map(([, v]) => Number(v)), 30);

  return (
    <div className="w-full bg-[#0F1411] border border-[#2C3E36] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Micro-Catchment History (2018–2024)
        </span>
        <span className="text-[10px] text-slate-500 font-mono">t/ha/yr</span>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-24 pt-4 px-1">
        {entries.map(([year, rawScore]) => {
          const score = Number(rawScore);
          const isCurrent = year === activeYear;
          const heightPx = Math.max(10, Math.min(68, Math.round((score / maxVal) * 68)));
          const barColor = colorForScore(score);

          return (
            <button
              key={year}
              onClick={() => setYear(year)}
              className="flex-1 flex flex-col items-center group cursor-pointer focus:outline-none"
              title={`Year ${year}: ${score} t/ha/yr`}
            >
              {/* Score label above bar */}
              <span
                className={`text-[9px] font-mono mb-1 transition-opacity ${
                  isCurrent ? 'font-extrabold text-white opacity-100' : 'text-slate-400 opacity-60 group-hover:opacity-100'
                }`}
              >
                {Math.round(score)}
              </span>

              {/* Bar */}
              <div
                style={{ height: `${heightPx}px`, backgroundColor: barColor }}
                className={`w-full max-w-[18px] rounded-t transition-all ${
                  isCurrent
                    ? 'ring-2 ring-white scale-105 shadow-md'
                    : 'opacity-75 group-hover:opacity-100 group-hover:scale-105'
                }`}
              />

              {/* Year label below */}
              <span
                className={`text-[10px] mt-1.5 font-mono ${
                  isCurrent ? 'font-bold text-emerald-400' : 'text-slate-400'
                }`}
              >
                '{year.slice(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
