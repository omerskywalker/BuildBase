"use client";

import { useEffect, useState } from "react";
import { Program, Phase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Settings, Dumbbell } from "lucide-react";
import Link from "next/link";

interface ProgramWithPhases extends Program {
  phases?: Phase[];
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<ProgramWithPhases[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/admin/programs");
      if (!response.ok) {
        throw new Error("Failed to fetch programs");
      }
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 16 }}>
          Program Editor
        </h1>
        <p style={{ color: "#6B5A48" }}>Loading programs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
          Program Editor
        </h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>
          Manage workout programs, exercises, and weight defaults
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
          <CardDescription>
            {programs.length} total programs • Click edit to modify program details and phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Phases</TableHead>
                <TableHead>Weeks</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell style={{ fontWeight: 600, color: "#2C1A10" }}>
                    {program.name}
                  </TableCell>
                  <TableCell style={{ fontSize: 14, color: "#6B5A48", maxWidth: 200 }}>
                    {program.description ? (
                      <span>{program.description.length > 80 ? `${program.description.substring(0, 80)}...` : program.description}</span>
                    ) : (
                      <span style={{ fontStyle: "italic", color: "#988A78" }}>No description</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge variant="secondary">{program.total_phases}</Badge>
                      {program.phases && program.phases.length > 0 && (
                        <div style={{ fontSize: 12, color: "#6B5A48" }}>
                          {program.phases.map((phase) => phase.name).join(", ")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{program.total_weeks}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: 14, color: "#6B5A48" }}>
                    v{program.version}
                  </TableCell>
                  <TableCell>
                    <Badge variant={program.is_active ? "default" : "secondary"}>
                      {program.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: 14, color: "#6B5A48" }}>
                    {new Date(program.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/admin/programs/${program.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex items-center gap-2"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/admin/programs/${program.id}/exercises`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex items-center gap-2"
                        >
                          <Dumbbell className="h-3 w-3" />
                          Exercises
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {programs.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardContent className="pt-6">
            <div style={{ textAlign: "center", padding: 40, color: "#6B5A48" }}>
              <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#2C1A10" }}>
                No Programs Found
              </h3>
              <p style={{ fontSize: 14 }}>
                No workout programs have been created yet. Import the default seed data to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
