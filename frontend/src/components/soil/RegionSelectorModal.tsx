import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';
import type { DistrictFeature, TalukFeature } from '../../types/soil';

interface RegionSelectorModalProps {
  districts: DistrictFeature[];
  taluks: TalukFeature[];
}

export const RegionSelectorModal: React.FC<RegionSelectorModalProps> = ({ districts, taluks }) => {
  const {
    isRegionModalOpen,
    setRegionModalOpen,
    activeYear,
    selectDistrict,
    selectTaluk,
    setGranularity,
    flyTo
  } = useMapStore();

  const [activeTab, setActiveTab] = useState<'districts' | 'taluks'>('districts');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isRegionModalOpen) return null;

  const query = filterQuery.trim().toLowerCase();

  // Filter & sort districts descending by active year score
  const filteredDistricts = districts
    .map((d) => ({
      feature: d,
      score: d.properties.time_series?.[activeYear] ?? d.properties.rusle.A,
    }))
    .filter(({ feature }) => {
      if (!query) return true;
      const p = feature.properties;
      return (
        p.district_name.toLowerCase().includes(query) ||
        p.malayalam_name.includes(query) ||
        p.terrain_category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => b.score - a.score);

  // Filter & sort taluks descending by score
  const filteredTaluks = taluks
    .map((t) => ({
      feature: t,
      score: t.properties.time_series?.[activeYear] ?? t.properties.rusle.A,
    }))
    .filter(({ feature }) => {
      if (!query) return true;
      const p = feature.properties;
      return (
        p.taluk_name.toLowerCase().includes(query) ||
        p.malayalam_name.includes(query) ||
        p.district_name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => b.score - a.score);

  const handleSelectDistrict = (d: DistrictFeature) => {
    setGranularity('district');
    selectDistrict(d.properties);
    flyTo(d.properties.centroid.lat, d.properties.centroid.lng, 9.5);
    setRegionModalOpen(false);
  };

  const handleSelectTaluk = (t: TalukFeature) => {
    setGranularity('taluk');
    selectTaluk(t.properties);
    flyTo(t.properties.centroid.lat, t.properties.centroid.lng, 11);
    setRegionModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#17201C] border border-[#2C3E36] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C3E36] bg-[#0F1411]">
          <div>
            <h3 className="font-outfit text-lg font-bold text-white tracking-wide">Select Kerala Region</h3>
            <p className="text-xs text-slate-400">Ranked by annual RUSLE soil loss risk (Year {activeYear})</p>
          </div>
          <button
            onClick={() => setRegionModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-4 border-b border-[#2C3E36] bg-[#1F2B26]/40 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('districts')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'districts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#17201C] text-slate-400 hover:text-white border border-[#2C3E36]'
              }`}
            >
              Districts (14)
            </button>
            <button
              onClick={() => setActiveTab('taluks')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'taluks'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#17201C] text-slate-400 hover:text-white border border-[#2C3E36]'
              }`}
            >
              Taluks & Micro-Regions ({taluks.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Filter ${activeTab === 'districts' ? '14 districts' : 'taluks'}...`}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0F1411] border border-[#2C3E36] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#2C3E36]">
          {activeTab === 'districts' ? (
            filteredDistricts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No districts found matching query</div>
            ) : (
              filteredDistricts.map(({ feature, score }) => {
                const p = feature.properties;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectDistrict(feature)}
                    className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#1F2B26] transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Score Circle Badge */}
                      <div
                        className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-md flex-shrink-0"
                        style={{ backgroundColor: colorForScore(score) }}
                      >
                        <span>{score}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-outfit font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                            {p.district_name}
                          </span>
                          <span className="text-xs text-slate-400">{p.malayalam_name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.terrain_category} • {p.taluks.length} taluks • HQ: {p.headquarters}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: colorForScore(score) }}
                      >
                        {score >= 40 ? 'Very Severe' : score >= 20 ? 'Severe' : score >= 10 ? 'High' : 'Moderate'}
                      </span>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            filteredTaluks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No taluks found matching query</div>
            ) : (
              filteredTaluks.map(({ feature, score }) => {
                const p = feature.properties;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectTaluk(feature)}
                    className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#1F2B26] transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Score Circle Badge */}
                      <div
                        className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-md flex-shrink-0"
                        style={{ backgroundColor: colorForScore(score) }}
                      >
                        <span>{score}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-outfit font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                            {p.taluk_name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">({p.district_name})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Elev: <span className="text-slate-300">{p.elevation_m}m</span> • Slope: <span className="text-slate-300">{p.slope_degrees}°</span> • {p.dominant_land_use.slice(0, 38)}...
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: colorForScore(score) }}
                      >
                        {score >= 40 ? 'Very Severe' : score >= 20 ? 'Severe' : score >= 10 ? 'High' : 'Moderate'}
                      </span>
                    </div>
                  </button>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
