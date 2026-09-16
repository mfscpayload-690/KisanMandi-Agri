import React, { useState } from 'react';
import { X, Database, Satellite, Globe2, CheckCircle2 } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import type { DataSourceMode } from '../../types/soil';

export const DataSourceDialog: React.FC = () => {
  const { isDataSourceDialogOpen, setDataSourceDialogOpen, dataSourceMode, setDataSourceMode } = useMapStore();
  const [selected, setSelected] = useState<DataSourceMode>(dataSourceMode);
  const [geeKey, setGeeKey] = useState('');
  const [bhuvanToken, setBhuvanToken] = useState('');

  if (!isDataSourceDialogOpen) return null;

  const handleSave = () => {
    setDataSourceMode(selected);
    setDataSourceDialogOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#17201C] border border-[#2C3E36] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C3E36] bg-[#0F1411]">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-outfit text-lg font-bold text-white tracking-wide">Data Source Configuration</h3>
          </div>
          <button
            onClick={() => setDataSourceDialogOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Select the satellite data acquisition pipeline for RUSLE calculations across Kerala.
            By default, pre-packaged high-resolution GeoJSON models are used offline.
          </p>

          <div className="space-y-3">
            {/* Option 1: Verified GeoJSON Registry */}
            <label
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selected === 'bundled'
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-[#1F2B26] border-[#2C3E36] hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="data_mode"
                checked={selected === 'bundled'}
                onChange={() => setSelected('bundled')}
                className="mt-1 accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-white text-sm">ISRO & NBSS&LUP Verified Registry</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Verified</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  14 Kerala districts and 76 taluks with calibrated ICAR-NBSS&LUP field surveys and RUSLE baseline parameters. Authentic OpenStreetMap administrative geometries.
                </p>
              </div>
            </label>

            {/* Option 2: GEE Proxy */}
            <label
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selected === 'gee_proxy'
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-[#1F2B26] border-[#2C3E36] hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="data_mode"
                checked={selected === 'gee_proxy'}
                onChange={() => setSelected('gee_proxy')}
                className="mt-1 accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-sky-400" />
                  <span className="font-medium text-white text-sm">Google Earth Engine (GEE Proxy)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Connect live CHIRPS rainfall erosivity + Sentinel-2 NDVI vegetative cover via GEE Python API proxy.
                </p>
                {selected === 'gee_proxy' && (
                  <div className="mt-3 pt-2 border-t border-[#2C3E36]">
                    <label className="text-[11px] text-slate-400 block mb-1">Service Account Email / Key Path</label>
                    <input
                      type="text"
                      placeholder="e.g. kisan-gee@project.iam.gserviceaccount.com"
                      value={geeKey}
                      onChange={(e) => setGeeKey(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-[#0F1411] border border-[#2C3E36] text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: ISRO Bhuvan */}
            <label
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selected === 'bhuvan_wms'
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-[#1F2B26] border-[#2C3E36] hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="data_mode"
                checked={selected === 'bhuvan_wms'}
                onChange={() => setSelected('bhuvan_wms')}
                className="mt-1 accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-white text-sm">ISRO Bhuvan WMS Gateway</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  NRSC Bhuvan National Geoportal WMS soil degradation and land degradation layers.
                </p>
                {selected === 'bhuvan_wms' && (
                  <div className="mt-3 pt-2 border-t border-[#2C3E36]">
                    <label className="text-[11px] text-slate-400 block mb-1">Bhuvan NRSC User Token</label>
                    <input
                      type="text"
                      placeholder="Enter Bhuvan API Token"
                      value={bhuvanToken}
                      onChange={(e) => setBhuvanToken(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-[#0F1411] border border-[#2C3E36] text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C3E36] bg-[#0F1411]">
          <button
            onClick={() => setDataSourceDialogOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
