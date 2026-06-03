"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface VolumeDataPoint {
  day: string;
  sets: number;
}

interface WeeklyVolumeChartProps {
  data: VolumeDataPoint[];
}

export default function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  const maxSets = Math.max(...data.map((d) => d.sets), 1);

  if (data.every((d) => d.sets === 0)) {
    return (
      <div className="flex items-center justify-center text-content-muted text-sm h-[180px]">
        No sets logged in the last 7 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#C8B99D"
          vertical={false}
          opacity={0.4}
        />
        <XAxis
          dataKey="day"
          tick={{ fill: "#988A78", fontSize: 11 }}
          axisLine={{ stroke: "#C8B99D" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, Math.ceil(maxSets * 1.2)]}
          tick={{ fill: "#988A78", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            background: "#E8DECE",
            border: "1px solid #C8B99D",
            borderRadius: 8,
            color: "#2C1A10",
            fontSize: 13,
          }}
          cursor={{ fill: "#DDD2BF", opacity: 0.5 }}
          formatter={(value: any) => [`${value} sets`, "Volume"]}
        />
        <Bar
          dataKey="sets"
          fill="#C84B1A"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
