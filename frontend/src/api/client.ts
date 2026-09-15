const API_BASE = '/api/v1';

export interface PriceRecord {
  id: number;
  crop_name: string;
  mandi_name: string;
  price_per_unit: number;
  modal_price?: number;
  min_price?: number;
  max_price?: number;
  variety?: string;
  quantity: number;
  date: string;
  state: string;
  region?: string;
}

export interface PriceListResponse {
  total: number;
  page: number;
  limit: number;
  data: PriceRecord[];
}

export interface Mandi {
  id: number;
  name: string;
  state: string;
  district: string;
  contact?: string;
}

export interface Crop {
  id: number;
  name: string;
  unit_of_measurement: string;
  min_price?: number;
  max_price?: number;
}

export interface Buyer {
  id: number;
  name: string;
  crop: string;
  min_quantity: number;
  location: string;
  contact: string;
}

export interface PriceAlert {
  id: number;
  user_id: string;
  crop: string;
  threshold_price: number;
  alert_type: 'above' | 'below';
  created_at?: string;
  current_market_price?: number;
  is_triggered: boolean;
}

export interface TrendPoint {
  date: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  total_quantity: number;
}

export interface TrendResponse {
  crop: string;
  state?: string;
  days: number;
  overall_min: number;
  overall_max: number;
  overall_avg: number;
  latest_price?: number;
  price_change_pct: number;
  data: TrendPoint[];
}

export interface CropStat {
  crop_name: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  total_quantity: number;
  record_count: number;
}

export interface StatsResponse {
  total_price_records: number;
  total_mandis: number;
  total_crops: number;
  total_buyers: number;
  states_covered: string[];
  top_traded_crops: CropStat[];
  latest_update?: string;
}

export const api = {
  async getPrices(params: {
    crop?: string;
    state?: string;
    mandi?: string;
    days?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    order?: string;
  }): Promise<PriceListResponse> {
    const q = new URLSearchParams();
    if (params.crop) q.append('crop', params.crop);
    if (params.state) q.append('state', params.state);
    if (params.mandi) q.append('mandi', params.mandi);
    if (params.days) q.append('days', params.days.toString());
    if (params.start_date) q.append('start_date', params.start_date);
    if (params.end_date) q.append('end_date', params.end_date);
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.offset !== undefined) q.append('offset', params.offset.toString());
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.order) q.append('order', params.order);

    const res = await fetch(`${API_BASE}/prices?${q.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch prices: ${res.statusText}`);
    return res.json();
  },

  async getMandis(state?: string): Promise<Mandi[]> {
    const q = state ? `?state=${encodeURIComponent(state)}` : '';
    const res = await fetch(`${API_BASE}/mandis${q}`);
    if (!res.ok) throw new Error(`Failed to fetch mandis: ${res.statusText}`);
    return res.json();
  },

  async getCrops(): Promise<Crop[]> {
    const res = await fetch(`${API_BASE}/crops`);
    if (!res.ok) throw new Error(`Failed to fetch crops: ${res.statusText}`);
    return res.json();
  },

  async getTrends(crop: string, state?: string, days: number = 30): Promise<TrendResponse> {
    const q = new URLSearchParams();
    if (state) q.append('state', state);
    if (days) q.append('days', days.toString());
    const res = await fetch(`${API_BASE}/trends/${encodeURIComponent(crop)}?${q.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch trends: ${res.statusText}`);
    return res.json();
  },

  async getBuyers(crop?: string, state?: string): Promise<Buyer[]> {
    const q = new URLSearchParams();
    if (crop) q.append('crop', crop);
    if (state) q.append('state', state);
    const res = await fetch(`${API_BASE}/buyers?${q.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch buyers: ${res.statusText}`);
    return res.json();
  },

  async getAlerts(userId: string): Promise<PriceAlert[]> {
    const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
    return res.json();
  },

  async createAlert(payload: {
    user_id: string;
    crop: string;
    threshold_price: number;
    alert_type: 'above' | 'below';
  }): Promise<PriceAlert> {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create alert: ${res.statusText}`);
    return res.json();
  },

  async deleteAlert(alertId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete alert: ${res.statusText}`);
  },

  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
    return res.json();
  },

  async triggerSync(): Promise<any> {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    return res.json();
  },
};
