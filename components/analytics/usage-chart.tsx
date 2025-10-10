'use client';

import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Mock data generator
function generateUsageData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      chats: Math.floor(Math.random() * 100) + 20,
      tokens: Math.floor(Math.random() * 50000) + 10000,
    });
  }

  return data;
}

export function UsageChart() {
  const data = useMemo(() => generateUsageData(), []);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          yAxisId="left"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="chats"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          name="Chat Sessions"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="tokens"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          name="Tokens Used"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
