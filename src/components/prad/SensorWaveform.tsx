import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sensorDataService } from '@/services/SensorDataService';
import { cn } from '@/lib/utils';

// ============================================================================
// SensorWaveform — Real-time canvas accelerometer graph
//
// Subscribes directly to SensorDataService (no React re-renders per reading).
// Draws a scrolling line showing G-force over time.
// Colour zones: green (<0.6g), yellow (0.6–1g), orange (1–1.5g), red (>1.5g).
// ============================================================================

interface BumpMarker {
  sampleIndex: number;   // which sample index the bump was at
  type: string;
  severity: string;
}

interface SensorWaveformProps {
  isDetecting: boolean;
  anomalyCount: number;
  lastAnomalyType?: string;
  lastAnomalySeverity?: string;
  className?: string;
  height?: number;
}

const HISTORY_LEN = 200;  // samples to keep for drawing
const G = 9.81;

// Zone thresholds in g-force
const GREEN_MAX  = 0.6;
const YELLOW_MAX = 1.0;
const ORANGE_MAX = 1.5;

function gForceColor(g: number): string {
  if (g > ORANGE_MAX) return '#ef4444';   // red
  if (g > YELLOW_MAX) return '#f97316';   // orange
  if (g > GREEN_MAX)  return '#eab308';   // yellow
  return '#22c55e';                        // green
}

export const SensorWaveform: React.FC<SensorWaveformProps> = ({
  isDetecting,
  anomalyCount,
  lastAnomalyType,
  lastAnomalySeverity,
  className,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // Circular buffers (plain arrays, not React state — no re-renders per sample)
  const samplesRef      = useRef<number[]>(Array(HISTORY_LEN).fill(0));
  const currentGRef     = useRef(0);
  const bumpMarkersRef  = useRef<BumpMarker[]>([]);
  const sampleCountRef  = useRef(0);
  const prevCountRef    = useRef(0);

  // Current g-force for the overlay text (single state update)
  const [displayG, setDisplayG] = useState(0);
  const displayUpdateRef = useRef(0);

  // Handle new sensor reading
  const onReading = useCallback((reading: { magnitude: number }) => {
    const g = reading.magnitude / G;
    currentGRef.current = g;

    // Push into circular buffer
    samplesRef.current.push(g);
    if (samplesRef.current.length > HISTORY_LEN) {
      samplesRef.current.shift();
    }
    sampleCountRef.current++;

    // Update displayed g-force at most 10 fps to avoid React churn
    const now = performance.now();
    if (now - displayUpdateRef.current > 100) {
      displayUpdateRef.current = now;
      setDisplayG(parseFloat(g.toFixed(2)));
    }
  }, []);

  // Attach / detach sensor listener when detecting changes
  useEffect(() => {
    if (!isDetecting) return;
    const unsub = sensorDataService.onReading(onReading);
    return unsub;
  }, [isDetecting, onReading]);

  // Track new bump markers
  useEffect(() => {
    if (anomalyCount > prevCountRef.current) {
      bumpMarkersRef.current.push({
        sampleIndex: sampleCountRef.current,
        type: lastAnomalyType ?? 'unknown',
        severity: lastAnomalySeverity ?? 'medium',
      });
      // Keep only last 20 markers
      if (bumpMarkersRef.current.length > 20) {
        bumpMarkersRef.current.shift();
      }
    }
    prevCountRef.current = anomalyCount;
  }, [anomalyCount, lastAnomalyType, lastAnomalySeverity]);

  // Canvas drawing loop (requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const samples = samplesRef.current;
      const n = samples.length;

      // ── Background ──────────────────────────────────────────────────────
      ctx.fillStyle = '#0f172a';  // slate-900
      ctx.fillRect(0, 0, W, H);

      // ── Horizontal zone bands ────────────────────────────────────────────
      const maxG = 2.5;

      const yForG = (g: number) => H - (g / maxG) * H;

      // Zone fills
      const zones = [
        { lo: 0,          hi: GREEN_MAX,  fill: 'rgba(34,197,94,0.07)' },
        { lo: GREEN_MAX,  hi: YELLOW_MAX, fill: 'rgba(234,179,8,0.07)' },
        { lo: YELLOW_MAX, hi: ORANGE_MAX, fill: 'rgba(249,115,22,0.09)' },
        { lo: ORANGE_MAX, hi: maxG,       fill: 'rgba(239,68,68,0.1)' },
      ];
      for (const z of zones) {
        ctx.fillStyle = z.fill;
        ctx.fillRect(0, yForG(z.hi), W, yForG(z.lo) - yForG(z.hi));
      }

      // ── Grid lines ───────────────────────────────────────────────────────
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 0.5;
      for (const g of [0.5, 1.0, 1.5, 2.0]) {
        const y = yForG(g);
        ctx.strokeStyle = g >= ORANGE_MAX ? 'rgba(239,68,68,0.25)' :
                          g >= YELLOW_MAX ? 'rgba(249,115,22,0.2)' :
                          g >= GREEN_MAX  ? 'rgba(234,179,8,0.2)'  :
                                            'rgba(100,116,139,0.2)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        // Label
        ctx.fillStyle = 'rgba(148,163,184,0.6)';
        ctx.font = '9px monospace';
        ctx.fillText(`${g}g`, 3, y - 2);
      }
      ctx.setLineDash([]);

      // ── Bump markers (vertical lines) ────────────────────────────────────
      const currentSample = sampleCountRef.current;
      for (const m of bumpMarkersRef.current) {
        const samplesAgo = currentSample - m.sampleIndex;
        if (samplesAgo > HISTORY_LEN) continue;
        const x = W - (samplesAgo / HISTORY_LEN) * W;
        const color = m.severity === 'critical' ? '#ef4444' :
                      m.severity === 'high'     ? '#f97316' :
                      m.severity === 'medium'   ? '#eab308' : '#22c55e';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
        ctx.setLineDash([]);
        // Small label
        ctx.fillStyle = color;
        ctx.font = 'bold 9px sans-serif';
        const label = m.type === 'pothole' ? '🕳' :
                      m.type === 'speed_breaker' ? '🚧' :
                      m.type === 'rough_road' ? '〰' : '⚠';
        ctx.fillText(label, Math.max(2, x - 6), 14);
      }

      // ── Waveform line ────────────────────────────────────────────────────
      if (n < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw line segments color-coded by magnitude
      const stepX = W / (HISTORY_LEN - 1);
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      for (let i = 1; i < n; i++) {
        const x0 = (i - 1) * stepX + (W - (n - 1) * stepX);
        const x1 = i * stepX + (W - (n - 1) * stepX);
        const y0 = yForG(Math.min(maxG, samples[i - 1]));
        const y1 = yForG(Math.min(maxG, samples[i]));

        const grad = ctx.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, gForceColor(samples[i - 1]));
        grad.addColorStop(1, gForceColor(samples[i]));

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // ── Glow on latest point ─────────────────────────────────────────────
      if (n > 0) {
        const lastX = W;
        const lastY = yForG(Math.min(maxG, samples[n - 1]));
        const gVal = samples[n - 1];
        const color = gForceColor(gVal);

        // Outer glow
        const glow = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 8);
        glow.addColorStop(0, color.replace(')', ', 0.6)').replace('rgb', 'rgba'));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Center dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);  // draw loop never restarts — refs do the work

  // Resize canvas to match CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width  = Math.round(width  * devicePixelRatio);
        canvas.height = Math.round(height * devicePixelRatio);
        canvas.getContext('2d')?.scale(devicePixelRatio, devicePixelRatio);
        // Reset CSS for HiDPI
        canvas.style.width  = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const gColor = gForceColor(displayG);
  const isShaking = displayG > GREEN_MAX;

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-slate-900', className)}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
      />

      {/* Overlay: current g-force and status */}
      <div className="absolute top-2 right-3 text-right pointer-events-none">
        <div
          className="text-2xl font-mono font-black leading-none transition-colors duration-150"
          style={{ color: gColor, textShadow: `0 0 12px ${gColor}80` }}
        >
          {displayG.toFixed(2)}
          <span className="text-xs font-semibold ml-1 opacity-70">g</span>
        </div>
        {isShaking && (
          <div className="text-[9px] font-bold mt-0.5 animate-pulse" style={{ color: gColor }}>
            VIBRATION
          </div>
        )}
      </div>

      {/* Status pill top-left */}
      <div className="absolute top-2 left-3 pointer-events-none">
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
          isDetecting
            ? 'bg-green-500/20 text-green-400'
            : 'bg-slate-600/40 text-slate-400'
        )}>
          <div className={cn(
            'h-1.5 w-1.5 rounded-full',
            isDetecting ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
          )} />
          {isDetecting ? 'LIVE' : 'PAUSED'}
        </div>
      </div>

      {/* Idle hint */}
      {!isDetecting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-500 text-xs font-medium">
            Start a trip to see your accelerometer live
          </p>
        </div>
      )}

      {/* Bump flash overlay */}
      {anomalyCount > 0 && (
        <div
          key={anomalyCount}
          className="absolute inset-0 pointer-events-none animate-ping opacity-0"
          style={{
            background: lastAnomalySeverity === 'critical' ? 'rgba(239,68,68,0.15)' :
                        lastAnomalySeverity === 'high' ? 'rgba(249,115,22,0.12)' :
                        'rgba(234,179,8,0.1)',
            animationDuration: '0.4s',
            animationIterationCount: '1',
          }}
        />
      )}
    </div>
  );
};
