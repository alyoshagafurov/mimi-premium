'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type Point = { date: string; romi: number; revenue: number };

export function RomiChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'dd MMM', { locale: ru }),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#A0A0A0', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#A0A0A0', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(19,19,19,0.95)',
              border: '1px solid rgba(201,169,110,0.3)',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              fontSize: 12,
            }}
            labelStyle={{ color: '#C9A96E', fontWeight: 600 }}
            formatter={(v: number) => [`${v}%`, 'ROMI']}
          />
          <Area
            type="monotone"
            dataKey="romi"
            stroke="#C9A96E"
            strokeWidth={2.5}
            fill="url(#goldFill)"
            dot={{ r: 3, fill: '#C9A96E', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#D8BE85', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
