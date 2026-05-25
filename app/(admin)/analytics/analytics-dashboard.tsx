"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Activity, TrendingUp, UserPlus, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalAthletes: number;
  activeAthletes: number;
  weeklyCompletionRate: number;
  coachWorkload: Array<{ coachId: string; name: string; clientCount: number }>;
  newSignups: number;
  recentSessions: number;
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const statCards = [
    {
      title: "Total Athletes",
      value: data.totalAthletes,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Active Athletes",
      value: data.activeAthletes,
      icon: Activity,
      description: "With active enrollment",
    },
    {
      title: "Weekly Completion",
      value: `${data.weeklyCompletionRate}%`,
      icon: TrendingUp,
      description: "Sessions completed (7d)",
    },
    {
      title: "New Signups",
      value: data.newSignups,
      icon: UserPlus,
      description: "Last 30 days",
    },
    {
      title: "Recent Sessions",
      value: data.recentSessions,
      icon: Calendar,
      description: "Logged in last 7 days",
    },
  ];

  const chartData = data.coachWorkload.map((coach) => ({
    name: coach.name.split(" ")[0] || coach.name,
    clients: coach.clientCount,
  }));

  return (
    <div>
      {/* Stat Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {statCards.map((stat) => (
          <Card key={stat.title} style={{ backgroundColor: "#E8DECE", border: "1px solid #C8B99D" }}>
            <CardHeader style={{ paddingBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <CardTitle style={{ fontSize: 14, color: "#6B5A48", fontWeight: 500 }}>
                  {stat.title}
                </CardTitle>
                <stat.icon style={{ width: 18, height: 18, color: "#988A78" }} />
              </div>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#C84B1A", marginBottom: 2 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 12, color: "#988A78" }}>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coach Workload Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Bar Chart */}
        <Card style={{ backgroundColor: "#E8DECE", border: "1px solid #C8B99D" }}>
          <CardHeader>
            <CardTitle style={{ fontSize: 16, color: "#2C1A10" }}>Coach Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6B5A48", fontSize: 12 }}
                    axisLine={{ stroke: "#C8B99D" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B5A48", fontSize: 12 }}
                    axisLine={{ stroke: "#C8B99D" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#E8DECE",
                      border: "1px solid #C8B99D",
                      borderRadius: 8,
                      color: "#2C1A10",
                    }}
                  />
                  <Bar dataKey="clients" fill="#C84B1A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#988A78", textAlign: "center", padding: 32 }}>
                No coaches assigned yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Coach Table */}
        <Card style={{ backgroundColor: "#E8DECE", border: "1px solid #C8B99D" }}>
          <CardHeader>
            <CardTitle style={{ fontSize: 16, color: "#2C1A10" }}>Coach Details</CardTitle>
          </CardHeader>
          <CardContent>
            {data.coachWorkload.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: "#6B5A48" }}>Coach</TableHead>
                    <TableHead style={{ color: "#6B5A48", textAlign: "right" }}>Clients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.coachWorkload.map((coach) => (
                    <TableRow key={coach.coachId}>
                      <TableCell style={{ color: "#2C1A10", fontWeight: 500 }}>
                        {coach.name}
                      </TableCell>
                      <TableCell style={{ color: "#C84B1A", fontWeight: 600, textAlign: "right" }}>
                        {coach.clientCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p style={{ color: "#988A78", textAlign: "center", padding: 32 }}>
                No coaches assigned yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
