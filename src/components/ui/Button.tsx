'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'gold' | 'ghost';

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = CommonProps & { href: string };

function classes(variant: Variant, className?: string) {
  return cn(variant === 'gold' ? 'btn-gold' : 'btn-ghost', className);
}

export function Button({ variant = 'gold', className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes(variant, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ variant = 'gold', className, children, href }: LinkProps) {
  return (
    <Link href={href} className={classes(variant, className)}>
      {children}
    </Link>
  );
}
