import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Layers,
  Sparkles,
  X,
  ChevronDown
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';
import type { DistrictFeature, TalukFeature } from '../../types/soil';

interface TopSearchBarProps {
  districts: DistrictFeature[];
  taluks: TalukFeature[];
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({ districts, taluks }) => {
  const {
    granularity,
    setGranularity,
    searchQuery,
    setSearchQuery,
    selectDistrict,
    selectTaluk,
    selectedDistrict,
    selectedTaluk,
    flyTo,
    isRoiToolActive,
    setRoiActive,
    setRegionModalOpen,
    isLayerSwitcherOpen,
    setLayerSwitcherOpen,
    activeYear
  } = useMapStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter autocomplete matches
  const query = searchQuery.trim().toLowerCase();
  const matchedDistricts = query
    ? districts.filter(
        (d) =>
          d.properties.district_name.toLowerCase().includes(query) ||
          d.properties.malayalam_name.includes(query)
      ).slice(0, 3)
    : [];

  const matchedTaluks = query
    ? taluks.filter(
        (t) =>
          t.properties.taluk_name.toLowerCase().includes(query) ||
          t.properties.malayalam_name.includes(query) ||
          t.properties.district_name.toLowerCase().includes(query)
      ).slice(0, 5)
    : [];

  const handleSelectDistrictItem = (d: DistrictFeature) => {
    selectDistrict(d.properties);
    flyTo(d.properties.centroid.lat, d.properties.centroid.lng, 9.5);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleSelectTalukItem = (t: TalukFeature) => {
    setGranularity('taluk');
    selectTaluk(t.properties);
    flyTo(t.properties.centroid.lat, t.properties.centroid.lng, 11);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const activeSelectionName = selectedDistrict
    ? `${selectedDistrict.district_name} District`
    : selectedTaluk
    ? `${selectedTaluk.taluk_name} Taluk (${selectedTaluk.district_name})`
    : null;

  return (
    <div className="flex flex-col gap-2.5 max-w-2xl w-full" ref={dropdownRef}>
      {/* Search Input Row */}
      <div className="flex items-center gap-2">
        {/* Autocomplete Input */}
        <div className="relative flex-1">
          <div className="flex items-center bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] rounded-2xl shadow-xl px-3 py-2 text-slate-200 focus-within:border-emerald-500 transition-colors">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search 61 taluks or 14 districts in Kerala..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {isDropdownOpen && query && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#17201C] border border-[#2C3E36] rounded-xl shadow-2xl overflow-hidden z-50 text-xs divide-y divide-[#2C3E36]">
              {matchedDistricts.length === 0 && matchedTaluks.length === 0 ? (
                <div className="p-3 text-slate-400 text-center">No regions matching "{query}"</div>
              ) : (
                <>
                  {matchedDistricts.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Districts</div>
                      {matchedDistricts.map((d) => {
                        const score = d.properties.time_series?.[activeYear] ?? d.properties.rusle.A;
                        return (
                          <button
                            key={d.id}
                            onClick={() => handleSelectDistrictItem(d)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1F2B26] text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-semibold text-white">{d.properties.district_name}</span>
                              <span className="text-[11px] text-slate-400">{d.properties.malayalam_name}</span>
                            </div>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: colorForScore(score) }}
                            >
                              {score} t/ha
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {matchedTaluks.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Taluks (Micro-Regions)</div>
                      {matchedTaluks.map((t) => {
                        const score = t.properties.time_series?.[activeYear] ?? t.properties.rusle.A;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleSelectTalukItem(t)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1F2B26] text-left transition-colors cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Compass className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-semibold text-white">{t.properties.taluk_name}</span>
                                <span className="text-[11px] text-slate-400">({t.properties.district_name})</span>
                              </div>
                              <div className="text-[10px] text-slate-400 ml-5.5">
                                Elev: {t.properties.elevation_m}m • Slope: {t.properties.slope_degrees}°
                              </div>
                            </div>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: colorForScore(score) }}
                            >
                              {score} t/ha
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Select Region Modal Trigger Button */}
        <button
          onClick={() => setRegionModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold
            bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] text-slate-200
            hover:text-white hover:border-slate-500 shadow-xl transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Select Region</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Custom ROI Toggle Button */}
        <button
          onClick={() => setRoiActive(!isRoiToolActive)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold backdrop-blur-md shadow-xl transition-all cursor-pointer whitespace-nowrap ${
            isRoiToolActive
              ? 'bg-amber-600/90 text-white border-2 border-amber-300 ring-4 ring-amber-500/30 animate-pulse'
              : 'bg-[#17201C]/95 border border-[#2C3E36] text-slate-200 hover:text-white hover:border-slate-500'
          }`}
          title="Inspect custom circular area of interest"
        >
          <span>📐 ROI</span>
          {isRoiToolActive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
        </button>

        {/* Layers Switcher Button */}
        <button
          onClick={() => setLayerSwitcherOpen(!isLayerSwitcherOpen)}
          className="flex items-center justify-center p-2 rounded-2xl text-xs font-semibold
            bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] text-slate-200
            hover:text-white hover:border-slate-500 shadow-xl transition-all cursor-pointer"
          title="Map Basemaps & Layers"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Granularity Chips & Selection Indicator */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-0.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGranularity('district')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              granularity === 'district'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                : 'bg-[#17201C]/80 border border-[#2C3E36] text-slate-300 hover:text-white'
            }`}
          >
            <span>Districts (14)</span>
          </button>

          <button
            onClick={() => setGranularity('taluk')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              granularity === 'taluk'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                : 'bg-[#17201C]/80 border border-[#2C3E36] text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Taluk Precision ({taluks.length || 61})</span>
          </button>
        </div>

        {/* Selected badge */}
        {activeSelectionName && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs animate-in fade-in">
            <span className="font-semibold truncate max-w-[180px]">{activeSelectionName}</span>
            <button
              onClick={() => {
                selectDistrict(null);
                selectTaluk(null);
              }}
              className="p-0.5 hover:text-white rounded-full hover:bg-emerald-800/60"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
