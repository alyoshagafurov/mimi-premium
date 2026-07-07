'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'lime' | 'purple' | 'ghost';

/**
 * Magnetic CTA — the button leans toward the cursor on hover.
 * Use sparingly (1-2 per viewport) for premium feel.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = 'lime',
  strength = 0.35,
  className,
  arrow = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  strength?: number;
  className?: string;
  arrow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.6 });
  // Slight magnetic offset on the arrow so it stretches outward
  const arrowX = useTransform(sx, (v) => v * 0.6);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const cls = cn(
    variant === 'lime' && 'btn-lime',
    variant === 'purple' && 'btn-purple',
    variant === 'ghost' && 'btn-ghost',
    'will-change-transform',
    className,
  );

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cls}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      {arrow && (
        <motion.span style={{ x: arrowX }} className="relative z-10 text-base">→</motion.span>
      )}
    </motion.div>
  );

  if (href) {
    // External links (WhatsApp, Instagram, …) open in a new tab.
    if (/^https?:\/\//.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer noopener" className="inline-block">
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className="inline-block">
        {inner}
      </Link>
    );
  }
  return inner;
}
