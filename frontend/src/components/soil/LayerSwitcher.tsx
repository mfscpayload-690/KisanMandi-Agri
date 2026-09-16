import React from 'react';
import { X, Layers } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import type { BasemapType } from '../../types/soil';

const BASEMAP_OPTIONS: { id: BasemapType; label: string; desc: string }[] = [
  { id: 'esri_satellite', label: 'ESRI World Imagery', desc: 'High-res satellite vegetation & terrain' },
  { id: 'bhuvan_lulc', label: 'ISRO Bhuvan LULC (Live)', desc: 'Official NRSC 1:50K Land Use & Vegetative Cover' },
  { id: 'carto_dark', label: 'Carto Dark Matter', desc: 'Sleek dark contrast for risk choropleth' },
  { id: 'opentopomap', label: 'OpenTopoMap', desc: 'Contour lines & Western Ghats relief' },
  { id: 'osm', label: 'OpenStreetMap', desc: 'Standard street & administrative grid' },
];

export const LayerSwitcher: React.FC = () => {
  const {
    isLayerSwitcherOpen,
    setLayerSwitcherOpen,
    basemap,
    setBasemap,
    overlayOpacity,
    setOverlayOpacity,
    showHotspotMarkers,
    toggleHotspots,
    showDistrictBoundaries,
    toggleBoundaries,
  } = useMapStore();

  if (!isLayerSwitcherOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-40 w-80 bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] rounded-2xl shadow-2xl p-4 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2C3E36]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h4 className="font-outfit text-sm font-bold text-white">Map Layers & Styling</h4>
        </div>
        <button
          onClick={() => setLayerSwitcherOpen(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-3 space-y-4 text-xs">
        {/* Basemap Selection */}
        <div>
          <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Base Map Provider
          </label>
          <div className="space-y-1.5">
            {BASEMAP_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                  basemap === opt.id
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-[#1F2B26]/60 border-[#2C3E36] hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="basemap"
                  checked={basemap === opt.id}
                  onChange={() => setBasemap(opt.id)}
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-white">{opt.label}</div>
                  <div className="text-[10px] text-slate-400">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Overlay Opacity Slider */}
        <div className="pt-2 border-t border-[#2C3E36]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-300">Choropleth Opacity</span>
            <span className="font-mono text-emerald-400 font-bold">{Math.round(overlayOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 bg-[#0F1411] rounded-lg cursor-pointer"
          />
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-[#2C3E36] space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">Centroid Hotspot Badges</span>
            <input
              type="checkbox"
              checked={showHotspotMarkers}
              onChange={() => toggleHotspots()}
              className="accent-emerald-500 w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">District Boundaries</span>
            <input
              type="checkbox"
              checked={showDistrictBoundaries}
              onChange={() => toggleBoundaries()}
              className="accent-emerald-500 w-4 h-4 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
