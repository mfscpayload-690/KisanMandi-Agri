export const RISK_COLORS = {
  low: '#2ECC71',        // < 5 t/ha/yr
  moderate: '#F1C40F',   // 5–10 t/ha/yr
  high: '#E67E22',       // 10–20 t/ha/yr
  severe: '#E74C3C',     // 20–40 t/ha/yr
  very_severe: '#8E44AD',// > 40 t/ha/yr
};

export function categorizeScore(soilLoss: number): 'Low' | 'Moderate' | 'High' | 'Severe' | 'Very Severe' {
  if (soilLoss < 5) return 'Low';
  if (soilLoss < 10) return 'Moderate';
  if (soilLoss < 20) return 'High';
  if (soilLoss < 40) return 'Severe';
  return 'Very Severe';
}

export function colorForScore(score: number): string {
  if (score < 5) return RISK_COLORS.low;
  if (score < 10) return RISK_COLORS.moderate;
  if (score < 20) return RISK_COLORS.high;
  if (score < 40) return RISK_COLORS.severe;
  return RISK_COLORS.very_severe;
}

export function colorForCategory(category: string): string {
  switch (category.toLowerCase()) {
    case 'low':
      return RISK_COLORS.low;
    case 'moderate':
      return RISK_COLORS.moderate;
    case 'high':
      return RISK_COLORS.high;
    case 'severe':
      return RISK_COLORS.severe;
    case 'very severe':
    case 'very_severe':
      return RISK_COLORS.very_severe;
    default:
      return '#94A3B8';
  }
}

export const TIMELINE_SEASON_NOTES: Record<string, { badge: string; description: string }> = {
  '2018': {
    badge: 'Centenary Floods',
    description: 'Severe widespread rainfall erosivity surge across high ranges.'
  },
  '2019': {
    badge: 'Landslide Pulse',
    description: 'Heavy localized cloudbursts in Kavalappara and Wayanad hills.'
  },
  '2020': {
    badge: 'Normal Monsoon',
    description: 'Standard monsoon cycle with mid-level catchment runoff.'
  },
  '2021': {
    badge: 'Extended SW Monsoon',
    description: 'High rainfall duration causing sustained topsoil runoff.'
  },
  '2022': {
    badge: 'Post-Monsoon Recovery',
    description: 'Improved vegetative cover (C-factor) in central midlands.'
  },
  '2023': {
    badge: 'Deficit Monsoon',
    description: 'Reduced rainfall erosivity R-factor across Palakkad gap.'
  },
  '2024': {
    badge: 'High Western Ghats Surge',
    description: 'Intense debris flows and soil stripping in Wayanad/Idukki.'
  }
};
