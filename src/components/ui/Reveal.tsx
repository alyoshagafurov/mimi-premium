'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Soft fade + lift reveal that fires once when the element enters the viewport.
 * Designed for premium pacing — slow, deliberate.
 */
export function Reveal({
  delay = 0,
  y = 36,
  duration = 0.9,
  once = true,
  className,
  children,
  ...rest
}: HTMLMotionProps<'div'> & { delay?: number; y?: number; duration?: number; once?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
