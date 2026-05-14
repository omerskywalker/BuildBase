"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  weight: number;
  sessionName: string;
}

interface LiftChartProps {
  data: ChartDataPoint[];
  exerciseName: string;
  height?: number;
}

export default function LiftChart({ data, exerciseName, height = 300 }: LiftChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-content-muted text-sm"
        style={{ height: height }}
      >
        No data recorded yet for {exerciseName}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#C8B99D" 
          vertical={false} 
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#988A78", fontSize: 11 }}
          axisLine={{ stroke: "#C8B99D" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#988A78", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "#E8DECE",
            border: "1px solid #C8B99D",
            borderRadius: 8,
            color: "#2C1A10",
            fontSize: 13,
          }}
          cursor={{ stroke: "#B5A68C", strokeDasharray: "4 4" }}
          formatter={(value: any, _name: any) => [`${value} lbs`, 'Weight']}
          labelFormatter={(label: any, payload: any) => {
            if (payload && payload[0] && payload[0].payload) {
              return `${payload[0].payload.sessionName} - ${label}`;
            }
            return String(label);
          }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#C84B1A"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: "#C84B1A", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}