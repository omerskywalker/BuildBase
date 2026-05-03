"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { EFFORT_LABELS, SORENESS_LABELS } from "@/lib/constants";

export interface TrendDataPoint {
  session: string;
  date: string;
  effort?: number;
  soreness?: number;
  week: number;
  sessionNumber: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  type: "effort" | "soreness" | "both";
  className?: string;
}

export default function TrendChart({ data, type, className = "" }: TrendChartProps) {
  const formatTooltipValue = (value: number, name: string) => {
    if (name === "effort" && value) {
      const label = EFFORT_LABELS[value as keyof typeof EFFORT_LABELS];
      return [`${value} - ${label.emoji} ${label.label}`, "Effort"];
    }
    if (name === "soreness" && value) {
      const label = SORENESS_LABELS[value as keyof typeof SORENESS_LABELS];
      return [`${value} - ${label.emoji} ${label.label}`, "Soreness"];
    }
    return [value, name];
  };

  const formatTooltipLabel = (label: string, payload: any[]) => {
    if (payload && payload[0] && payload[0].payload) {
      const data = payload[0].payload;
      return `W${data.week} Session ${data.sessionNumber} (${data.date})`;
    }
    return label;
  };

  return (
    <div className={`bg-elevated p-4 rounded-lg ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#C8B99D" opacity={0.3} />
          <XAxis 
            dataKey="session" 
            tick={{ fill: "#6B5A48", fontSize: 12 }}
            axisLine={{ stroke: "#C8B99D" }}
            tickLine={{ stroke: "#C8B99D" }}
          />
          <YAxis 
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fill: "#6B5A48", fontSize: 12 }}
            axisLine={{ stroke: "#C8B99D" }}
            tickLine={{ stroke: "#C8B99D" }}
          />
          <Tooltip 
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              backgroundColor: "#E8DECE",
              border: "1px solid #C8B99D",
              borderRadius: "6px",
              color: "#2C1A10"
            }}
          />
          <Legend />
          
          {(type === "effort" || type === "both") && (
            <Line 
              type="monotone" 
              dataKey="effort" 
              stroke="#C84B1A" 
              strokeWidth={2}
              dot={{ fill: "#C84B1A", strokeWidth: 2, r: 4 }}
              name="Effort"
              connectNulls={false}
            />
          )}
          
          {(type === "soreness" || type === "both") && (
            <Line 
              type="monotone" 
              dataKey="soreness" 
              stroke="#1C3A2A" 
              strokeWidth={2}
              dot={{ fill: "#1C3A2A", strokeWidth: 2, r: 4 }}
              name="Soreness"
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}