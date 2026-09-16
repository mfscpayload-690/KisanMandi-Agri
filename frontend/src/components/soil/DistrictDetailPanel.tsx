import React from 'react';
import { X, Mountain, TreePine, Layers, ShieldCheck } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';
import { RusleBreakdownBars } from './RusleBreakdownBars';
import { ErosionTrendChart } from './ErosionTrendChart';
import { ShareButton } from '../ShareButton';
import type { TalukFeature } from '../../types/soil';

interface DistrictDetailPanelProps {
  taluks: TalukFeature[];
}

export const DistrictDetailPanel: React.FC<DistrictDetailPanelProps> = ({ taluks }) => {
  const {
    selectedDistrict,
    selectDistrict,
    selectTaluk,
    setGranularity,
    flyTo,
    activeYear
  } = useMapStore();

  if (!selectedDistrict) return null;

  const score = selectedDistrict.time_series?.[activeYear] ?? selectedDistrict.rusle.A;
  const riskCategory = score >= 40 ? 'Very Severe' : score >= 20 ? 'Severe' : score >= 10 ? 'High' : score >= 5 ? 'Moderate' : 'Low';
  const riskColor = colorForScore(score);

  const handleTalukClick = (talukName: string) => {
    const matched = taluks.find(
      (t) =>
        t.properties.district_name.toLowerCase() === selectedDistrict.district_name.toLowerCase() &&
        t.properties.taluk_name.toLowerCase().includes(talukName.toLowerCase())
    );
    if (matched) {
      setGranularity('taluk');
      selectTaluk(matched.properties);
      flyTo(matched.properties.centroid.lat, matched.properties.centroid.lng, 11);
    }
  };

  return (
    <div className="w-full lg:w-[380px] bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#2C3E36] bg-[#0F1411]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-outfit text-xl font-black text-white tracking-wide">
                {selectedDistrict.district_name}
              </h3>
              <span className="text-sm text-slate-400 font-medium">
                {selectedDistrict.malayalam_name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              HQ: {selectedDistrict.headquarters} • Area: {selectedDistrict.area_sq_km.toLocaleString()} km²
            </p>
          </div>

          <div className="flex items-center gap-1">
            <ShareButton
              variant="icon"
              title={`${selectedDistrict.district_name} (${selectedDistrict.malayalam_name}) Soil Erosion Assessment`}
              description={`Annual RUSLE Soil Loss: ${score} t/ha/yr (${riskCategory} Risk, Year ${activeYear}). HQ: ${selectedDistrict.headquarters}.`}
              className="text-slate-400 hover:text-emerald-400 hover:bg-white/5"
              params={{
                tab: 'soil',
                granularity: 'district',
                region: selectedDistrict.id,
                year: activeYear,
              }}
            />
            <button
              onClick={() => selectDistrict(null)}
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
              Annual Soil Erosion ({activeYear})
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
        {/* Geographic Summary Grid */}
        <div className="grid grid-cols-1 gap-2">
          <div className="p-2.5 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>Terrain Zone</span>
            </div>
            <p className="text-white font-medium">{selectedDistrict.terrain_category}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dominant Land Cover</span>
            </div>
            <p className="text-white font-medium">{selectedDistrict.dominant_land_use}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0F1411] border border-[#2C3E36]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Soil Composition</span>
            </div>
            <p className="text-white font-medium">{selectedDistrict.soil_type}</p>
          </div>
        </div>

        {/* Taluks Pills */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
            Revenue Taluks ({selectedDistrict.taluks.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedDistrict.taluks.map((tName) => (
              <button
                key={tName}
                onClick={() => handleTalukClick(tName)}
                className="px-2.5 py-1 rounded-lg bg-[#1F2B26] border border-[#2C3E36] hover:border-emerald-500 text-slate-200 hover:text-white transition-all cursor-pointer text-xs"
                title={`Inspect micro-topography for ${tName}`}
              >
                {tName} →
              </button>
            ))}
          </div>
        </div>

        {/* RUSLE Breakdown Bars with Simulation Slider */}
        <RusleBreakdownBars
          factors={selectedDistrict.rusle}
          baselineLoss={score}
          showSimulationSlider={true}
        />

        {/* Recharts Time Series Trend Chart */}
        <ErosionTrendChart timeSeries={selectedDistrict.time_series} />

        {/* Conservation Measures List */}
        {selectedDistrict.conservation && selectedDistrict.conservation.length > 0 && (
          <div className="p-3 rounded-xl bg-[#0F1411] border border-[#2C3E36] space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Recommended Soil Conservation Measures</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              {selectedDistrict.conservation.map((item, idx) => (
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
