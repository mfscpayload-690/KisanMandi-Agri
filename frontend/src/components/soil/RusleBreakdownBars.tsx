import React from 'react';
import { Sliders } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import type { RusleFactors } from '../../types/soil';

interface RusleBreakdownBarsProps {
  factors: RusleFactors;
  baselineLoss: number;
  showSimulationSlider?: boolean;
}

export const RusleBreakdownBars: React.FC<RusleBreakdownBarsProps> = ({
  factors,
  baselineLoss,
  showSimulationSlider = true,
}) => {
  const { simulatedPValue, setSimulatedP } = useMapStore();

  const factorConfigs = [
    {
      key: 'R',
      name: 'Rainfall Erosivity (R)',
      value: factors.R,
      unit: 'MJ·mm/ha·h·yr',
      source: 'IMD & NASA GPM Satellite Energy',
      color: '#16A085',
      percent: Math.min(100, Math.round((factors.R / 7000) * 100)),
    },
    {
      key: 'K',
      name: 'Soil Erodibility (K)',
      value: factors.K,
      unit: 't·ha·h/ha·MJ·mm',
      source: 'OpenLandMap Clay Content & Texture',
      color: '#D48B38',
      percent: Math.min(100, Math.round((factors.K / 0.05) * 100)),
    },
    {
      key: 'LS',
      name: 'Slope Length & Steepness (LS)',
      value: factors.LS,
      unit: 'dimensionless',
      source: 'NASA SRTM 30m Digital Elevation Model',
      color: '#C2593F',
      percent: Math.min(100, Math.round((factors.LS / 22) * 100)),
    },
    {
      key: 'C',
      name: 'Cover-Management (C)',
      value: factors.C,
      unit: '0.0–1.0 index',
      source: 'Sentinel-2 Multispectral NDVI',
      color: '#00E676',
      percent: Math.min(100, Math.round((factors.C / 0.5) * 100)),
    },
    {
      key: 'P',
      name: 'Conservation Practice (P)',
      value: factors.P,
      unit: '0.0–1.0 policy factor',
      source: 'Land Use Terracing & Hedgerows',
      color: '#9B59B6',
      percent: Math.min(100, Math.round((factors.P / 1.0) * 100)),
    },
  ];

  // Conservation Practice Simulation calculation
  const baselineP = factors.P || 0.70;
  const simulatedLoss = Math.round(baselineLoss * (simulatedPValue / baselineP) * 10) / 10;
  const reductionPct = Math.round(Math.max(0, ((baselineLoss - simulatedLoss) / baselineLoss) * 100) * 10) / 10;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
          RUSLE Factor Breakdown (A = R × K × LS × C × P)
        </span>
      </div>

      {/* Factors List */}
      <div className="space-y-2.5">
        {factorConfigs.map((f) => (
          <div key={f.key} className="bg-[#0F1411] border border-[#2C3E36] rounded-xl p-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                  style={{ backgroundColor: f.color }}
                >
                  {f.key}
                </span>
                <span className="font-semibold text-white">{f.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{f.value}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-[#1F2B26] rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${f.percent}%`, backgroundColor: f.color }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{f.source}</span>
              <span className="font-mono">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* P-Factor Simulation Slider */}
      {showSimulationSlider && (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-b from-[#1F2B26] to-[#17201C] border border-emerald-500/40 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white text-[11px]">Simulate Practice Support (P)</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-xs">P = {simulatedPValue.toFixed(2)}</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Slide to model intervention (e.g. contour bunds P=0.50, stone terrace P=0.35):
          </p>

          <input
            type="range"
            min="0.35"
            max="1.0"
            step="0.05"
            value={simulatedPValue}
            onChange={(e) => setSimulatedP(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 bg-[#0F1411] rounded-lg cursor-pointer"
          />

          {/* Simulation Output Box */}
          <div className="mt-2 p-2 rounded-lg bg-[#0F1411] border border-[#2C3E36] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Simulated Loss</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-extrabold text-sm text-white">{simulatedLoss}</span>
                <span className="text-[10px] text-slate-400">t/ha/yr</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Erosion Reduction</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {reductionPct > 0 ? `-${reductionPct}%` : 'Baseline'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
