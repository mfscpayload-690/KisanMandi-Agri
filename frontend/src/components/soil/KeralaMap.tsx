import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';
import { colorForScore, categorizeScore } from '../../utils/rusle';
import { soilApi } from '../../api/soil';
import type { DistrictFeature, TalukFeature } from '../../types/soil';

interface KeralaMapProps {
  districts: DistrictFeature[];
  taluks: TalukFeature[];
}

const TILE_PROVIDERS: Record<string, { url: string; attribution: string; isWms?: boolean; layers?: string }> = {
  esri_satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; High-Resolution Satellite Imagery'
  },
  bhuvan_lulc: {
    url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
    attribution: '&copy; ISRO NRSC &mdash; Bhuvan National Geoportal Land Use / Land Cover (1:50K)',
    isWms: true,
    layers: 'lulc:KL_LULC50K_1516'
  },
  carto_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  opentopomap: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }
};

export const KeralaMap: React.FC<KeralaMapProps> = ({ districts, taluks }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const districtBoundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const roiCircleRef = useRef<L.Circle | null>(null);

  const {
    granularity,
    activeYear,
    activeCategories,
    basemap,
    overlayOpacity,
    showHotspotMarkers,
    showDistrictBoundaries,
    selectedDistrict,
    selectedTaluk,
    selectDistrict,
    selectTaluk,
    flyToTarget,
    clearFlyTo,
    isRoiToolActive,
    roiCenter,
    roiRadiusKm,
    setRoiCenter,
    setRoiStats,
    setRoiLoading
  } = useMapStore();

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Kerala bounds
    const keralaCenter: [number, number] = [10.50, 76.27];
    const map = L.map(mapContainerRef.current, {
      center: keralaCenter,
      zoom: 7.6,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
      preferCanvas: true
    });

    // Custom zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const provider = TILE_PROVIDERS[basemap] || TILE_PROVIDERS.esri_satellite;
    let tileLayer: L.TileLayer;
    if (provider.isWms) {
      tileLayer = L.tileLayer.wms(provider.url, {
        layers: provider.layers || 'lulc:KL_LULC50K_1516',
        format: 'image/png',
        transparent: true,
        attribution: provider.attribution,
        maxZoom: 18
      }).addTo(map);
    } else {
      tileLayer = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: 18
      }).addTo(map);
    }

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Basemap Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    const provider = TILE_PROVIDERS[basemap] || TILE_PROVIDERS.esri_satellite;
    if (provider.isWms) {
      tileLayerRef.current = L.tileLayer.wms(provider.url, {
        layers: provider.layers || 'lulc:KL_LULC50K_1516',
        format: 'image/png',
        transparent: true,
        attribution: provider.attribution,
        maxZoom: 18
      }).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: 18
      }).addTo(map);
    }
  }, [basemap]);

  // 3. Map Click handler (ROI calculation vs polygon selection)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (isRoiToolActive) {
        const { lat, lng } = e.latlng;
        setRoiCenter(lat, lng);
        setRoiLoading(true);

        try {
          const stats = await soilApi.calculateRoi(lat, lng, roiRadiusKm, activeYear);
          setRoiStats(stats);
        } catch (err) {
          console.error('Error calculating ROI:', err);
          setRoiLoading(false);
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isRoiToolActive, roiRadiusKm, activeYear, setRoiCenter, setRoiStats, setRoiLoading]);

  // 4. Update ROI Circle Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (roiCircleRef.current) {
      roiCircleRef.current.remove();
      roiCircleRef.current = null;
    }

    if (isRoiToolActive && roiCenter) {
      const circle = L.circle(roiCenter, {
        radius: roiRadiusKm * 1000,
        color: '#F59E0B',
        weight: 2.5,
        dashArray: '6, 6',
        fillColor: '#F59E0B',
        fillOpacity: 0.18,
      }).addTo(map);

      roiCircleRef.current = circle;
    }
  }, [isRoiToolActive, roiCenter, roiRadiusKm]);

  // 5. Render Choropleth and Centroid Hotspots
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    // Clean previous layers
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
      geojsonLayerRef.current = null;
    }
    markersLayerRef.current.clearLayers();

    const currentFeatures = granularity === 'district' ? districts : taluks;
    if (!currentFeatures || currentFeatures.length === 0) return;

    // Create GeoJSON layer
    const geojsonLayer = L.geoJSON(currentFeatures as any, {
      filter: (feature: any) => {
        const props = feature.properties;
        const score = props.time_series?.[activeYear] ?? props.rusle?.A ?? 10;
        const category = categorizeScore(score);
        return activeCategories.includes(category);
      },
      style: (feature: any) => {
        const props = feature.properties;
        const score = props.time_series?.[activeYear] ?? props.rusle?.A ?? 10;
        const isSelected =
          (granularity === 'district' && selectedDistrict?.id === props.id) ||
          (granularity === 'taluk' && selectedTaluk?.id === props.id);

        return {
          fillColor: colorForScore(score),
          fillOpacity: isSelected ? Math.min(0.92, overlayOpacity + 0.2) : overlayOpacity,
          color: isSelected ? '#FFFFFF' : '#0F1713',
          weight: isSelected ? 3.5 : (granularity === 'district' ? 1.8 : 1.2),
          opacity: 0.85,
        };
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        const props = feature.properties;
        const score = props.time_series?.[activeYear] ?? props.rusle?.A ?? 10;

        layer.on({
          mouseover: (e: any) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#FFFFFF',
              fillOpacity: Math.min(0.95, overlayOpacity + 0.1)
            });
            target.bringToFront();
          },
          mouseout: (e: any) => {
            if (geojsonLayerRef.current) {
              geojsonLayerRef.current.resetStyle(e.target);
            }
          },
          click: (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            if (granularity === 'district') {
              selectDistrict(props);
            } else {
              selectTaluk(props);
            }
          }
        });

        // 6. Centroid Label Markers
        if (showHotspotMarkers && props.centroid) {
          const isSelected =
            (granularity === 'district' && selectedDistrict?.id === props.id) ||
            (granularity === 'taluk' && selectedTaluk?.id === props.id);
          const isSevere = score >= 20;

          const markerHtml = `
            <div class="cursor-pointer transition-all transform hover:scale-110 select-none ${isSelected ? 'scale-115' : ''}">
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 9999px;
                background-color: rgba(15, 20, 17, 0.88);
                border: 1.5px solid ${isSelected ? '#FFFFFF' : colorForScore(score)};
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                font-family: 'Inter', sans-serif;
              ">
                ${isSevere ? '<span style="color:#F59E0B;font-size:10px;">⚠</span>' : ''}
                <span style="color:#F1F5F9;font-size:10px;font-weight:700;white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis;">
                  ${granularity === 'district' ? props.district_name : props.taluk_name}
                </span>
                <span style="
                  background-color:${colorForScore(score)};
                  color:#FFFFFF;
                  font-size:9px;
                  font-weight:800;
                  padding:1px 4px;
                  border-radius:6px;
                  font-family:monospace;
                ">
                  ${Math.round(score)}
                </span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'kerala-centroid-marker',
            iconSize: [80, 24],
            iconAnchor: [40, 12]
          });

          const marker = L.marker([props.centroid.lat, props.centroid.lng], { icon: customIcon });
          marker.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            if (granularity === 'district') {
              selectDistrict(props);
            } else {
              selectTaluk(props);
            }
          });

          markersLayerRef.current?.addLayer(marker);
        }
      }
    }).addTo(map);

    geojsonLayerRef.current = geojsonLayer;
  }, [
    districts,
    taluks,
    granularity,
    activeYear,
    activeCategories,
    overlayOpacity,
    showHotspotMarkers,
    selectedDistrict,
    selectedTaluk,
    selectDistrict,
    selectTaluk
  ]);

  // 6. Prominent District Jurisdiction Boundaries Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (districtBoundaryLayerRef.current) {
      districtBoundaryLayerRef.current.remove();
      districtBoundaryLayerRef.current = null;
    }

    // Render district jurisdiction borders whenever enabled (or in taluk mode to clearly delineate taluk groupings)
    if ((showDistrictBoundaries || granularity === 'taluk') && districts && districts.length > 0) {
      const boundaryLayer = L.geoJSON(districts as any, {
        style: {
          fill: false,
          color: '#FFFFFF',
          weight: 2.2,
          opacity: 0.9,
          dashArray: granularity === 'taluk' ? '6, 4' : undefined,
          lineJoin: 'round',
          lineCap: 'round',
          interactive: false
        }
      }).addTo(map);

      districtBoundaryLayerRef.current = boundaryLayer;
    }
  }, [showDistrictBoundaries, granularity, districts]);

  // 7. Handle fly-to targets
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToTarget) return;

    const [lat, lng, zoom] = flyToTarget;
    map.flyTo([lat, lng], zoom, {
      duration: 1.2,
      easeLinearity: 0.25
    });
    clearFlyTo();
  }, [flyToTarget, clearFlyTo]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full relative z-0 bg-[#0F1411] outline-none ${
        isRoiToolActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
    />
  );
};
