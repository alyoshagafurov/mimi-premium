'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatInt } from '@/lib/utils';

type Point = { label: string; reach: number };

/** Thin lime line chart of audience reach over the reporting periods. */
export function ReachChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8A7FA8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8A7FA8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(v)}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(10,7,18,0.95)',
              border: '1px solid rgba(212,236,76,0.3)',
              borderRadius: 12,
              boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7)',
              fontSize: 12,
            }}
            labelStyle={{ color: '#D4EC4C', fontWeight: 600 }}
            formatter={(v: number) => [formatInt(v), 'Охват']}
          />
          <Line
            type="monotone"
            dataKey="reach"
            stroke="#D4EC4C"
            strokeWidth={1.75}
            dot={{ r: 3, fill: '#D4EC4C', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#E4F47A', stroke: '#0A0712', strokeWidth: 2 }}
            animationDuration={1100}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
