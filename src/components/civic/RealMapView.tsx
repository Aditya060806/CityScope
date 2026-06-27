import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Issue, IssueCategory, IssueStatus, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import { useMapData } from '@/hooks/useMapData';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/ComprehensiveAPIService';
import { 
  MapPin, 
  Layers, 
  Filter, 
  Search, 
  Navigation,
  ZoomIn,
  ZoomOut,
  Settings,
  Map,
  Satellite,
  Maximize2,
  Minimize2,
  X,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { AnomalyMapLayer } from '@/components/prad/AnomalyMapLayer';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import type { RoadAnomaly, AnomalyCluster } from '@/types/road-anomaly';
import { toMapCenter } from '@/constants/location';

interface RealMapViewProps {
  className?: string;
  onIssueSelect?: (issue: Issue) => void;
  selectedIssueId?: string;
  focusUserLocationSignal?: number;
  userLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

type MapViewMode = 'pins' | 'heatmap' | 'clusters' | 'anomalies';
type HeatSourceFilter = 'all' | 'issues' | 'anomalies';

type HeatPointSource = 'issue' | 'anomaly';

interface HeatPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  source: HeatPointSource;
}

interface HeatProjectionResult {
  points: HeatPoint[];
  droppedInvalid: number;
}

interface HeatDiagnostics {
  totalPoints: number;
  issuePoints: number;
  anomalyPoints: number;
  droppedInvalid: number;
}

const MAX_HEAT_POINTS = 1500;

const PRIORITY_WEIGHT: Record<Issue['priority'], number> = {
  low: 0.3,
  medium: 0.5,
  high: 0.75,
  urgent: 1,
};

const STATUS_WEIGHT: Record<IssueStatus, number> = {
  pending: 1,
  'in-progress': 0.75,
  resolved: 0.2,
};

const ANOMALY_SEVERITY_WEIGHT: Record<string, number> = {
  low: 0.35,
  medium: 0.55,
  high: 0.78,
  critical: 0.95,
};

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));

const isValidCoordinate = (latitude: number, longitude: number): boolean => (
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180
);

const toDateSafe = (value: Date | string | number | undefined): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
};

const computeIssueIntensity = (issue: Issue): number => {
  const createdAt = toDateSafe(issue.createdAt);
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
  const recencyScore = Math.exp(-ageDays / 14);
  const upvoteScore = clamp(Math.log1p(Math.max(0, issue.upvotes)) / Math.log1p(30));
  const priorityScore = PRIORITY_WEIGHT[issue.priority] ?? 0.5;
  const statusScore = STATUS_WEIGHT[issue.status] ?? 0.6;

  const weighted = (
    upvoteScore * 0.4 +
    priorityScore * 0.35 +
    recencyScore * 0.25
  ) * statusScore;

  return clamp(weighted, 0.08, 1);
};

const computeAnomalyIntensity = (anomaly: RoadAnomaly): number => {
  const severityScore = ANOMALY_SEVERITY_WEIGHT[anomaly.severity] ?? 0.6;
  const confidenceScore = clamp(typeof anomaly.confidence === 'number' ? anomaly.confidence : 0.5);
  const explicitIntensity = typeof anomaly.intensity === 'number'
    ? clamp(anomaly.intensity)
    : typeof anomaly.features?.peakMagnitude === 'number'
      ? clamp(anomaly.features.peakMagnitude / 20)
      : severityScore;

  const createdAt = toDateSafe(anomaly.createdAt);
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
  const recencyScore = Math.exp(-ageDays / 21);

  const weighted = (
    severityScore * 0.35 +
    confidenceScore * 0.3 +
    explicitIntensity * 0.2 +
    recencyScore * 0.15
  );

  return clamp(weighted, 0.08, 1);
};

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getHeatVisualConfig = (zoom: number) => {
  const safeZoom = Number.isFinite(zoom) ? zoom : 13;
  const radius = Math.max(14, Math.min(34, Math.round(36 - safeZoom * 1.1)));
  const blur = Math.max(10, Math.min(24, Math.round(radius * 0.72)));

  return {
    radius,
    blur,
  };
};

export const RealMapView: React.FC<RealMapViewProps> = ({
  className,
  onIssueSelect,
  selectedIssueId,
  focusUserLocationSignal,
  userLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const heatmapRef = useRef<L.Layer | null>(null);
  const clusterGroupRef = useRef<L.LayerGroup | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const markerUpdateFrameRef = useRef<number | null>(null);
  const renderSequenceRef = useRef(0);
  const heatPluginReadyRef = useRef(false);
  const clusterPluginReadyRef = useRef(false);
  const heatSubscriptionRef = useRef<(() => void) | null>(null);
  const clusterSubscriptionRef = useRef<(() => void) | null>(null);
  const hasAutoCenteredRef = useRef(false);
  const initialCenterRef = useRef<[number, number]>(toMapCenter(userLocation));
  
  const { issues, isLoading } = useMapData();
  const [viewMode, setViewMode] = useState<MapViewMode>('pins');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<IssueCategory[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [roadAnomalies, setRoadAnomalies] = useState<RoadAnomaly[]>([]);
  const [anomalyClusters, setAnomalyClusters] = useState<AnomalyCluster[]>([]);
  const [pluginStatus, setPluginStatus] = useState({ heat: false, cluster: false });
  const [heatSourceFilter, setHeatSourceFilter] = useState<HeatSourceFilter>('all');
  const [heatDiagnostics, setHeatDiagnostics] = useState<HeatDiagnostics>({
    totalPoints: 0,
    issuePoints: 0,
    anomalyPoints: 0,
    droppedInvalid: 0,
  });
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{latitude: number; longitude: number; address: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchLocationMarkerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mergedHeatmapEnabled = import.meta.env.VITE_MAP_HEATMAP_MERGED_SOURCES !== 'false';
  const balancedMergeEnabled = import.meta.env.VITE_MAP_HEAT_BALANCED_MERGE !== 'false';

  useEffect(() => {
    if (!mergedHeatmapEnabled) {
      setHeatSourceFilter('issues');
    }
  }, [mergedHeatmapEnabled]);

  const getLeaflet = useCallback(async () => {
    if (leafletRef.current) return leafletRef.current;
    const L = await import('leaflet');
    leafletRef.current = L;
    return L;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let mounted = true;

    const initMap = async () => {
      try {
        // Ensure container has dimensions
        if (!mapRef.current) return;
        
        // Wait a bit to ensure container is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mounted || !mapRef.current) return;

        // Load Leaflet dynamically
        const L = await getLeaflet();
        
        // Fix default markers
        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!mounted || !mapRef.current) return;

        // Create map
        const [initialLat, initialLng] = initialCenterRef.current;
        const map = L.map(mapRef.current!, {
          center: [initialLat, initialLng],
          zoom: 13,
          zoomControl: false,
          preferCanvas: true,
          fadeAnimation: true,
          markerZoomAnimation: false
        });

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        }).addTo(map);

        // Handle tile errors
        tileLayer.on('tileerror', (error) => {
          console.warn('Tile loading error:', error);
        });

        mapInstanceRef.current = map;
        canvasRendererRef.current = L.canvas({ padding: 0.4 });
        setMapLoaded(true);
        
        // Invalidate size to ensure map renders correctly after render
        setTimeout(() => {
          if (mapInstanceRef.current && mounted) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);

        // Load plugins once (they extend L namespace)
        // Keep plugin availability in refs so render paths never race on dynamic imports.
        (window as unknown as Record<string, unknown>).L = L;

        try {
          await import('leaflet.heat');
          heatPluginReadyRef.current = true;
        } catch (error) {
          heatPluginReadyRef.current = false;
          console.warn('Leaflet heat plugin is unavailable:', error);
        }

        try {
          await import('leaflet.markercluster');
          clusterPluginReadyRef.current = true;
        } catch (error) {
          clusterPluginReadyRef.current = false;
          console.warn('Leaflet marker cluster plugin is unavailable:', error);
        }

        if (mounted) {
          setPluginStatus({
            heat: heatPluginReadyRef.current,
            cluster: clusterPluginReadyRef.current,
          });
        }

      } catch (error) {
        console.error('Failed to load map:', error);
        setMapLoaded(false);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }

      heatSubscriptionRef.current?.();
      heatSubscriptionRef.current = null;
      clusterSubscriptionRef.current?.();
      clusterSubscriptionRef.current = null;
    };
  }, [getLeaflet]);

  // Cleanup search marker and pending animation frame on unmount
  useEffect(() => {
    return () => {
      if (searchLocationMarkerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(searchLocationMarkerRef.current);
        } catch (e) {
          console.warn('Error removing search marker:', e);
        }
      }
      if (markerUpdateFrameRef.current !== null) {
        cancelAnimationFrame(markerUpdateFrameRef.current);
      }
    };
  }, []);

  // Invalidate map size when fullscreen changes
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen, mapLoaded]);

  // Allow external controls (page header) to recenter map on user's location.
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !userLocation || focusUserLocationSignal === undefined) {
      return;
    }
    mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 14, {
      animate: true,
      duration: 0.45,
    });
  }, [focusUserLocationSignal, mapLoaded, userLocation]);

  // Snap to live location once when the first valid fix arrives.
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !userLocation || hasAutoCenteredRef.current) {
      return;
    }

    mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 14, {
      animate: true,
      duration: 0.35,
    });
    hasAutoCenteredRef.current = true;
  }, [mapLoaded, userLocation]);

  // Keep anomaly data live even outside Roads mode so heatmap can merge civic + PRAD points.
  useEffect(() => {
    let active = true;
    const [lat, lng] = toMapCenter(userLocation);

    const loadAnomalyData = async () => {
      try {
        const [anomalies, clusters] = await Promise.all([
          roadAnomalyService.getNearbyAnomalies(lat, lng, 25),
          roadAnomalyService.getClusters(undefined, undefined, { latitude: lat, longitude: lng }),
        ]);

        if (!active) return;
        setRoadAnomalies(anomalies);
        setAnomalyClusters(clusters);
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load road anomaly data:', err);
      }
    };

    loadAnomalyData();

    heatSubscriptionRef.current?.();
    clusterSubscriptionRef.current?.();

    heatSubscriptionRef.current = roadAnomalyService.subscribeToAnomalies(
      (anomaly) => {
        if (!active) return;
        if (!isValidCoordinate(anomaly.location.latitude, anomaly.location.longitude)) return;

        const userLat = userLocation?.latitude;
        const userLng = userLocation?.longitude;
        if (
          typeof userLat === 'number' &&
          typeof userLng === 'number' &&
          getDistanceKm(userLat, userLng, anomaly.location.latitude, anomaly.location.longitude) > 30
        ) {
          return;
        }

        setRoadAnomalies((prev) => {
          if (prev.some((item) => item.id === anomaly.id)) return prev;
          return [anomaly, ...prev].slice(0, 1200);
        });
      },
      {
        event: 'INSERT',
        source: 'app',
      }
    );

    clusterSubscriptionRef.current = roadAnomalyService.subscribeToClusters((cluster) => {
      if (!active) return;
      setAnomalyClusters((prev) => {
        const index = prev.findIndex((item) => item.id === cluster.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = cluster;
          return next;
        }
        return [cluster, ...prev].slice(0, 400);
      });
    });

    return () => {
      active = false;
      heatSubscriptionRef.current?.();
      heatSubscriptionRef.current = null;
      clusterSubscriptionRef.current?.();
      clusterSubscriptionRef.current = null;
    };
  }, [userLocation, userLocation?.latitude, userLocation?.longitude]);

  // Debounce issue text filtering to reduce marker churn while typing.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchQuery(searchQuery), 140);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Real-time location search with geocoding
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Search for locations using geocoding
        const results = await apiService.geocode(searchQuery, 5);
        setSearchSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Location search failed:', error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Filter issues - now includes location search
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const searchLower = debouncedSearchQuery.toLowerCase();
      const matchesSearch = debouncedSearchQuery === '' || 
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description.toLowerCase().includes(searchLower) ||
        issue.location.address?.toLowerCase().includes(searchLower);
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(issue.category);
      
      const matchesStatus = selectedStatuses.length === 0 || 
        selectedStatuses.includes(issue.status);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [issues, debouncedSearchQuery, selectedCategories, selectedStatuses]);

  const categoryIssueCounts = useMemo(() => {
    const counts = {} as Record<IssueCategory, number>;
    issues.forEach((issue) => {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
    });
    return counts;
  }, [issues]);

  const statusIssueCounts = useMemo(() => {
    const counts = {} as Record<IssueStatus, number>;
    issues.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    });
    return counts;
  }, [issues]);

  const civicHeatProjection = useMemo<HeatProjectionResult>(() => {
    let droppedInvalid = 0;
    const points: HeatPoint[] = [];

    filteredIssues.forEach((issue) => {
      const latitude = issue.location?.latitude;
      const longitude = issue.location?.longitude;

      if (!isValidCoordinate(latitude, longitude)) {
        droppedInvalid += 1;
        return;
      }

      points.push({
        latitude,
        longitude,
        intensity: computeIssueIntensity(issue),
        source: 'issue',
      });
    });

    return { points, droppedInvalid };
  }, [filteredIssues]);

  const anomalyHeatProjection = useMemo<HeatProjectionResult>(() => {
    let droppedInvalid = 0;
    const points: HeatPoint[] = [];

    roadAnomalies.forEach((anomaly) => {
      const latitude = anomaly.location?.latitude;
      const longitude = anomaly.location?.longitude;

      if (!isValidCoordinate(latitude, longitude)) {
        droppedInvalid += 1;
        return;
      }

      points.push({
        latitude,
        longitude,
        intensity: computeAnomalyIntensity(anomaly),
        source: 'anomaly',
      });
    });

    return { points, droppedInvalid };
  }, [roadAnomalies]);

  const activeHeatProjection = useMemo<HeatProjectionResult>(() => {
    let points: HeatPoint[];

    if (!mergedHeatmapEnabled || heatSourceFilter === 'issues') {
      points = [...civicHeatProjection.points];
    } else if (heatSourceFilter === 'anomalies') {
      points = [...anomalyHeatProjection.points];
    } else {
      points = [...civicHeatProjection.points, ...anomalyHeatProjection.points];
    }

    const droppedInvalid = mergedHeatmapEnabled
      ? civicHeatProjection.droppedInvalid + anomalyHeatProjection.droppedInvalid
      : civicHeatProjection.droppedInvalid;

    if (mergedHeatmapEnabled && balancedMergeEnabled && heatSourceFilter === 'all') {
      const issueCount = points.filter((point) => point.source === 'issue').length;
      const anomalyCount = points.filter((point) => point.source === 'anomaly').length;
      const total = issueCount + anomalyCount;

      if (total > 0 && issueCount > 0 && anomalyCount > 0) {
        const issueShare = issueCount / total;
        const anomalyShare = anomalyCount / total;
        const targetIssueShare = 0.6;
        const targetAnomalyShare = 0.4;

        const issueScale = clamp(Math.sqrt(targetIssueShare / issueShare), 0.7, 1.3);
        const anomalyScale = clamp(Math.sqrt(targetAnomalyShare / anomalyShare), 0.7, 1.3);

        points = points.map((point) => {
          const scale = point.source === 'issue' ? issueScale : anomalyScale;
          return {
            ...point,
            intensity: clamp(point.intensity * scale, 0.06, 1),
          };
        });
      }
    }

    const cappedPoints = points.length > MAX_HEAT_POINTS
      ? [...points].sort((a, b) => b.intensity - a.intensity).slice(0, MAX_HEAT_POINTS)
      : points;

    return {
      points: cappedPoints,
      droppedInvalid,
    };
  }, [
    mergedHeatmapEnabled,
    balancedMergeEnabled,
    heatSourceFilter,
    civicHeatProjection,
    anomalyHeatProjection,
  ]);

  const activeHeatSourceBreakdown = useMemo(() => {
    return activeHeatProjection.points.reduce(
      (acc, point) => {
        if (point.source === 'issue') acc.issue += 1;
        if (point.source === 'anomaly') acc.anomaly += 1;
        return acc;
      },
      { issue: 0, anomaly: 0 }
    );
  }, [activeHeatProjection.points]);

  // Keep anomaly points relevant to map area while user pans/zooms in heat/anomaly modes.
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    const mapInstance = mapInstanceRef.current;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshAroundCenter = async () => {
      const center = mapInstance.getCenter();
      try {
        const nearby = await roadAnomalyService.getNearbyAnomalies(center.lat, center.lng, 25);
        setRoadAnomalies((prev) => {
          if (viewMode !== 'heatmap' && viewMode !== 'anomalies') return prev;
          return nearby;
        });
      } catch (error) {
        console.warn('Failed to refresh anomaly points for map center:', error);
      }
    };

    const handleMoveEnd = () => {
      if (viewMode !== 'heatmap' && viewMode !== 'anomalies') return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void refreshAroundCenter();
      }, 220);
    };

    mapInstance.on('moveend', handleMoveEnd);

    return () => {
      mapInstance.off('moveend', handleMoveEnd);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [mapLoaded, viewMode]);

  // Handle location selection from suggestions
  const handleLocationSelect = async (location: {latitude: number; longitude: number; address: string}) => {
    setSearchQuery(location.address);
    setShowSuggestions(false);
    
    if (mapInstanceRef.current) {
      const L = await getLeaflet();
      
      // Remove previous search marker
      if (searchLocationMarkerRef.current) {
        mapInstanceRef.current.removeLayer(searchLocationMarkerRef.current);
      }
      
      // Pan map to location
      mapInstanceRef.current.setView([location.latitude, location.longitude], 15);
      
      // Add marker for searched location
      const marker = L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          className: 'search-location-marker',
          html: `
            <div style="
              width: 40px; 
              height: 40px; 
              background: #1e40af; 
              border-radius: 50%; 
              border: 4px solid white; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              animation: pulse 2s infinite;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
                50% { transform: scale(1.1); box-shadow: 0 4px 20px rgba(30, 64, 175, 0.6); }
                100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
              }
            </style>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).bindPopup(`<div style="padding: 8px; text-align: center;"><strong>📍 ${location.address}</strong></div>`).openPopup();
      
      marker.addTo(mapInstanceRef.current);
      searchLocationMarkerRef.current = marker;
    }
  };

  // Update markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    let disposed = false;
    const renderSequence = ++renderSequenceRef.current;

    const updateMarkers = async () => {
      const L = await getLeaflet();

      if (disposed || renderSequence !== renderSequenceRef.current || !mapInstanceRef.current) return;

      const mapInstance = mapInstanceRef.current;

      // Clear existing dynamic layers.
      markersRef.current.forEach((marker) => {
        try {
          mapInstance.removeLayer(marker);
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      markersRef.current = [];

      if (heatmapRef.current) {
        try {
          mapInstance.removeLayer(heatmapRef.current);
        } catch (e) {
          console.warn('Error removing heatmap:', e);
        }
        heatmapRef.current = null;
      }

      if (clusterGroupRef.current) {
        try {
          mapInstance.removeLayer(clusterGroupRef.current);
        } catch (e) {
          console.warn('Error removing cluster group:', e);
        }
        clusterGroupRef.current = null;
      }

      const validIssues = filteredIssues.filter((issue) =>
        isValidCoordinate(issue.location?.latitude, issue.location?.longitude)
      );

      const createCustomIcon = (issue: Issue) => {
        const config = CATEGORY_CONFIG[issue.category];
        const statusColor = issue.status === 'resolved'
          ? '#10b981'
          : issue.status === 'in-progress'
            ? '#3b82f6'
            : '#f59e0b';

        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: ${statusColor};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              cursor: pointer;
            ">
              ${config.icon}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
      };

      if (viewMode === 'pins') {
        const renderIssues = validIssues.slice(0, 500);
        const useLightweightMarkers = renderIssues.length > 120;

        renderIssues.forEach((issue) => {
          const popupHtml = `
            <div style="min-width: 220px; padding: 10px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">${CATEGORY_CONFIG[issue.category].icon}</span>
                <h4 style="font-weight: 700; margin: 0; color: #1f2937; font-size: 14px;">${issue.title}</h4>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.35;">${issue.description}</p>
              <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280;">
                <span>${issue.category}</span>
                <span>👍 ${issue.upvotes}</span>
              </div>
            </div>
          `;

          if (useLightweightMarkers) {
            const statusColor = issue.status === 'resolved'
              ? '#10b981'
              : issue.status === 'in-progress'
                ? '#3b82f6'
                : '#f59e0b';

            const marker = L.circleMarker(
              [issue.location.latitude, issue.location.longitude],
              {
                radius: selectedIssueId === issue.id ? 8 : 6,
                color: '#ffffff',
                weight: 1.5,
                fillColor: statusColor,
                fillOpacity: 0.92,
                renderer: canvasRendererRef.current || undefined,
              }
            )
              .bindPopup(popupHtml)
              .on('click', () => onIssueSelect?.(issue));

            marker.addTo(mapInstance);
            markersRef.current.push(marker);

            if (selectedIssueId === issue.id) marker.openPopup();
          } else {
            const marker = L.marker(
              [issue.location.latitude, issue.location.longitude],
              { icon: createCustomIcon(issue) }
            )
              .bindPopup(popupHtml)
              .on('click', () => onIssueSelect?.(issue));

            marker.addTo(mapInstance);
            markersRef.current.push(marker);

            if (selectedIssueId === issue.id) marker.openPopup();
          }
        });
      } else if (viewMode === 'clusters') {
        if (!clusterPluginReadyRef.current || !(L as unknown as { markerClusterGroup?: unknown }).markerClusterGroup) {
          console.warn('Cluster plugin not ready. Falling back to Pins mode.');
          setViewMode('pins');
        } else {
          const markerClusterGroup = (L as unknown as {
            markerClusterGroup: (options: unknown) => L.LayerGroup;
          }).markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: (cluster: { getChildCount: () => number }) => {
              const count = cluster.getChildCount();
              const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
              const sizeMap = { small: 30, medium: 40, large: 50 };

              return L.divIcon({
                html: `<div style="
                  width: ${sizeMap[size]}px;
                  height: ${sizeMap[size]}px;
                  background: linear-gradient(135deg, #1e40af, #3b82f6);
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: ${size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px'};
                ">${count}</div>`,
                className: 'custom-cluster',
                iconSize: [sizeMap[size], sizeMap[size]],
              });
            },
          });

          validIssues.forEach((issue) => {
            const marker = L.marker(
              [issue.location.latitude, issue.location.longitude],
              { icon: createCustomIcon(issue) }
            )
              .bindPopup(`<div style="padding: 8px;"><h4 style="margin: 0 0 4px 0;">${issue.title}</h4><p style="margin: 0; font-size: 12px; color: #666;">${issue.description}</p></div>`)
              .on('click', () => onIssueSelect?.(issue));

            markerClusterGroup.addLayer(marker);
          });

          mapInstance.addLayer(markerClusterGroup);
          clusterGroupRef.current = markerClusterGroup;
        }
      } else if (viewMode === 'heatmap') {
        const heatIssuePoints = activeHeatSourceBreakdown.issue;
        const heatAnomalyPoints = activeHeatSourceBreakdown.anomaly;
        const droppedInvalid = activeHeatProjection.droppedInvalid;

        setHeatDiagnostics((prev) => {
          if (
            prev.totalPoints === activeHeatProjection.points.length &&
            prev.issuePoints === heatIssuePoints &&
            prev.anomalyPoints === heatAnomalyPoints &&
            prev.droppedInvalid === droppedInvalid
          ) {
            return prev;
          }

          return {
            totalPoints: activeHeatProjection.points.length,
            issuePoints: heatIssuePoints,
            anomalyPoints: heatAnomalyPoints,
            droppedInvalid,
          };
        });

        if (heatPluginReadyRef.current) {
          const heatLayerFactory = (L as unknown as {
            heatLayer?: (data: [number, number, number][], options: unknown) => L.Layer;
          }).heatLayer;

          if (typeof heatLayerFactory === 'function' && activeHeatProjection.points.length > 0) {
            const heatData = activeHeatProjection.points.map((point) => [
              point.latitude,
              point.longitude,
              point.intensity,
            ] as [number, number, number]);

            const { radius, blur } = getHeatVisualConfig(mapInstance.getZoom());

            const heat = heatLayerFactory(heatData, {
              radius,
              blur,
              maxZoom: 17,
              max: 1,
              minOpacity: 0.3,
              gradient: {
                0.0: '#1d4ed8',
                0.2: '#3b82f6',
                0.4: '#14b8a6',
                0.55: '#f59e0b',
                0.8: '#f97316',
                1.0: '#dc2626',
              },
            });

            mapInstance.addLayer(heat);
            heatmapRef.current = heat;
          }
        }
      } else {
        setHeatDiagnostics((prev) => {
          if (
            prev.totalPoints === 0 &&
            prev.issuePoints === 0 &&
            prev.anomalyPoints === 0 &&
            prev.droppedInvalid === 0
          ) {
            return prev;
          }

          return {
            totalPoints: 0,
            issuePoints: 0,
            anomalyPoints: 0,
            droppedInvalid: 0,
          };
        });
      }

      if (userLocation) {
        const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background: #1e40af;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3), 0 2px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 0 rgba(30, 64, 175, 0.7), 0 2px 8px rgba(0,0,0,0.3); }
                  70% { box-shadow: 0 0 0 10px rgba(30, 64, 175, 0), 0 2px 8px rgba(0,0,0,0.3); }
                  100% { box-shadow: 0 0 0 0 rgba(30, 64, 175, 0), 0 2px 8px rgba(0,0,0,0.3); }
                }
              </style>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).bindPopup('<div style="padding: 8px; text-align: center;"><strong>Your Location</strong></div>');

        userMarker.addTo(mapInstance);
        markersRef.current.push(userMarker);
      }

      if (searchLocationMarkerRef.current) {
        searchLocationMarkerRef.current.setZIndexOffset(1000);
      }
    };

    if (markerUpdateFrameRef.current !== null) {
      cancelAnimationFrame(markerUpdateFrameRef.current);
    }

    markerUpdateFrameRef.current = requestAnimationFrame(() => {
      void updateMarkers();
    });

    return () => {
      disposed = true;
      if (markerUpdateFrameRef.current !== null) {
        cancelAnimationFrame(markerUpdateFrameRef.current);
        markerUpdateFrameRef.current = null;
      }
    };
  }, [
    filteredIssues,
    viewMode,
    selectedIssueId,
    userLocation,
    mapLoaded,
    onIssueSelect,
    selectedCategories,
    selectedStatuses,
    debouncedSearchQuery,
    activeHeatProjection,
    activeHeatSourceBreakdown,
    mergedHeatmapEnabled,
    heatSourceFilter,
    pluginStatus,
    getLeaflet,
  ]);

  // Map controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  };

  const toggleCategory = (category: IssueCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleStatus = (status: IssueStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedStatuses([]);
    // Remove search location marker
    if (searchLocationMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(searchLocationMarkerRef.current);
      searchLocationMarkerRef.current = null;
    }
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <Card className={cn("border-0 shadow-none overflow-hidden bg-transparent", className, isFullscreen && "fixed inset-4 z-50 bg-white rounded-[2rem] shadow-2xl")}>
      <CardHeader className="pb-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Live Interactive Map</h2>
              <p className="text-sm text-gray-600 font-medium">Real-time civic issues visualization</p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showSettings ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-sm"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          <div className="relative flex-1" data-tutorial="map-search">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <Input
              placeholder="Search issues by title, description, or location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(e.target.value.length >= 3);
              }}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow click on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="pl-10 h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm"
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2">📍 Locations</div>
                  {searchSuggestions.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-3 py-2 hover:bg-royal/5 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {location.address}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search Results Count */}
            {searchQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-indigo-600 text-xs shadow-sm">
                  {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearFilters();
                // Remove search location marker
                if (searchLocationMarkerRef.current && mapInstanceRef.current) {
                  mapInstanceRef.current.removeLayer(searchLocationMarkerRef.current);
                  searchLocationMarkerRef.current = null;
                }
                setSearchSuggestions([]);
                setShowSuggestions(false);
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            
            {!searchQuery && (
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-indigo-600 shadow-sm">
                {filteredIssues.length} issues
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative">
          {/* Map Container */}
          <div 
            ref={mapRef}
            className={cn(
              "relative w-full overflow-hidden bg-gray-100",
              isFullscreen ? "h-[calc(100vh-12rem)]" : "h-[600px]"
            )}
            style={{ minHeight: isFullscreen ? 'calc(100vh - 12rem)' : '600px' }}
            data-tutorial="map-container"
          >
            {/* Loading State */}
            {(isLoading || !mapLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-[2px] z-[1000]">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-900">Loading interactive map...</p>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Please wait while we initialize the map</p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {!isLoading && !mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 backdrop-blur-sm z-[1000]">
                <div className="text-center p-6">
                  <div className="w-12 h-12 border-4 border-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-red-500 text-2xl">⚠️</span>
                  </div>
                  <p className="text-lg font-semibold text-red-700 mb-2">Failed to load map</p>
                  <p className="text-sm text-red-600 mb-4">Please refresh the page or check your internet connection</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            )}

            {viewMode === 'heatmap' && mapLoaded && (
              <div className="absolute top-4 left-1/2 z-[1000] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
                <div className="font-semibold text-slate-700">
                  {heatDiagnostics.totalPoints} heat points
                </div>
                <div className="text-[11px] text-slate-500">
                  Issues: {heatDiagnostics.issuePoints} • Anomalies: {heatDiagnostics.anomalyPoints}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Weighted by upvotes, priority, recency, and anomaly confidence.
                </div>

                {mergedHeatmapEnabled && heatSourceFilter === 'all' && balancedMergeEnabled && (
                  <div className="mt-1 text-[10px] text-indigo-500">
                    Balanced merge active (issue/anomaly normalization).
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={heatSourceFilter === 'all' ? 'default' : 'outline'}
                    className="h-6 px-2 text-[10px]"
                    disabled={!mergedHeatmapEnabled}
                    onClick={() => setHeatSourceFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={heatSourceFilter === 'issues' ? 'default' : 'outline'}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => setHeatSourceFilter('issues')}
                  >
                    Issues
                  </Button>
                  <Button
                    size="sm"
                    variant={heatSourceFilter === 'anomalies' ? 'default' : 'outline'}
                    className="h-6 px-2 text-[10px]"
                    disabled={!mergedHeatmapEnabled}
                    onClick={() => setHeatSourceFilter('anomalies')}
                  >
                    PRAD
                  </Button>
                </div>

                {heatDiagnostics.droppedInvalid > 0 && (
                  <div className="text-[11px] text-amber-600">
                    Dropped invalid coordinates: {heatDiagnostics.droppedInvalid}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'heatmap' && mapLoaded && !pluginStatus.heat && (
              <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm">
                Heatmap plugin unavailable. Switch to Pins or Clusters.
              </div>
            )}

            {viewMode === 'heatmap' && mapLoaded && pluginStatus.heat && heatDiagnostics.totalPoints === 0 && (
              <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                No valid points match current filters.
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-[1000] space-y-3">
            {/* View Mode Toggle */}
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm" data-tutorial="map-view-modes">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900">View</span>
              </div>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as MapViewMode)}
                className="grid grid-cols-1 gap-1"
              >
                <ToggleGroupItem value="pins" className="data-[state=on]:bg-indigo-600 data-[state=on]:text-white text-xs font-semibold">
                  <MapPin className="w-3 h-3 mr-1" />
                  Pins
                </ToggleGroupItem>
                <ToggleGroupItem value="clusters" className="data-[state=on]:bg-indigo-600 data-[state=on]:text-white text-xs font-semibold">
                  <Activity className="w-3 h-3 mr-1" />
                  Clusters
                </ToggleGroupItem>
                <ToggleGroupItem value="heatmap" className="data-[state=on]:bg-indigo-600 data-[state=on]:text-white text-xs font-semibold">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Heatmap
                </ToggleGroupItem>
                <ToggleGroupItem value="anomalies" className="data-[state=on]:bg-indigo-600 data-[state=on]:text-white text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Roads
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-[1000] space-y-2">
            <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0 hover:bg-slate-50 text-slate-700"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0 hover:bg-slate-50 text-slate-700"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>

            {userLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetView}
                className="bg-white border border-slate-200 rounded-xl h-8 w-8 p-0 hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Road Anomaly Overlay */}
          {viewMode === 'anomalies' && mapLoaded && mapInstanceRef.current && (
            <AnomalyMapLayer
              map={mapInstanceRef.current}
              anomalies={roadAnomalies}
              clusters={anomalyClusters}
            />
          )}

          {/* Filter Panel */}
          {showSettings && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]" data-tutorial="map-filters">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900">Filters</span>
              </div>
              
              {/* Category Filters */}
              <div className="mb-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Categories</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                    const count = categoryIssueCounts[category as IssueCategory] || 0;
                    const isSelected = selectedCategories.includes(category as IssueCategory);
                    
                    return (
                      <Button
                        key={category}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category as IssueCategory)}
                        className={cn(
                          "text-xs h-7 font-semibold",
                          isSelected 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : "hover:bg-slate-50 border-slate-200 text-slate-700"
                        )}
                      >
                        <span className="mr-1">{config.icon}</span>
                        {config.label} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Status Filters */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = statusIssueCounts[status as IssueStatus] || 0;
                    const isSelected = selectedStatuses.includes(status as IssueStatus);
                    
                    return (
                      <Button
                        key={status}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStatus(status as IssueStatus)}
                        className={cn(
                          "text-xs h-7 font-semibold",
                          isSelected 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : "hover:bg-slate-50 border-slate-200 text-slate-700"
                        )}
                      >
                        {config.label} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};