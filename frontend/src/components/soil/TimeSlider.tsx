import React, { useEffect } from 'react';
import { Play, Pause, Calendar, Info } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { TIMELINE_SEASON_NOTES } from '../../utils/rusle';

const YEARS = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];

export const TimeSlider: React.FC = () => {
  const {
    activeYear,
    setYear,
    isPlayingTimeline,
    toggleTimelinePlayback
  } = useMapStore();

  // 1400ms cyclic auto-playback loop
  useEffect(() => {
    if (!isPlayingTimeline) return;

    const interval = setInterval(() => {
      const currentIndex = YEARS.indexOf(activeYear);
      const nextIndex = (currentIndex + 1) % YEARS.length;
      setYear(YEARS[nextIndex]);
    }, 1400);

    return () => clearInterval(interval);
  }, [isPlayingTimeline, activeYear, setYear]);

  const currentNote = TIMELINE_SEASON_NOTES[activeYear] || {
    badge: 'Monsoon Cycle',
    description: 'Catchment soil loss assessment for selected year.'
  };

  return (
    <div className="bg-[#17201C]/95 backdrop-blur-md border border-[#2C3E36] rounded-2xl shadow-2xl p-3.5 text-slate-200">
      {/* Top row: Play/Pause, Year display, and climate disaster pulse */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTimelinePlayback}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer shadow-md ${
              isPlayingTimeline
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isPlayingTimeline ? 'Pause timeline playback' : 'Play timeline animation (2018–2024)'}
          >
            {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex items-baseline gap-1.5">
            <span className="font-outfit text-base font-extrabold text-white tracking-tight">Year {activeYear}</span>
            {activeYear === '2024' && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Latest
              </span>
            )}
          </div>
        </div>

        {/* Climate pulse badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F2B26] border border-[#2C3E36] text-[11px] text-amber-300/90 font-medium">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>{currentNote.badge}</span>
        </div>
      </div>

      {/* Season Climate Note */}
      <p className="text-xs text-slate-300/80 mb-3 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <span>{currentNote.description}</span>
      </p>

      {/* Year Slider Track */}
      <div className="relative pt-1 pb-1">
        <div className="flex items-center justify-between relative z-10">
          {YEARS.map((year) => {
            const isCurrent = year === activeYear;
            return (
              <button
                key={year}
                onClick={() => setYear(year)}
                className="group flex flex-col items-center cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'bg-emerald-400 border-white scale-125 shadow-lg shadow-emerald-500/50'
                      : 'bg-[#1F2B26] border-slate-500 group-hover:border-emerald-400'
                  }`}
                >
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#0F1411]" />}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-mono font-medium transition-colors ${
                    isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  '{year.slice(2)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Connecting horizontal bar */}
        <div className="absolute top-3 left-2 right-2 h-1 bg-[#2C3E36] -z-0 rounded-full" />
      </div>
    </div>
  );
};
