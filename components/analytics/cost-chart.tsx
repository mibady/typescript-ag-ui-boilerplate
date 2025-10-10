'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Mock data generator
function generateCostData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      openai: (Math.random() * 5 + 2).toFixed(2),
      anthropic: (Math.random() * 4 + 1).toFixed(2),
      gemini: (Math.random() * 3 + 0.5).toFixed(2),
    });
  }

  return data;
}

export function CostChart() {
  const data = useMemo(() => generateCostData(), []);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="openai" fill="hsl(var(--chart-1))" name="OpenAI" />
        <Bar dataKey="anthropic" fill="hsl(var(--chart-2))" name="Anthropic" />
        <Bar dataKey="gemini" fill="hsl(var(--chart-3))" name="Gemini" />
      </BarChart>
    </ResponsiveContainer>
  );
}
