'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = HTMLMotionProps<'div'> & {
  gold?: boolean;
  hover?: boolean;
  delay?: number;
};

export function GlassCard({
  className,
  gold = false,
  hover = false,
  delay = 0,
  children,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        hover
          ? { y: -4, transition: { duration: 0.25 } }
          : undefined
      }
      className={cn(
        gold ? 'glass-gold' : 'glass',
        'p-6 transition-shadow',
        hover && 'cursor-pointer hover:shadow-gold-lg',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
