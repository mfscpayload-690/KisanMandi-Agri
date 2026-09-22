import React from 'react';
import { ShieldCheck, Globe2 } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export const DemoDataBanner: React.FC = () => {
  const { setDataSourceDialogOpen, dataSourceMode } = useMapStore();

  const label = dataSourceMode === 'bhuvan_wms'
    ? 'ISRO Bhuvan Live WMS'
    : dataSourceMode === 'gee_proxy'
    ? 'Google Earth Engine'
    : 'ISRO & NBSS&LUP Verified';

  return (
    <button
      onClick={() => setDataSourceDialogOpen(true)}
      title="View geospatial data provider and satellite provenance"
      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold
        bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-lg
        hover:bg-emerald-900/90 hover:border-emerald-400 transition-all cursor-pointer group shrink-0 whitespace-nowrap"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">ISRO / NBSS&LUP</span>
      <Globe2 className="w-3 h-3 text-emerald-400/80 group-hover:text-emerald-300 transition-transform group-hover:rotate-12" />
    </button>
  );
};
