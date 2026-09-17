/**
 * «Карта присутствия»: города, где работает mimi, по настоящим координатам.
 * Простая равнопромежуточная проекция с поправкой на широту (cos 39°), без
 * выдуманного контура границы — только сетка градусов, узлы и связи.
 */

type City = { key: string; lat: number; lng: number; label: 'start' | 'end' };

export const CITIES: City[] = [
  { key: 'dushanbe', lat: 38.5598, lng: 68.787, label: 'start' },
  { key: 'khujand', lat: 40.2826, lng: 69.622, label: 'start' },
  { key: 'istaravshan', lat: 39.9108, lng: 69.0064, label: 'end' },
  { key: 'tursunzoda', lat: 38.5108, lng: 68.2303, label: 'end' },
  { key: 'bokhtar', lat: 37.8364, lng: 68.7803, label: 'end' },
  { key: 'kulob', lat: 37.9146, lng: 69.7845, label: 'start' },
];

const B = { west: 67.0, east: 70.6, north: 40.75, south: 37.45 };
const W = 640;
const K = Math.cos((39 * Math.PI) / 180);
const S = W / ((B.east - B.west) * K);
const H = Math.round((B.north - B.south) * S);
const px = (lng: number) => (lng - B.west) * K * S;
const py = (lat: number) => (B.north - lat) * S;
const deg = (v: number) => `${v.toFixed(2)}°`;
/** Пропорции схемы — контейнер повторяет их, чтобы ничего не обрезалось. */
export const MAP_RATIO = `${W} / ${H}`;

export function PresenceMap({ names, base, title }: { names: Record<string, string>; base: string; title: string }) {
  const hub = CITIES[0];
  const hx = px(hub.lng);
  const hy = py(hub.lat);
  const lngLines = [68, 69, 70];
  const latLines = [38, 39, 40];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
      className="block h-full w-full"
    >
      <style>{`
        .pm-ping { transform-box: fill-box; transform-origin: center; animation: pm-ping 2.6s cubic-bezier(0.16,1,0.3,1) infinite; }
        .pm-signal { animation: pm-signal 3.4s linear infinite; }
        @keyframes pm-ping { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(3.6); opacity: 0 } }
        @keyframes pm-signal { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
        @media (prefers-reduced-motion: reduce) { .pm-ping, .pm-signal { animation: none; opacity: 0 } }
        @media (max-width: 639px) { .pm-city { font-size: 27px } .pm-hub { font-size: 36px } .pm-base { font-size: 26px } .pm-coord, .pm-axis { display: none } }
      `}</style>

      {/* сетка градусов */}
      <g className="text-light" stroke="currentColor">
        {lngLines.map((l) => (
          <line key={`x${l}`} x1={px(l)} x2={px(l)} y1={0} y2={H} strokeOpacity={0.07} />
        ))}
        {latLines.map((l) => (
          <line key={`y${l}`} x1={0} x2={W} y1={py(l)} y2={py(l)} strokeOpacity={0.07} />
        ))}
        {lngLines.flatMap((a) =>
          latLines.map((b) => <path key={`c${a}${b}`} d={`M${px(a) - 4} ${py(b)}h8M${px(a)} ${py(b) - 4}v8`} strokeOpacity={0.22} />),
        )}
      </g>
      <g className="pm-axis fill-light/40 font-mono" fontSize={10} letterSpacing={0.5}>
        {lngLines.map((l) => (
          <text key={`tx${l}`} x={px(l) + 5} y={H - 10}>{l}°E</text>
        ))}
        {latLines.map((l) => (
          <text key={`ty${l}`} x={8} y={py(l) - 6}>{l}°N</text>
        ))}
      </g>

      {/* связи из Душанбе */}
      {CITIES.slice(1).map((c, i) => {
        const d = `M${hx} ${hy}L${px(c.lng)} ${py(c.lat)}`;
        return (
          <g key={`l${c.key}`}>
            <path d={d} className="text-brand-purpleSoft" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1} />
            <path
              d={d}
              pathLength={100}
              className="pm-signal text-brand-lime"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="5 95"
              style={{ animationDelay: `${i * 0.55}s` }}
            />
          </g>
        );
      })}

      {/* города */}
      {CITIES.slice(1).map((c) => {
        const x = px(c.lng);
        const y = py(c.lat);
        const dx = c.label === 'start' ? 14 : -14;
        return (
          <g key={c.key}>
            <circle cx={x} cy={y} r={5} className="fill-ink stroke-brand-purpleSoft" strokeWidth={2} />
            <text x={x + dx} y={y + 1} textAnchor={c.label} className="pm-city fill-light font-display" fontSize={17} fontWeight={700}>
              {names[c.key]}
            </text>
            <text x={x + dx} y={y + 17} textAnchor={c.label} className="pm-coord fill-light/50 font-mono" fontSize={9.5}>
              {deg(c.lat)}N {deg(c.lng)}E
            </text>
          </g>
        );
      })}

      {/* Душанбе */}
      <circle cx={hx} cy={hy} r={8} className="pm-ping fill-brand-lime" />
      <circle cx={hx} cy={hy} r={8} className="fill-brand-lime" />
      <circle cx={hx} cy={hy} r={3} className="fill-ink" />
      <text x={hx + 18} y={hy - 4} className="pm-hub fill-current font-display text-brand-lime" fontSize={26} fontWeight={800}>
        {names.dushanbe}
      </text>
      <text x={hx + 18} y={hy + 22} className="pm-base fill-light/70 font-serif" fontSize={18} fontStyle="italic">
        {base}
      </text>
    </svg>
  );
}
