import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface RoadHealthIndexProps {
  score: number; // 0-100
  trend?: 'improving' | 'declining' | 'stable';
  totalDetections?: number;
  activeHotspots?: number;
  className?: string;
}

export const RoadHealthIndex: React.FC<RoadHealthIndexProps> = ({
  score,
  trend = 'stable',
  totalDetections = 0,
  activeHotspots = 0,
  className,
}) => {
  // Colour gradient: red → orange → yellow → green
  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', label: 'Excellent' };
    if (s >= 60) return { stroke: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700', label: 'Good' };
    if (s >= 40) return { stroke: '#eab308', bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Fair' };
    if (s >= 20) return { stroke: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Poor' };
    return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', label: 'Critical' };
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 54; // radius = 54
  const offset = circumference - (score / 100) * circumference;

  const trendIcon = trend === 'improving'
    ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
    : trend === 'declining'
      ? <TrendingDown className="h-3.5 w-3.5 text-red-500" />
      : <Minus className="h-3.5 w-3.5 text-gray-400" />;

  const trendLabel = trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Road Health Index
          </span>
          <Badge variant="secondary" className={cn('text-xs gap-1', colors.bg, colors.text)}>
            {trendIcon}
            {trendLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Circular gauge */}
          <div className="relative flex-shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Score arc */}
              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke={colors.stroke}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 64 64)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Centre text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold', colors.text)}>{Math.round(score)}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{colors.label}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Activity className="h-4 w-4 text-blue-500" />
                Detections
              </div>
              <span className="text-sm font-bold">{totalDetections.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Active Hotspots
              </div>
              <span className="text-sm font-bold">{activeHotspots}</span>
            </div>

            {/* Quality bar */}
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Critical</span>
                <span>Excellent</span>
              </div>
              <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow transition-all duration-1000"
                  style={{
                    left: `${score}%`,
                    borderColor: colors.stroke,
                    transform: `translateX(-50%) translateY(-50%)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
