import React from 'react';
import { X, Mountain, Compass, ShieldCheck, TreePine, Layers } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';
import { MiniBarChart } from './MiniBarChart';
import { ShareButton } from '../ShareButton';

export const TalukDetailPanel: React.FC = () => {
  const { selectedTaluk, selectTaluk, activeYear } = useMapStore();

  if (!selectedTaluk) return null;

  const score = selectedTaluk.time_series?.[activeYear] ?? selectedTaluk.rusle.A;
  const riskCategory = score >= 40 ? 'Very Severe' : score >= 20 ? 'Severe' : score >= 10 ? 'High' : score >= 5 ? 'Moderate' : 'Low';
  const riskColor = colorForScore(score);

  return (
    <div className="w-full lg:w-[380px] bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#2C3E36] bg-[#0F1411]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-outfit text-xl font-black text-white tracking-wide">
                {selectedTaluk.taluk_name}
              </h3>
              <span className="text-sm text-slate-400 font-medium">
                {selectedTaluk.malayalam_name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              District: <span className="text-emerald-400 font-semibold">{selectedTaluk.district_name}</span> • Area: {selectedTaluk.area_sq_km} km²
            </p>
          </div>

          <div className="flex items-center gap-1">
            <ShareButton
              variant="icon"
              title={`${selectedTaluk.taluk_name} Taluk (${selectedTaluk.district_name}) Soil Erosion Report`}
              description={`Annual RUSLE Loss: ${score} t/ha/yr (${riskCategory} Risk). Elevation: ${selectedTaluk.elevation_m}m, Slope: ${selectedTaluk.slope_degrees}°.`}
              className="text-slate-400 hover:text-emerald-400 hover:bg-white/5"
              params={{
                tab: 'soil',
                granularity: 'taluk',
                region: selectedTaluk.id,
                year: activeYear,
              }}
            />
            <button
              onClick={() => selectTaluk(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Severity Banner */}
        <div
          className="mt-3 p-2.5 rounded-xl flex items-center justify-between text-white shadow-md"
          style={{ backgroundColor: riskColor }}
        >
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-90 block">
              Catchment Vulnerability ({activeYear})
            </span>
            <span className="font-outfit font-black text-lg">{riskCategory} Risk</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-black">{score}</span>
            <span className="text-[10px] block opacity-90">t/ha/yr</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Micro-topography 2-column grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>Mean Elevation</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white font-mono">{selectedTaluk.elevation_m}</span>
              <span className="text-slate-400 text-xs">meters MSL</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold">
              <Compass className="w-3.5 h-3.5 text-red-400" />
              <span>Slope Gradient</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white font-mono">{selectedTaluk.slope_degrees}°</span>
              <span className="text-slate-400 text-xs">
                {selectedTaluk.slope_degrees > 20 ? 'Steep' : selectedTaluk.slope_degrees > 10 ? 'Moderate' : 'Gentle'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5 text-[11px] font-bold">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Land Use & Crop System</span>
            </div>
            <p className="text-white font-medium">{selectedTaluk.dominant_land_use}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5 text-[11px] font-bold">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Soil Texture & Erodibility</span>
            </div>
            <p className="text-white font-medium">{selectedTaluk.soil_type}</p>
          </div>
        </div>

        {/* Compact RUSLE factors table */}
        <div className="p-3 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Local Micro-RUSLE Parameters
          </span>
          <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
            <div className="p-1.5 rounded-lg bg-[#1F2B26]">
              <span className="text-[9px] text-[#16A085] font-bold block">R</span>
              <span className="font-bold text-xs text-white">{selectedTaluk.rusle.R}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#1F2B26]">
              <span className="text-[9px] text-[#D48B38] font-bold block">K</span>
              <span className="font-bold text-xs text-white">{selectedTaluk.rusle.K}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#1F2B26]">
              <span className="text-[9px] text-[#C2593F] font-bold block">LS</span>
              <span className="font-bold text-xs text-white">{selectedTaluk.rusle.LS}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#1F2B26]">
              <span className="text-[9px] text-[#00E676] font-bold block">C</span>
              <span className="font-bold text-xs text-white">{selectedTaluk.rusle.C}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#1F2B26]">
              <span className="text-[9px] text-[#9B59B6] font-bold block">P</span>
              <span className="font-bold text-xs text-white">{selectedTaluk.rusle.P}</span>
            </div>
          </div>
        </div>

        {/* Mini 7-Bar Historical Trend */}
        <MiniBarChart timeSeries={selectedTaluk.time_series} />

        {/* Conservation Tips */}
        {selectedTaluk.conservation && selectedTaluk.conservation.length > 0 && (
          <div className="p-3 rounded-xl bg-[#0F1411] border border-[#2C3E36] space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Micro-Watershed Conservation Advice</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              {selectedTaluk.conservation.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
