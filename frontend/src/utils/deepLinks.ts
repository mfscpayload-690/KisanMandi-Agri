/**
 * Deep Linking & Navigation Utilities for KisanMandi & Kerala Soil Monitor
 * Enables farmers to bookmark, share via WhatsApp/SMS, and navigate via browser history.
 */

export interface DeepLinkParams {
  tab?: 'dashboard' | 'trends' | 'buyers' | 'alerts' | 'soil';
  lang?: string;
  // Dashboard
  crop?: string;
  state?: string;
  days?: number;
  q?: string;
  sort?: 'desc' | 'asc';
  // Trends
  trendCrop?: string;
  trendState?: string;
  trendDays?: number;
  // Buyers
  buyerCrop?: string;
  buyerLocation?: string;
  // Alerts
  alertCrop?: string;
  alertPrice?: number;
  // Soil
  granularity?: 'district' | 'taluk';
  region?: string;
  year?: string;
  basemap?: string;
}

/**
 * Parses all deep link parameters from current window.location.search
 */
export function parseDeepLinkParams(): DeepLinkParams {
  if (typeof window === 'undefined') return {};

  const searchParams = new URLSearchParams(window.location.search);
  const params: DeepLinkParams = {};

  const tab = searchParams.get('tab');
  if (tab && ['dashboard', 'trends', 'buyers', 'alerts', 'soil'].includes(tab)) {
    params.tab = tab as DeepLinkParams['tab'];
  }

  const lang = searchParams.get('lang');
  if (lang) params.lang = lang;

  // General or tab-specific crop
  const crop = searchParams.get('crop');
  if (crop) params.crop = crop;

  const state = searchParams.get('state');
  if (state) params.state = state;

  const days = searchParams.get('days');
  if (days && !isNaN(Number(days))) params.days = Number(days);

  const q = searchParams.get('q') || searchParams.get('search');
  if (q) params.q = q;

  const sort = searchParams.get('sort');
  if (sort === 'asc' || sort === 'desc') params.sort = sort;

  // Trends
  const trendCrop = searchParams.get('trendCrop');
  if (trendCrop) params.trendCrop = trendCrop;
  const trendState = searchParams.get('trendState');
  if (trendState) params.trendState = trendState;
  const trendDays = searchParams.get('trendDays');
  if (trendDays && !isNaN(Number(trendDays))) params.trendDays = Number(trendDays);

  // Buyers
  const buyerCrop = searchParams.get('buyerCrop');
  if (buyerCrop) params.buyerCrop = buyerCrop;
  const buyerLocation = searchParams.get('buyerLocation');
  if (buyerLocation) params.buyerLocation = buyerLocation;

  // Alerts
  const alertCrop = searchParams.get('alertCrop');
  if (alertCrop) params.alertCrop = alertCrop;
  const alertPrice = searchParams.get('alertPrice') || searchParams.get('price');
  if (alertPrice && !isNaN(Number(alertPrice))) params.alertPrice = Number(alertPrice);

  // Soil
  const granularity = searchParams.get('granularity');
  if (granularity === 'district' || granularity === 'taluk') params.granularity = granularity;

  const region = searchParams.get('region');
  if (region) params.region = region;

  const year = searchParams.get('year');
  if (year) params.year = year;

  const basemap = searchParams.get('basemap');
  if (basemap) params.basemap = basemap;

  return params;
}

/**
 * Constructs a canonical URL string based on provided params
 */
export function buildDeepLinkUrl(params: DeepLinkParams): string {
  if (typeof window === 'undefined') return '';

  const searchParams = new URLSearchParams();

  if (params.tab) searchParams.set('tab', params.tab);
  if (params.lang) searchParams.set('lang', params.lang);

  if (params.tab === 'dashboard' || !params.tab) {
    if (params.crop) searchParams.set('crop', params.crop);
    if (params.state) searchParams.set('state', params.state);
    if (params.days) searchParams.set('days', String(params.days));
    if (params.q) searchParams.set('q', params.q);
    if (params.sort) searchParams.set('sort', params.sort);
  } else if (params.tab === 'trends') {
    if (params.crop || params.trendCrop) searchParams.set('crop', params.crop || params.trendCrop!);
    if (params.state || params.trendState) searchParams.set('state', params.state || params.trendState!);
    if (params.days || params.trendDays) searchParams.set('days', String(params.days || params.trendDays!));
  } else if (params.tab === 'buyers') {
    if (params.crop || params.buyerCrop) searchParams.set('crop', params.crop || params.buyerCrop!);
    if (params.state || params.buyerLocation) searchParams.set('location', params.state || params.buyerLocation!);
  } else if (params.tab === 'alerts') {
    if (params.crop || params.alertCrop) searchParams.set('crop', params.crop || params.alertCrop!);
    if (params.alertPrice) searchParams.set('price', String(params.alertPrice));
  } else if (params.tab === 'soil') {
    if (params.granularity) searchParams.set('granularity', params.granularity);
    if (params.region) searchParams.set('region', params.region);
    if (params.year) searchParams.set('year', params.year);
    if (params.basemap) searchParams.set('basemap', params.basemap);
  }

  const queryString = searchParams.toString();
  const searchPart = queryString ? `?${queryString}` : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  return `${pathname}${searchPart}`;
}

/**
 * Returns a fully-qualified public share link for WhatsApp, SMS, or copying.
 * Replaces localhost / 127.0.0.1 with demo production domain https://kisanmandi.in
 */
export function getShareableDeepLinkUrl(params: DeepLinkParams): string {
  const relativePath = buildDeepLinkUrl(params);
  if (typeof window === 'undefined') {
    return `https://kisanmandi.in${relativePath}`;
  }

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseOrigin = isLocal ? 'https://kisanmandi.in' : window.location.origin;

  return `${baseOrigin}${relativePath}`;
}

/**
 * Updates browser address bar using pushState or replaceState without reload.
 * Always operates safely within the active document's origin.
 */
export function syncUrlToHistory(params: DeepLinkParams, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  const relativeUrl = buildDeepLinkUrl(params);
  const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;

  if (relativeUrl !== currentPathWithSearch) {
    try {
      if (replace) {
        window.history.replaceState({ ...params }, '', relativeUrl);
      } else {
        window.history.pushState({ ...params }, '', relativeUrl);
      }
    } catch (e) {
      console.warn('Could not sync URL to browser history:', e);
    }
  }
}

/**
 * Generates formatted WhatsApp and share messages for farmers
 */
export function createSharePayload(title: string, description: string, params: DeepLinkParams) {
  const url = getShareableDeepLinkUrl(params);
  const fullText = `🌾 *KisanMandi* — ${title}\n${description}\n\n👉 Open in App: ${url}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;

  return {
    url,
    title,
    text: fullText,
    whatsappUrl,
  };
}
