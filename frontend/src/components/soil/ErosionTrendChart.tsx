import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useMapStore } from '../../store/mapStore';
import { colorForScore } from '../../utils/rusle';

interface ErosionTrendChartProps {
  timeSeries: Record<string, number>;
}

export const ErosionTrendChart: React.FC<ErosionTrendChartProps> = ({ timeSeries }) => {
  const { activeYear, setYear } = useMapStore();

  const chartData = Object.entries(timeSeries || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, score]) => ({
      year,
      shortYear: `'${year.slice(2)}`,
      score: Number(score),
      isActive: year === activeYear
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="w-full bg-[#0F1411] border border-[#2C3E36] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
          Annual Soil Loss Trend (2018–2024)
        </span>
        <span className="text-[10px] text-slate-500 font-mono">t/ha/yr</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const clickedYear = e.activePayload[0].payload.year;
                if (clickedYear) setYear(clickedYear);
              }
            }}
          >
            <defs>
              <linearGradient id="erosionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C2593F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C2593F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2B26" />
            <XAxis
              dataKey="shortYear"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#2C3E36' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#2C3E36' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#17201C] border border-[#2C3E36] px-2.5 py-1.5 rounded-lg shadow-xl text-xs">
                      <div className="font-bold text-white">Year {data.year}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colorForScore(data.score) }}
                        />
                        <span className="font-mono font-bold text-slate-200">{data.score} t/ha/yr</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#C2593F"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isSelected = payload.year === activeYear;
                return (
                  <circle
                    key={payload.year}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 5.5 : 3.5}
                    fill={isSelected ? '#FFFFFF' : '#C2593F'}
                    stroke={isSelected ? '#C2593F' : '#17201C'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="cursor-pointer transition-all"
                  />
                );
              }}
              activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#C2593F', strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1.5 border-t border-[#1F2B26]">
        <span>'18: Centenary Floods pulse</span>
        <span className="font-semibold text-emerald-400">'24: Active post-monsoon</span>
      </div>
    </div>
  );
};
