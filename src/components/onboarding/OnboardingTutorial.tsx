import React, { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Home, Map, Plus, Gift, ArrowRight, ChevronLeft, ChevronRight,
  X, Rocket, MapPin, Trophy, Sparkles
} from 'lucide-react';
import { useTutorial } from '@/hooks/useTutorial';
import { cn } from '@/lib/utils';

// ─── Slide Definitions ──────────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: React.ElementType;
  primaryColor: string; // Used for icon background and highlights
  bgGradient: string; // Soft background gradient for the right side
  title: string;
  subtitle: string;
  description: string;
  highlight?: string;
  visual: React.ReactNode;
}

const CityScopeVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center">
    {/* Pulsing rings - Hardware accelerated scaling */}
    {[0, 1].map((i) => (
      <motion.div
        key={i}
        className="absolute h-[300px] w-[300px] rounded-full border border-indigo-200/50"
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 0 }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeOut",
          delay: i * 1.5 
        }}
      />
    ))}
    <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white bg-white shadow-xl">
      <img src="/CityScope.png" alt="CityScope" className="h-16 w-16 object-contain" />
    </div>
  </div>
);

const DashboardVisual = () => (
  <div className="flex h-full w-full items-center justify-center p-6">
    <div className="w-full max-w-xs space-y-4">
      {/* Metric cards */}
      {[
        { label: 'Issues Reported', value: '1,240', color: 'bg-indigo-500', pct: 72 },
        { label: 'Resolved Today', value: '89', color: 'bg-emerald-500', pct: 55 },
        { label: 'Civic Score', value: '94 pts', color: 'bg-amber-500', pct: 88 },
      ].map(({ label, value, color, pct }, i) => (
        <motion.div 
          key={label} 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex justify-between items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
            <span className="text-lg font-black text-slate-800 leading-none">{value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 transform-gpu">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: `${pct - 100}%` }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
              className={`h-full w-full rounded-full ${color}`} 
            />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const MapVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
    {/* Clean map background pattern */}
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
    
    {/* Pin cluster */}
    <div className="relative z-10 flex gap-5">
      {[
        { color: 'bg-red-500', delay: 0, y: -10 },
        { color: 'bg-amber-500', delay: 0.1, y: 10 },
        { color: 'bg-emerald-500', delay: 0.2, y: -5 },
      ].map(({ color, delay, y }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5, y: y + 20 }}
          animate={{ opacity: 1, scale: 1, y }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
          className={`${color} flex h-14 w-14 items-center justify-center rounded-full shadow-lg`}
        >
          <MapPin className="h-6 w-6 text-white" />
        </motion.div>
      ))}
    </div>
  </div>
);

const ReportVisual = () => (
  <div className="flex h-full w-full items-center justify-center p-6">
    <div className="w-full max-w-xs space-y-3">
      {/* Fake form */}
      {[
        { text: 'Pothole on Main St', delay: 0 },
        { text: 'Category: Road Hazard', delay: 0.1 },
      ].map((item, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: item.delay, type: 'spring', stiffness: 300, damping: 25 }}
          className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm"
        >
          {item.text}
        </motion.div>
      ))}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center gap-2.5 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-md transform-gpu"
      >
        <Sparkles className="h-4 w-4 animate-spin-slow" />
        AI is analysing image...
      </motion.div>
    </div>
  </div>
);

const RewardsVisual = () => (
  <div className="flex h-full w-full items-center justify-center p-6">
    <div className="flex flex-col items-center gap-6">
      <motion.div 
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
        className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg ring-8 ring-white/50"
      >
        <Trophy className="h-12 w-12 text-white" />
      </motion.div>
      <div className="text-center space-y-1">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-[40px] leading-none font-black text-slate-800 tracking-tight"
        >
          1,240
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-xs font-bold text-amber-600 uppercase tracking-widest"
        >
          Civic Tokens
        </motion.div>
      </div>
      <div className="flex gap-2">
        {['🏅 Reporter', '🔥 Streak:7', '⭐ Top 5%'].map((badge, i) => (
          <motion.div 
            key={badge} 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + (i * 0.1), type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-full border border-slate-100 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
          >
            {badge}
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const DoneVisual = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-6">
    <div className="relative">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2.5 w-2.5 rounded-full bg-emerald-400 origin-center"
          initial={{ scale: 0, opacity: 0, rotate: i * 60, y: -40 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], y: -80 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "easeOut" }}
          style={{ top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${i * 60}deg)` }}
        />
      ))}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
        className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg ring-8 ring-white/50 relative z-10"
      >
        <Rocket className="h-12 w-12 text-white" />
      </motion.div>
    </div>
    <motion.p 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center text-xl font-bold text-slate-800"
    >
      You're all set!
    </motion.p>
  </div>
);

const slides: Slide[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    primaryColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    bgGradient: 'bg-indigo-50/50',
    title: 'Welcome to CityScope',
    subtitle: 'Your Civic Engagement Command Center',
    description: 'You\'ve joined a movement of 10,000+ citizens using AI to make their cities measurably better. Let\'s get you oriented in under a minute.',
    highlight: '10,000+ Active Citizens',
    visual: <CityScopeVisual />,
  },
  {
    id: 'dashboard',
    icon: Home,
    primaryColor: 'text-blue-600 bg-blue-50 border-blue-100',
    bgGradient: 'bg-blue-50/50',
    title: 'Your Dashboard',
    subtitle: 'Live City Intelligence at a Glance',
    description: 'Your command center aggregates real-time metrics, AI-powered predictive insights, and your personal impact score into one beautiful dashboard.',
    highlight: 'Live AI Insights',
    visual: <DashboardVisual />,
  },
  {
    id: 'report',
    icon: Plus,
    primaryColor: 'text-rose-600 bg-rose-50 border-rose-100',
    bgGradient: 'bg-rose-50/50',
    title: 'Report Issues',
    subtitle: 'AI-Assisted Civic Reporting',
    description: 'Spot a problem? Snap a photo and let our AI handle the rest. It auto-categorizes, tags location, and immediately routes the issue to the correct authority.',
    highlight: 'AI Auto-Classification',
    visual: <ReportVisual />,
  },
  {
    id: 'map',
    icon: Map,
    primaryColor: 'text-teal-600 bg-teal-50 border-teal-100',
    bgGradient: 'bg-teal-50/50',
    title: 'Live City Map',
    subtitle: 'Hyperlocal Issue Visualization',
    description: 'Watch your city heal in real-time. See every reported issue, filter by category or proximity, and track civic swarms as they resolve problems.',
    highlight: 'Hyperlocal Tracking',
    visual: <MapVisual />,
  },
  {
    id: 'rewards',
    icon: Gift,
    primaryColor: 'text-amber-600 bg-amber-50 border-amber-100',
    bgGradient: 'bg-amber-50/50',
    title: 'Earn & Rise',
    subtitle: 'Get Recognized for Your Impact',
    description: 'Every verified report and civic engagement earns you Civic Tokens. Climb local leaderboards, unlock elite badges, and redeem tokens at partner businesses.',
    highlight: 'Web3 Token Economy',
    visual: <RewardsVisual />,
  },
  {
    id: 'done',
    icon: Rocket,
    primaryColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    bgGradient: 'bg-emerald-50/50',
    title: 'You\'re Ready!',
    subtitle: 'Welcome to the Civic Revolution',
    description: 'You\'ve got the tools. Start exploring the dashboard, report your first issue, and join a powerful community actively improving the world around them.',
    visual: <DoneVisual />,
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export const OnboardingTutorial: React.FC = () => {
  const { isActive, completeTutorial, skipTutorial } = useTutorial();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;
  const isFirst = currentSlide === 0;

  const goNext = useCallback(() => {
    if (isLast) { completeTutorial(); return; }
    setDirection('forward');
    setCurrentSlide((s) => s + 1);
  }, [isLast, completeTutorial]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    setDirection('backward');
    setCurrentSlide((s) => s - 1);
  }, [isFirst]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') skipTutorial();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, goNext, goPrev, skipTutorial]);

  if (!isActive) return null;

  // Ultra-fast slide spring physics
  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 30 : -30,
      opacity: 0,
    }),
    center: { 
      x: 0, 
      opacity: 1, 
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -30 : 30,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {/* Super light fast semi-transparent backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[9990] bg-slate-900/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'linear' }}
        onClick={skipTutorial}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4 sm:p-6 pb-12 sm:pb-12 pointer-events-none transform-gpu">
        <motion.div
          key="modal"
          className="relative w-full max-w-[840px] overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] pointer-events-auto flex flex-col sm:flex-row min-h-[500px]"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Skip Button */}
          <button
            onClick={skipTutorial}
            className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left: Text & Navigation */}
          <div className="flex flex-col justify-between p-8 sm:p-10 sm:w-[50%] z-10 bg-white">
            <div className="mt-4 transform-gpu">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={slide.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* Icon badge */}
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border", slide.primaryColor)}>
                    <slide.icon className="h-7 w-7" />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      Phase {String(currentSlide + 1).padStart(2, '0')}
                    </p>
                    <h2 className="text-[2rem] font-black leading-[1.1] tracking-tight text-slate-900">
                      {slide.title}
                    </h2>
                    <p className="text-[15px] font-bold text-slate-600 leading-snug">{slide.subtitle}</p>
                  </div>

                  <p className="text-[15px] leading-[1.6] text-slate-600/90 font-medium pb-2">
                    {slide.description}
                  </p>

                  {slide.highlight && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      {slide.highlight}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation & Progress */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              {/* Step indicator dots */}
              <div className="mb-6 flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > currentSlide ? 'forward' : 'backward'); setCurrentSlide(i); }}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300 ease-out',
                      i === currentSlide ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                {!isFirst && (
                  <Button
                    variant="outline"
                    onClick={goPrev}
                    className="h-12 w-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  onClick={goNext}
                  className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors text-sm shadow-none"
                >
                  {isLast ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Visual Area */}
          <div className={cn("relative hidden sm:flex sm:w-[50%] h-full items-center justify-center overflow-hidden transition-colors duration-300 transform-gpu", slide.bgGradient)}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`visual-${slide.id}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative z-10 h-full w-full"
              >
                {slide.visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
