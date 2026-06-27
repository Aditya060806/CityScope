import { MutableRefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface RevealOptions {
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
}

export const useGsapReveal = (
  containerRef: MutableRefObject<HTMLElement | null>,
  {
    selector = '[data-reveal]',
    y = 16,
    stagger = 0.08,
    duration = 0.55,
    delay = 0,
  }: RevealOptions = {}
) => {
  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const saveData = typeof navigator !== 'undefined' && 'connection' in navigator
        ? (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
        : false;
      const lowCoreCount = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
        ? navigator.hardwareConcurrency <= 4
        : false;

      if (reduceMotion || saveData || lowCoreCount) return;

      const elements = gsap.utils.toArray<HTMLElement>(selector, container);
      if (!elements.length) return;

      // Skip elements already revealed by a previous mount to prevent repeated heavy tweens.
      const unrevealed = elements.filter((el) => !el.dataset.revealed);
      if (!unrevealed.length) return;

      unrevealed.forEach((el) => {
        el.dataset.revealed = 'true';
      });

      gsap.fromTo(
        unrevealed,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger,
          duration,
          delay,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          overwrite: 'auto',
        }
      );
    },
    { scope: containerRef }
  );
};
