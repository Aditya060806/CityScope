import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Navigation,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  MapPin,
  BatteryMedium,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PRADPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
}

type PermissionStep = 'intro' | 'motion' | 'location' | 'done';

export const PRADPermissionDialog: React.FC<PRADPermissionDialogProps> = ({
  open,
  onOpenChange,
  onPermissionGranted,
  onPermissionDenied,
  requestPermission,
  isSupported,
}) => {
  const [step, setStep] = useState<PermissionStep>('intro');
  const [motionGranted, setMotionGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestMotion = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const granted = await requestPermission();
      setMotionGranted(granted);
      if (granted) {
        setStep('location');
      } else {
        setError('Motion sensor access was denied. Please enable it in your device settings.');
      }
    } catch (err) {
      setError('Failed to request motion permission. Your browser may not support this feature.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestLocation = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const result = await new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
      setLocationGranted(result);
      if (result) {
        setStep('done');
        onPermissionGranted();
      } else {
        setError('Location access was denied. Road anomaly detection needs your location to map potholes.');
      }
    } catch {
      setError('Failed to request location permission.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    onPermissionDenied();
    onOpenChange(false);
  };

  const privacyPoints = [
    { icon: Eye, text: 'Only motion intensity and GPS coordinates are captured' },
    { icon: EyeOff, text: 'No audio, camera, or personal data is collected' },
    { icon: BatteryMedium, text: 'Adapts to battery level to minimise drain' },
    { icon: Shield, text: 'All data is anonymised and aggregated for road safety' },
  ];

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Device Not Supported
            </DialogTitle>
            <DialogDescription>
              Your device or browser does not support motion sensors. Road anomaly detection
              requires a device with an accelerometer (typically a smartphone).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-black tracking-tighter text-slate-900">
                <Activity className="h-6 w-6 text-indigo-600" />
                Road Anomaly Detection
              </DialogTitle>
              <DialogDescription className="text-left text-[14px] font-medium text-slate-500">
                CityScope can passively detect potholes, speed breakers, and rough roads
                using your phone's motion sensors while you travel.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <h4 className="text-[12px] font-black tracking-widest uppercase text-slate-400">How it works</h4>
              <div className="grid gap-4">
                {[
                  { icon: Smartphone, title: 'Sensors detect bumps', desc: 'Accelerometer captures road surface quality' },
                  { icon: MapPin, title: 'GPS maps anomalies', desc: 'Each detection is pinned to exact coordinates' },
                  { icon: Activity, title: 'AI classifies type', desc: 'Pothole, speed breaker, or rough patch identified' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <div className="rounded-[1rem] p-3 bg-indigo-50 border border-indigo-100 shadow-sm">
                      <item.icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="mt-0.5">
                      <p className="text-[15px] font-black tracking-tight text-slate-900">{item.title}</p>
                      <p className="text-[13px] font-medium text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-[12px] font-black tracking-widest uppercase text-slate-400">Privacy & Battery</h4>
              <div className="grid grid-cols-2 gap-3">
                {privacyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[12px] font-bold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.02)]">
                    <point.icon className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span className="leading-tight">{point.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-row gap-3 sm:justify-between">
              <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-900 rounded-xl" onClick={handleDeny}>
                Not Now
              </Button>
              <Button onClick={() => setStep('motion')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest uppercase text-[12px] px-6 rounded-xl shadow-[0_4px_15px_rgb(79,70,229,0.3)] transition-all">
                Enable Detection
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'motion' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-black tracking-tighter text-slate-900">
                <Smartphone className="h-6 w-6 text-indigo-600" />
                Motion Sensor Access
              </DialogTitle>
              <DialogDescription className="text-[14px] font-medium text-slate-500">
                We need access to your device's accelerometer to detect road bumps and anomalies.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-12">
              <div className={cn(
                'rounded-full p-8 transition-all duration-300 shadow-inner',
                motionGranted ? 'bg-emerald-50 border border-emerald-100 shadow-[0_0_30px_rgb(16,185,129,0.2)]' : 'bg-indigo-50 border border-indigo-100 animate-pulse'
              )}>
                {motionGranted ? (
                  <CheckCircle className="h-16 w-16 text-emerald-500 drop-shadow-md" />
                ) : (
                  <Smartphone className="h-16 w-16 text-indigo-500 drop-shadow-md" />
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter className="flex-row gap-3 sm:justify-between">
              <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-900 rounded-xl" onClick={handleDeny}>Cancel</Button>
              <Button
                onClick={handleRequestMotion}
                disabled={isRequesting || motionGranted}
                className={cn("bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest uppercase text-[12px] px-6 rounded-xl transition-all shadow-sm", motionGranted ? "bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_15px_rgb(16,185,129,0.3)]" : "shadow-[0_4px_15px_rgb(79,70,229,0.3)]")}
              >
                {isRequesting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Requesting...</>
                ) : motionGranted ? (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Granted</>
                ) : (
                  'Allow Access'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'location' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-black tracking-tighter text-slate-900">
                <Navigation className="h-6 w-6 text-indigo-600" />
                Location Access
              </DialogTitle>
              <DialogDescription className="text-[14px] font-medium text-slate-500">
                We need your location to map detected anomalies to specific road coordinates.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-5">
                <div className="rounded-full p-4 bg-emerald-50 border border-emerald-100 shadow-sm">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="h-0.5 w-12 bg-slate-200 rounded-full" />
                <div className={cn(
                  'rounded-full p-4 transition-all duration-300 shadow-inner',
                  locationGranted ? 'bg-emerald-50 border border-emerald-100 shadow-[0_0_30px_rgb(16,185,129,0.2)]' : 'bg-indigo-50 border border-indigo-100 animate-pulse'
                )}>
                  {locationGranted ? (
                    <CheckCircle className="h-10 w-10 text-emerald-500 drop-shadow-md" />
                  ) : (
                    <Navigation className="h-10 w-10 text-indigo-500 drop-shadow-md" />
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter className="flex-row gap-3 sm:justify-between">
              <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-900 rounded-xl" onClick={handleDeny}>Cancel</Button>
              <Button
                onClick={handleRequestLocation}
                disabled={isRequesting || locationGranted}
                className={cn("bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest uppercase text-[12px] px-6 rounded-xl transition-all shadow-sm", locationGranted ? "bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_15px_rgb(16,185,129,0.3)]" : "shadow-[0_4px_15px_rgb(79,70,229,0.3)]")}
              >
                {isRequesting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Requesting...</>
                ) : locationGranted ? (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Granted</>
                ) : (
                  'Allow Access'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                All Set!
              </DialogTitle>
              <DialogDescription>
                Road anomaly detection is ready. Start a trip to begin detecting potholes and bumps.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
                  <Smartphone className="h-3 w-3" /> Motion
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
                  <Navigation className="h-3 w-3" /> Location
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start Detecting
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
