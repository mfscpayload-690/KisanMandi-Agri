import React, { useEffect, useState } from 'react';
import { KeralaMap } from './KeralaMap';
import { TopSearchBar } from './TopSearchBar';
import { TimeSlider } from './TimeSlider';
import { MapLegend } from './MapLegend';
import { DistrictDetailPanel } from './DistrictDetailPanel';
import { TalukDetailPanel } from './TalukDetailPanel';
import { RoiStatsCard } from './RoiStatsCard';
import { DemoDataBanner } from './DemoDataBanner';
import { DataSourceDialog } from './DataSourceDialog';
import { RegionSelectorModal } from './RegionSelectorModal';
import { LayerSwitcher } from './LayerSwitcher';
import { soilApi } from '../../api/soil';
import { useMapStore } from '../../store/mapStore';
import { parseDeepLinkParams, syncUrlToHistory } from '../../utils/deepLinks';
import type { DistrictFeature, TalukFeature } from '../../types/soil';

export const SoilMonitorView: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictFeature[]>([]);
  const [taluks, setTaluks] = useState<TalukFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProcessedInitialDeepLink, setHasProcessedInitialDeepLink] = useState(false);

  const {
    activeYear,
    setYear,
    granularity,
    setGranularity,
    dataSourceMode,
    selectedDistrict,
    selectedTaluk,
    selectDistrict,
    selectTaluk,
    flyTo
  } = useMapStore();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      soilApi.getDistricts(activeYear, dataSourceMode),
      soilApi.getTaluks(activeYear, undefined, dataSourceMode)
    ])
      .then(([distData, talukData]) => {
        if (isMounted) {
          setDistricts(distData);
          setTaluks(talukData);
          setIsLoading(false);

          // Process initial deep link region if present and not yet processed
          if (!hasProcessedInitialDeepLink) {
            const params = parseDeepLinkParams();
            if (params.year && params.year !== activeYear) {
              setYear(params.year);
            }
            if (params.granularity) {
              setGranularity(params.granularity);
            }
            if (params.region) {
              const regQuery = params.region.toLowerCase();
              // Check taluks first if granularity is taluk
              const talukMatch = talukData.find(
                (t) => t.id.toLowerCase() === regQuery || t.properties.taluk_name.toLowerCase() === regQuery
              );
              if (talukMatch && (params.granularity === 'taluk' || !distData.some(d => d.id.toLowerCase() === regQuery))) {
                setGranularity('taluk');
                selectTaluk(talukMatch.properties);
                flyTo(talukMatch.properties.centroid.lat, talukMatch.properties.centroid.lng, 11);
              } else {
                const distMatch = distData.find(
                  (d) => d.id.toLowerCase() === regQuery || d.properties.district_name.toLowerCase() === regQuery
                );
                if (distMatch) {
                  setGranularity('district');
                  selectDistrict(distMatch.properties);
                  flyTo(distMatch.properties.centroid.lat, distMatch.properties.centroid.lng, 9.5);
                }
              }
            }
            setHasProcessedInitialDeepLink(true);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching soil data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeYear, dataSourceMode, hasProcessedInitialDeepLink]);

  // Sync active soil view state to URL
  useEffect(() => {
    if (hasProcessedInitialDeepLink) {
      syncUrlToHistory(
        {
          tab: 'soil',
          granularity,
          region: selectedTaluk?.id || selectedDistrict?.id || undefined,
          year: activeYear,
        },
        true // replace state to avoid polluting history on every click
      );
    }
  }, [granularity, selectedDistrict, selectedTaluk, activeYear, hasProcessedInitialDeepLink]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden bg-[#0F1411] font-sans">
      {/* Full-Viewport Leaflet Canvas Map */}
      <KeralaMap districts={districts} taluks={taluks} />

      {/* Floating Top Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-start justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <TopSearchBar districts={districts} taluks={taluks} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <DemoDataBanner />
        </div>
      </div>

      {/* Floating Left Column: Custom ROI Card & Map Legend */}
      <div className="absolute left-3 sm:left-4 bottom-28 sm:bottom-24 z-30 flex flex-col gap-2.5 pointer-events-none max-w-[200px] sm:max-w-sm">
        <div className="pointer-events-auto">
          <RoiStatsCard />
        </div>
        <div className="pointer-events-auto">
          <MapLegend />
        </div>
      </div>

      {/* Floating Bottom Timeline Slider */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 lg:left-88 lg:right-98 z-30 pointer-events-none">
        <div className="pointer-events-auto max-w-xl mx-auto">
          <TimeSlider />
        </div>
      </div>

      {/* Floating Right Detail Panel (District or Taluk) */}
      <div className="absolute top-14 sm:top-16 right-2 sm:right-4 bottom-2 sm:bottom-4 z-30 pointer-events-none flex items-start">
        <div className="pointer-events-auto max-h-[85vh] overflow-y-auto">
          {selectedDistrict && <DistrictDetailPanel taluks={taluks} />}
          {selectedTaluk && <TalukDetailPanel />}
        </div>
      </div>

      {/* Floating Layer Switcher Popover */}
      <LayerSwitcher />

      {/* Modals */}
      <RegionSelectorModal districts={districts} taluks={taluks} />
      <DataSourceDialog />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-[#0F1411]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg" />
            <span className="font-outfit text-sm font-bold text-white tracking-wider">
              Loading Satellite RUSLE Layers...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
