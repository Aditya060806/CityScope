import React, { useEffect, useRef, useCallback, useState } from 'react';
import type L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RoadAnomaly,
  AnomalyCluster,
  ANOMALY_TYPE_CONFIG,
  ANOMALY_SEVERITY_CONFIG,
} from '@/types/road-anomaly';
import { cn } from '@/lib/utils';

interface AnomalyMapLayerProps {
  map: L.Map | null;
  anomalies: RoadAnomaly[];
  clusters: AnomalyCluster[];
  showAnomalies?: boolean;
  showClusters?: boolean;
  onClusterClick?: (cluster: AnomalyCluster) => void;
  onAnomalyClick?: (anomaly: RoadAnomaly) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const TYPE_COLORS: Record<string, string> = {
  pothole: '#ef4444',
  speed_breaker: '#f59e0b',
  rough_road: '#f97316',
  manhole: '#8b5cf6',
  railway_crossing: '#6366f1',
  unknown: '#9ca3af',
};

export const AnomalyMapLayer: React.FC<AnomalyMapLayerProps> = ({
  map,
  anomalies,
  clusters,
  showAnomalies = true,
  showClusters = true,
  onClusterClick,
  onAnomalyClick,
}) => {
  const anomalyMarkersRef = useRef<L.CircleMarker[]>([]);
  const clusterCirclesRef = useRef<L.Circle[]>([]);
  const leafletRef = useRef<typeof L | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      const L = await import('leaflet');
      leafletRef.current = L.default || L;
    };
    loadLeaflet();
  }, []);

  // Inject CSS for pulsing fresh-detection dots
  useEffect(() => {
    const id = 'prad-dot-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes prad-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: .6; transform: scale(1.6); }
      }
      .prad-dot-fresh { animation: prad-pulse 1.4s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // Render anomaly markers as small consecutive trail dots
  const renderAnomalies = useCallback(() => {
    const L = leafletRef.current;
    if (!L || !map) return;

    // Clear existing
    anomalyMarkersRef.current.forEach(m => m.remove());
    anomalyMarkersRef.current = [];

    if (!showAnomalies) return;

    const fiveMinAgo = Date.now() - 5 * 60 * 1000;

    anomalies.forEach(anomaly => {
      const color = TYPE_COLORS[anomaly.anomalyType] || TYPE_COLORS.unknown;
      const isFresh = new Date(anomaly.detectedAt).getTime() > fiveMinAgo;
      // Small dots: 3-4px radius for tight consecutive trail look
      const radius = anomaly.severity === 'critical' ? 4.5 : anomaly.severity === 'high' ? 4 : anomaly.severity === 'medium' ? 3.5 : 3;

      const marker = L.circleMarker(
        [anomaly.location.latitude, anomaly.location.longitude],
        {
          radius,
          fillColor: color,
          color: isFresh ? color : '#ffffff',
          weight: isFresh ? 1.5 : 1,
          opacity: isFresh ? 1 : 0.8,
          fillOpacity: isFresh ? 0.95 : 0.75,
          className: isFresh ? 'prad-dot-fresh' : '',
        }
      ).addTo(map);

      const typeConfig = ANOMALY_TYPE_CONFIG[anomaly.anomalyType];
      const sevConfig = ANOMALY_SEVERITY_CONFIG[anomaly.severity];

      marker.bindPopup(`
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">${typeConfig?.icon ?? '⚠️'}</span>
            <div>
              <strong style="font-size: 14px;">${typeConfig?.label ?? anomaly.anomalyType}</strong>
              <div style="font-size: 11px; color: #666;">
                ${sevConfig?.label ?? anomaly.severity} severity
              </div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
            <div><b>Confidence:</b> ${Math.round(anomaly.confidence * 100)}%</div>
            <div><b>Status:</b> ${anomaly.status}</div>
            ${anomaly.features ? `
              <div><b>Peak G:</b> ${(anomaly.features.peakMagnitude / 9.81).toFixed(1)}g</div>
              <div><b>Speed:</b> ${anomaly.features.speed ? (anomaly.features.speed * 3.6).toFixed(0) + ' km/h' : 'N/A'}</div>
            ` : ''}
          </div>
          <div style="margin-top: 8px; font-size: 10px; color: #999;">
            ${new Date(anomaly.detectedAt).toLocaleString()}
          </div>
        </div>
      `);

      marker.on('click', () => onAnomalyClick?.(anomaly));
      anomalyMarkersRef.current.push(marker);
    });
  }, [map, anomalies, showAnomalies, onAnomalyClick]);

  // Render cluster circles
  const renderClusters = useCallback(() => {
    const L = leafletRef.current;
    if (!L || !map) return;

    // Clear existing
    clusterCirclesRef.current.forEach(c => c.remove());
    clusterCirclesRef.current = [];

    if (!showClusters) return;

    clusters.forEach(cluster => {
      const severityScore = cluster.severityScore ?? 5;
      const color = severityScore >= 8 ? SEVERITY_COLORS.critical
        : severityScore >= 6 ? SEVERITY_COLORS.high
        : severityScore >= 4 ? SEVERITY_COLORS.medium
        : SEVERITY_COLORS.low;

      const circle = L.circle(
        [cluster.centroidLat, cluster.centroidLng],
        {
          radius: cluster.detectionRadiusM || 50,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.15,
          dashArray: '5, 5',
        }
      ).addTo(map);

      const typeConfig = ANOMALY_TYPE_CONFIG[cluster.anomalyType];

      circle.bindPopup(`
        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px;">${typeConfig?.icon ?? '📍'}</span>
            <div>
              <strong style="font-size: 14px;">${typeConfig?.label ?? cluster.anomalyType} Cluster</strong>
              <div style="font-size: 11px; color: #666;">
                ${cluster.detectionCount} detections by ${cluster.uniqueReporters} user${cluster.uniqueReporters !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style="margin: 8px 0;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span>Severity Score</span>
                <strong>${severityScore.toFixed(1)}/10</strong>
              </div>
              <div style="background: #e5e7eb; border-radius: 4px; height: 6px; overflow: hidden;">
                <div style="background: ${color}; height: 100%; width: ${severityScore * 10}%; border-radius: 4px; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>
          <div style="font-size: 11px; color: ${cluster.status === 'verified' || cluster.status === 'probable' ? '#059669' : cluster.status === 'escalated' ? '#2563eb' : '#6b7280'};">
            Status: ${cluster.status}
            ${cluster.issueId ? ' • Linked to issue' : ''}
          </div>
        </div>
      `);

      circle.on('click', () => onClusterClick?.(cluster));
      clusterCirclesRef.current.push(circle);
    });
  }, [map, clusters, showClusters, onClusterClick]);

  // Re-render on data/visibility changes
  useEffect(() => {
    renderAnomalies();
    return () => {
      anomalyMarkersRef.current.forEach(m => m.remove());
      anomalyMarkersRef.current = [];
    };
  }, [renderAnomalies]);

  useEffect(() => {
    renderClusters();
    return () => {
      clusterCirclesRef.current.forEach(c => c.remove());
      clusterCirclesRef.current = [];
    };
  }, [renderClusters]);

  return null; // This component only manages map layers imperatively
};
