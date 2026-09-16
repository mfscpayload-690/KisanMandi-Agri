import { create } from 'zustand';
import type {
  GranularityLevel,
  DataSourceMode,
  BasemapType,
  DistrictProperties,
  TalukProperties,
  CustomRoiStats
} from '../types/soil';

interface MapState {
  // View state
  granularity: GranularityLevel;
  activeYear: string;
  isPlayingTimeline: boolean;
  activeCategories: string[]; // ['Low', 'Moderate', 'High', 'Severe', 'Very Severe']
  basemap: BasemapType;
  overlayOpacity: number;
  showHotspotMarkers: boolean;
  showDistrictBoundaries: boolean;

  // Selection state
  selectedDistrict: DistrictProperties | null;
  hoveredDistrict: DistrictProperties | null;
  selectedTaluk: TalukProperties | null;
  hoveredTaluk: TalukProperties | null;

  // Fly-to target coordinate [lat, lng, zoom]
  flyToTarget: [number, number, number] | null;

  // Search & Filter
  searchQuery: string;

  // Custom ROI
  isRoiToolActive: boolean;
  roiCenter: [number, number] | null;
  roiRadiusKm: number;
  roiStats: CustomRoiStats | null;
  roiLoading: boolean;

  // RUSLE Simulation
  simulatedPValue: number;

  // Data Source
  dataSourceMode: DataSourceMode;
  isSampleData: boolean;

  // Modals & Popovers
  isRegionModalOpen: boolean;
  isDataSourceDialogOpen: boolean;
  isLayerSwitcherOpen: boolean;

  // Actions
  setGranularity: (level: GranularityLevel) => void;
  setYear: (year: string) => void;
  toggleTimelinePlayback: () => void;
  setPlayingTimeline: (playing: boolean) => void;
  toggleCategory: (cat: string) => void;
  setBasemap: (basemap: BasemapType) => void;
  setOverlayOpacity: (opacity: number) => void;
  toggleHotspots: (show?: boolean) => void;
  toggleBoundaries: (show?: boolean) => void;

  selectDistrict: (d: DistrictProperties | null) => void;
  selectTaluk: (t: TalukProperties | null) => void;
  hoverDistrict: (d: DistrictProperties | null) => void;
  hoverTaluk: (t: TalukProperties | null) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  clearFlyTo: () => void;

  setSearchQuery: (query: string) => void;

  setRoiActive: (active: boolean) => void;
  setRoiCenter: (lat: number, lng: number) => void;
  setRoiRadiusKm: (radiusKm: number) => void;
  setRoiStats: (stats: CustomRoiStats | null) => void;
  setRoiLoading: (loading: boolean) => void;
  clearRoi: () => void;

  setSimulatedP: (val: number) => void;
  setDataSourceMode: (mode: DataSourceMode) => void;

  setRegionModalOpen: (open: boolean) => void;
  setDataSourceDialogOpen: (open: boolean) => void;
  setLayerSwitcherOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  granularity: 'district',
  activeYear: '2024',
  isPlayingTimeline: false,
  activeCategories: ['Low', 'Moderate', 'High', 'Severe', 'Very Severe'],
  basemap: 'esri_satellite',
  overlayOpacity: 0.75,
  showHotspotMarkers: true,
  showDistrictBoundaries: true,

  selectedDistrict: null,
  hoveredDistrict: null,
  selectedTaluk: null,
  hoveredTaluk: null,

  flyToTarget: null,
  searchQuery: '',

  isRoiToolActive: false,
  roiCenter: null,
  roiRadiusKm: 10,
  roiStats: null,
  roiLoading: false,

  simulatedPValue: 0.70,

  dataSourceMode: 'bundled',
  isSampleData: true,

  isRegionModalOpen: false,
  isDataSourceDialogOpen: false,
  isLayerSwitcherOpen: false,

  setGranularity: (level) => set({ granularity: level, selectedDistrict: null, selectedTaluk: null }),
  setYear: (year) => set({ activeYear: year }),
  toggleTimelinePlayback: () => set((state) => ({ isPlayingTimeline: !state.isPlayingTimeline })),
  setPlayingTimeline: (playing) => set({ isPlayingTimeline: playing }),
  toggleCategory: (cat) => set((state) => {
    const exists = state.activeCategories.includes(cat);
    return {
      activeCategories: exists
        ? state.activeCategories.filter((c) => c !== cat)
        : [...state.activeCategories, cat]
    };
  }),
  setBasemap: (basemap) => set({ basemap }),
  setOverlayOpacity: (opacity) => set({ overlayOpacity: opacity }),
  toggleHotspots: (show) => set((state) => ({ showHotspotMarkers: show !== undefined ? show : !state.showHotspotMarkers })),
  toggleBoundaries: (show) => set((state) => ({ showDistrictBoundaries: show !== undefined ? show : !state.showDistrictBoundaries })),

  selectDistrict: (d) => set({ selectedDistrict: d, selectedTaluk: null }),
  selectTaluk: (t) => set({ selectedTaluk: t, selectedDistrict: null }),
  hoverDistrict: (d) => set({ hoveredDistrict: d }),
  hoverTaluk: (t) => set({ hoveredTaluk: t }),
  flyTo: (lat, lng, zoom = 10) => set({ flyToTarget: [lat, lng, zoom] }),
  clearFlyTo: () => set({ flyToTarget: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setRoiActive: (active) => set((state) => ({
    isRoiToolActive: active,
    roiCenter: active ? state.roiCenter : null,
    roiStats: active ? state.roiStats : null
  })),
  setRoiCenter: (lat, lng) => set({ roiCenter: [lat, lng] }),
  setRoiRadiusKm: (radiusKm) => set({ roiRadiusKm: radiusKm }),
  setRoiStats: (stats) => set({ roiStats: stats, roiLoading: false }),
  setRoiLoading: (loading) => set({ roiLoading: loading }),
  clearRoi: () => set({ isRoiToolActive: false, roiCenter: null, roiStats: null, roiLoading: false }),

  setSimulatedP: (val) => set({ simulatedPValue: val }),
  setDataSourceMode: (mode) => set({ dataSourceMode: mode }),

  setRegionModalOpen: (open) => set({ isRegionModalOpen: open }),
  setDataSourceDialogOpen: (open) => set({ isDataSourceDialogOpen: open }),
  setLayerSwitcherOpen: (open) => set({ isLayerSwitcherOpen: open })
}));
