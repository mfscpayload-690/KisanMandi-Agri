import React from 'react';
import { AlertTriangle, Settings2 } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export const DemoDataBanner: React.FC = () => {
  const { setDataSourceDialogOpen, dataSourceMode } = useMapStore();

  const label = dataSourceMode === 'bundled'
    ? 'DEMO DATA (Sample Mode)'
    : dataSourceMode === 'gee_proxy'
    ? 'GEE SATELLITE (Live Mode)'
    : 'BHUVAN WMS (Live Mode)';

  return (
    <button
      onClick={() => setDataSourceDialogOpen(true)}
      title="Configure satellite & spatial data providers"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        bg-amber-950/70 border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-lg
        hover:bg-amber-900/80 hover:border-amber-400 transition-all cursor-pointer group"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span>{label}</span>
      <Settings2 className="w-3 h-3 text-amber-400/70 group-hover:text-amber-300 transition-transform group-hover:rotate-45" />
    </button>
  );
};
