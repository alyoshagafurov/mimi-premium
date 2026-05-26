'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated count-up that starts when the element enters the viewport.
 * - `value`: target number
 * - `suffix`: e.g. "+", "×", "%"
 * - `decimals`: number of decimal places
 * - `duration`: ms for the count animation
 */
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const ease = (t: number) => 1 - Math.pow(1 - t, 3);
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              setDisplay(value * ease(t));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatted = decimals
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString('ru-RU');

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
