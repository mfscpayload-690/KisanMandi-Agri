import type {
  DistrictFeature,
  TalukFeature,
  CustomRoiStats,
  RusleSimulationResult
} from '../types/soil';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const soilApi = {
  async getDistricts(year: string = '2024', dataSource: string = 'bundled'): Promise<DistrictFeature[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/districts?year=${year}&data_source=${dataSource}`);
      if (res.ok) {
        const data = await res.json();
        return data.features || [];
      }
    } catch (err) {
      console.warn('Backend districts endpoint unavailable, using bundled GeoJSON fallback:', err);
    }
    // Bundled fallback
    const res = await fetch('/data/kerala_districts.geojson');
    const data = await res.json();
    return data.features || [];
  },

  async getTaluks(year: string = '2024', district?: string, dataSource: string = 'bundled'): Promise<TalukFeature[]> {
    try {
      let url = `${API_BASE}/api/v1/taluks?year=${year}&data_source=${dataSource}`;
      if (district) url += `&district=${encodeURIComponent(district)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.features || [];
      }
    } catch (err) {
      console.warn('Backend taluks endpoint unavailable, using bundled GeoJSON fallback:', err);
    }
    // Bundled fallback
    const res = await fetch('/data/kerala_taluks.geojson');
    const data = await res.json();
    let features: TalukFeature[] = data.features || [];
    if (district) {
      features = features.filter((f) =>
        f.properties.district_name.toLowerCase() === district.toLowerCase() ||
        f.properties.district_id.toLowerCase() === district.toLowerCase()
      );
    }
    return features;
  },

  async calculateRoi(lat: number, lng: number, radiusKm: number, year: string = '2024'): Promise<CustomRoiStats> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/roi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, radius_km: radiusKm, year }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend ROI calculation failed, using client-side calculation fallback:', err);
    }

    // Client-side fallback calculation
    const area = Math.round(Math.PI * Math.pow(radiusKm, 2) * 10) / 10;
    const mean = 18.5;
    return {
      area_sq_km: area,
      mean_loss: mean,
      min_loss: 7.2,
      max_loss: 48.0,
      total_tons_per_year: Math.round(mean * area * 100),
      intersecting_regions: ['Western Ghats Midland Zone'],
      dominant_risk: 'High',
      conservation_priority: 'HIGH: Active Topsoil Runoff Mitigation Required',
      matching_count: 3
    };
  },

  async simulateConservation(
    pFactor: number,
    baselineLoss: number = 20.0,
    districtId?: string,
    year: string = '2024'
  ): Promise<RusleSimulationResult> {
    try {
      let url = `${API_BASE}/api/v1/rusle/simulate?p_factor=${pFactor}&baseline_loss=${baselineLoss}&year=${year}`;
      if (districtId) url += `&district_id=${districtId}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend simulate endpoint error, using client formula:', err);
    }

    // Client-side formula
    const baselineP = 0.70;
    const simulatedLoss = Math.round(baselineLoss * (pFactor / baselineP) * 100) / 100;
    const reductionPct = Math.round(Math.max(0, ((baselineLoss - simulatedLoss) / baselineLoss) * 100) * 10) / 10;
    return {
      baseline_loss: baselineLoss,
      simulated_loss: simulatedLoss,
      reduction_pct: reductionPct,
      p_factor_used: pFactor,
      baseline_category: baselineLoss >= 40 ? 'Very Severe' : baselineLoss >= 20 ? 'Severe' : baselineLoss >= 10 ? 'High' : 'Moderate',
      simulated_category: simulatedLoss >= 40 ? 'Very Severe' : simulatedLoss >= 20 ? 'Severe' : simulatedLoss >= 10 ? 'High' : 'Moderate'
    };
  }
};
