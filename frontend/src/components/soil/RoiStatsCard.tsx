import React from 'react';
import { X, ShieldAlert, MapPin } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';

export const RoiStatsCard: React.FC = () => {
  const {
    isRoiToolActive,
    roiCenter,
    roiRadiusKm,
    setRoiRadiusKm,
    roiStats,
    roiLoading,
    clearRoi
  } = useMapStore();

  if (!isRoiToolActive) return null;

  return (
    <div className="bg-[#17201C]/95 backdrop-blur-md border-2 border-amber-500/40 rounded-2xl shadow-2xl p-4 w-84 text-slate-200 animate-in fade-in slide-in-from-left-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2C3E36]">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📐</span>
          <h4 className="font-outfit text-sm font-bold text-white tracking-wide">Custom Area Analysis</h4>
        </div>
        <button
          onClick={clearRoi}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!roiCenter ? (
        <div className="py-6 text-center text-xs text-amber-300/90 animate-pulse">
          <MapPin className="w-6 h-6 mx-auto mb-2 text-amber-400" />
          <p className="font-semibold">Tap anywhere on the map</p>
          <p className="text-[11px] text-slate-400 mt-1">Place a {roiRadiusKm}km radius inspection circle</p>
        </div>
      ) : roiLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Computing zonal spatial statistics...</span>
        </div>
      ) : roiStats ? (
        <div className="py-2.5 space-y-3 text-xs">
          {/* Top stats line */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Survey Area:</span>
            <span className="font-mono font-bold text-white">{roiStats.area_sq_km} km²</span>
          </div>

          {/* Mean loss score hero */}
          <div className="p-2.5 rounded-xl bg-[#0F1411] border border-[#2C3E36] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mean Soil Loss</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-white font-mono">{roiStats.mean_loss}</span>
                <span className="text-[11px] text-slate-400">t/ha/yr</span>
              </div>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-md uppercase"
              style={{ backgroundColor: colorForScore(roiStats.mean_loss) }}
            >
              {roiStats.dominant_risk}
            </span>
          </div>

          {/* Min / Max & Total Tons */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#1F2B26]/60 border border-[#2C3E36]">
              <span className="text-slate-400 block text-[10px]">Range</span>
              <span className="font-mono font-semibold text-slate-200">
                {roiStats.min_loss} – {roiStats.max_loss} t/ha
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#1F2B26]/60 border border-[#2C3E36]">
              <span className="text-slate-400 block text-[10px]">Annual Mass Loss</span>
              <span className="font-mono font-semibold text-amber-300">
                {(roiStats.total_tons_per_year / 1000).toFixed(1)}k t/yr
              </span>
            </div>
          </div>

          {/* Intersecting Regions */}
          {roiStats.intersecting_regions && roiStats.intersecting_regions.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Intersecting Catchments ({roiStats.intersecting_regions.length})
              </span>
              <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {roiStats.intersecting_regions.map((name, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="truncate">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conservation Priority Callout */}
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold block text-amber-300 mb-0.5">Conservation Directive</span>
              {roiStats.conservation_priority}
            </div>
          </div>

          {/* Radius Adjuster */}
          <div className="pt-2 border-t border-[#2C3E36]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">Radius:</span>
              <span className="font-mono font-bold text-emerald-400">{roiRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={roiRadiusKm}
              onChange={(e) => setRoiRadiusKm(parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-[#0F1411] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
