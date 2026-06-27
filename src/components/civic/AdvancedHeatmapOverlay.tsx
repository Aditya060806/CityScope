import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Issue, IssueCategory, IssueStatus } from '@/types/civic';
import { cn } from '@/lib/utils';

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  category: IssueCategory;
  status: IssueStatus;
  weight: number;
  issueId: string;
}

interface HeatmapConfig {
  radius: number;
  blur: number;
  maxIntensity: number;
  gradient: Record<number, string>;
  opacity: number;
  showCategories: boolean;
  showStatus: boolean;
  timeRange: '24h' | '7d' | '30d' | 'all';
  categoryFilter: IssueCategory[];
  statusFilter: IssueStatus[];
}

interface AdvancedHeatmapOverlayProps {
  issues: Issue[];
  center: { lat: number; lng: number };
  zoom: number;
  config?: Partial<HeatmapConfig>;
  onPointClick?: (issue: Issue) => void;
  onHeatmapUpdate?: (heatmapData: HeatmapPoint[]) => void;
  className?: string;
}

export const AdvancedHeatmapOverlay: React.FC<AdvancedHeatmapOverlayProps> = ({
  issues,
  center,
  zoom,
  config = {},
  onPointClick,
  onHeatmapUpdate,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultConfig: HeatmapConfig = useMemo(() => ({
    radius: 50,
    blur: 15,
    maxIntensity: 1,
    gradient: {
      0.0: 'rgba(0, 255, 0, 0)',
      0.1: 'rgba(0, 255, 0, 0.1)',
      0.3: 'rgba(255, 255, 0, 0.3)',
      0.6: 'rgba(255, 165, 0, 0.6)',
      0.8: 'rgba(255, 0, 0, 0.8)',
      1.0: 'rgba(255, 0, 0, 1)'
    },
    opacity: 0.7,
    showCategories: true,
    showStatus: true,
    timeRange: 'all',
    categoryFilter: [],
    statusFilter: []
  }), []);

  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config, defaultConfig]);

  // Process issues into heatmap points
  const processedHeatmapData = useMemo(() => {
    if (!issues.length) return [];

    const now = Date.now();
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const timeThreshold = now - timeRanges[finalConfig.timeRange];

    return issues
      .filter(issue => {
        const issueTime = new Date(issue.createdAt).getTime();
        const categoryMatch = finalConfig.categoryFilter.length === 0 || 
                             finalConfig.categoryFilter.includes(issue.category);
        const statusMatch = finalConfig.statusFilter.length === 0 || 
                           finalConfig.statusFilter.includes(issue.status);
        const timeMatch = issueTime >= timeThreshold;

        return categoryMatch && statusMatch && timeMatch;
      })
      .map(issue => {
        // Calculate intensity based on multiple factors
        const age = now - new Date(issue.createdAt).getTime();
        const ageWeight = Math.max(0, 1 - (age / (30 * 24 * 60 * 60 * 1000))); // 30 days decay
        
        const priorityWeight = {
          'urgent': 1.0,
          'high': 0.8,
          'medium': 0.6,
          'low': 0.4
        }[issue.priority] || 0.6;

        const statusWeight = {
          'pending': 1.0,
          'in-progress': 0.8,
          'resolved': 0.3
        }[issue.status] || 0.6;

        const upvotesWeight = Math.min(1, issue.flags / 10); // Normalize upvotes
        
        const intensity = (ageWeight * 0.3 + priorityWeight * 0.3 + statusWeight * 0.2 + upvotesWeight * 0.2);

        return {
          lat: issue.location.latitude,
          lng: issue.location.longitude,
          intensity: Math.min(intensity, finalConfig.maxIntensity),
          category: issue.category,
          status: issue.status,
          weight: intensity,
          issueId: issue.id
        };
      });
  }, [issues, finalConfig]);

  // Generate heatmap visualization
  useEffect(() => {
    if (!canvasRef.current || !processedHeatmapData.length) return;

    setIsLoading(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Create heatmap
    generateHeatmap(ctx, canvas.offsetWidth, canvas.offsetHeight);

    setHeatmapData(processedHeatmapData);
    onHeatmapUpdate?.(processedHeatmapData);
    setIsLoading(false);
  }, [processedHeatmapData, center, zoom, finalConfig, generateHeatmap, onHeatmapUpdate]);

  const generateHeatmap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create a temporary canvas for heatmap generation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Draw heat points
    processedHeatmapData.forEach(point => {
      const screenPos = latLngToScreen(point.lat, point.lng, width, height);
      if (!screenPos) return;

      const gradient = tempCtx.createRadialGradient(
        screenPos.x, screenPos.y, 0,
        screenPos.x, screenPos.y, finalConfig.radius
      );

      // Create gradient based on intensity
      Object.entries(finalConfig.gradient).forEach(([stop, color]) => {
        const stopValue = parseFloat(stop) * point.intensity;
        gradient.addColorStop(stopValue, color);
      });

      tempCtx.globalAlpha = point.intensity * finalConfig.opacity;
      tempCtx.fillStyle = gradient;
      tempCtx.beginPath();
      tempCtx.arc(screenPos.x, screenPos.y, finalConfig.radius, 0, Math.PI * 2);
      tempCtx.fill();
    });

    // Apply blur effect
    if (finalConfig.blur > 0) {
      tempCtx.filter = `blur(${finalConfig.blur}px)`;
      tempCtx.drawImage(tempCanvas, 0, 0);
    }

    // Draw the heatmap to main canvas
    ctx.globalAlpha = 1;
    ctx.drawImage(tempCanvas, 0, 0);
  }, [processedHeatmapData, finalConfig, latLngToScreen]);

  const latLngToScreen = useCallback((lat: number, lng: number, width: number, height: number) => {
    // Simple projection - in a real app, you'd use proper map projection
    const scale = Math.pow(2, zoom);
    const x = ((lng - center.lng) * scale + 0.5) * width;
    const y = ((center.lat - lat) * scale + 0.5) * height;

    if (x < 0 || x > width || y < 0 || y > height) return null;

    return { x, y };
  }, [center.lat, center.lng, zoom]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointClick || !processedHeatmapData.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find closest point
    let closestPoint: HeatmapPoint | null = null;
    let minDistance = Infinity;

    processedHeatmapData.forEach(point => {
      const screenPos = latLngToScreen(point.lat, point.lng, canvas.offsetWidth, canvas.offsetHeight);
      if (!screenPos) return;

      const distance = Math.sqrt(Math.pow(x - screenPos.x, 2) + Math.pow(y - screenPos.y, 2));
      if (distance < minDistance && distance < finalConfig.radius) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint) {
      const issue = issues.find(i => i.id === closestPoint!.issueId);
      if (issue) {
        onPointClick(issue);
      }
    }
  };

  // Get heatmap statistics
  const heatmapStats = useMemo(() => {
    if (!processedHeatmapData.length) return null;

    const totalPoints = processedHeatmapData.length;
    const avgIntensity = processedHeatmapData.reduce((sum, point) => sum + point.intensity, 0) / totalPoints;
    const maxIntensity = Math.max(...processedHeatmapData.map(point => point.intensity));
    
    const categoryCounts = processedHeatmapData.reduce((acc, point) => {
      acc[point.category] = (acc[point.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusCounts = processedHeatmapData.reduce((acc, point) => {
      acc[point.status] = (acc[point.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPoints,
      avgIntensity,
      maxIntensity,
      categoryCounts,
      statusCounts
    };
  }, [processedHeatmapData]);

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        style={{ 
          opacity: finalConfig.opacity,
          pointerEvents: 'auto'
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="flex items-center gap-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Generating heatmap...</span>
          </div>
        </div>
      )}

      {heatmapStats && (
        <div className="absolute top-2 right-2 bg-black/80 text-white p-3 rounded-lg text-xs space-y-1">
          <div className="font-semibold">Heatmap Stats</div>
          <div>Points: {heatmapStats.totalPoints}</div>
          <div>Avg Intensity: {(heatmapStats.avgIntensity * 100).toFixed(1)}%</div>
          <div>Max Intensity: {(heatmapStats.maxIntensity * 100).toFixed(1)}%</div>
          
          {finalConfig.showCategories && (
            <div className="mt-2">
              <div className="font-semibold">Categories:</div>
              {Object.entries(heatmapStats.categoryCounts).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span>{category}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}

          {finalConfig.showStatus && (
            <div className="mt-2">
              <div className="font-semibold">Status:</div>
              {Object.entries(heatmapStats.statusCounts).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span>{status}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-black/80 text-white p-3 rounded-lg text-xs">
        <div className="font-semibold mb-2">Intensity Legend</div>
        <div className="space-y-1">
          {Object.entries(finalConfig.gradient).map(([intensity, color]) => (
            <div key={intensity} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span>{Math.round(parseFloat(intensity) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
