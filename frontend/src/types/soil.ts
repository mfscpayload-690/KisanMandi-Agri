export interface RusleFactors {
  R: number;              // Rainfall erosivity (MJ·mm/ha·h·yr)
  K: number;              // Soil erodibility (t·ha·h/ha·MJ·mm)
  LS: number;             // Topographic factor (slope length & steepness)
  C: number;              // Cover-management factor (0.0 - 1.0)
  P: number;              // Support practice factor (0.0 - 1.0)
  A: number;              // Computed loss (t/ha/yr) = R * K * LS * C * P
}

export interface TimeSeriesRecord {
  year: string;
  soilLossScore: number;
  riskCategory: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Very Severe';
  seasonDescription?: string;
}

export interface DistrictProperties {
  id: string;                          // e.g. 'wayanad'
  district_name: string;               // 'Wayanad'
  malayalam_name: string;              // 'വയനാട്'
  headquarters: string;
  area_sq_km: number;
  centroid: { lat: number; lng: number };
  bbox: [number, number, number, number];
  dominant_land_use: string;
  soil_type: string;
  terrain_category: string;
  taluks: string[];
  rusle: RusleFactors;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Very Severe';
  time_series: Record<string, number>;
  active_year?: string;
  active_soil_loss?: number;
  conservation: string[];
  is_sample_data: boolean;
  data_source: string;
}

export interface DistrictFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: DistrictProperties;
}

export interface TalukProperties {
  id: string;
  taluk_name: string;
  malayalam_name: string;
  district_name: string;
  district_id: string;
  elevation_m: number;
  slope_degrees: number;
  area_sq_km: number;
  centroid: { lat: number; lng: number };
  dominant_land_use: string;
  soil_type: string;
  rusle: RusleFactors;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Very Severe';
  time_series: Record<string, number>;
  active_year?: string;
  active_soil_loss?: number;
  conservation: string[];
  is_sample_data: boolean;
  data_source: string;
}

export interface TalukFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: TalukProperties;
}

export interface CustomRoiStats {
  area_sq_km: number;
  mean_loss: number;           // t/ha/yr
  min_loss: number;
  max_loss: number;
  total_tons_per_year: number;   // metric tons of soil lost annually
  intersecting_regions: string[];
  dominant_risk: string;
  conservation_priority: string;
  matching_count?: number;
}

export interface RusleSimulationResult {
  baseline_loss: number;
  simulated_loss: number;
  reduction_pct: number;
  p_factor_used: number;
  baseline_category: string;
  simulated_category: string;
}

export type GranularityLevel = 'district' | 'taluk';
export type DataSourceMode = 'bundled' | 'gee_proxy' | 'bhuvan_wms';
export type BasemapType = 'esri_satellite' | 'carto_dark' | 'opentopomap' | 'osm' | 'bhuvan_lulc';
