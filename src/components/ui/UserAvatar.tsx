import { cn } from '@/lib/utils';

/** Deterministic colour from a name so letter-avatars stay recognisable. */
function hueFromName(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

/**
 * Profile photo. Shows the uploaded image when present, otherwise a coloured
 * circle with the first letter of the user's name (the default).
 */
export function UserAvatar({
  name,
  avatar,
  size = 40,
  className,
}: {
  name: string;
  avatar?: string | null;
  size?: number;
  className?: string;
}) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full font-bold text-[#0A0712]', className)}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hueFromName(name || '?')} 70% 70%)` }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}
