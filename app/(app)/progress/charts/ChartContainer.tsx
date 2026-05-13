"use client";

import { useState, useEffect } from "react";
import LiftChart from "@/components/LiftChart";
import ExerciseSelector from "./ExerciseSelector";

interface ChartDataPoint {
  date: string;
  weight: number;
  sessionName: string;
}

interface ChartContainerProps {
  userId: string;
}

export default function ChartContainer({ userId }: ChartContainerProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExerciseSelect = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseName(exerciseName);
  };

  useEffect(() => {
    if (!selectedExerciseId) {
      setChartData([]);
      return;
    }

    async function fetchChartData() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/progress/charts?exerciseId=${selectedExerciseId}&userId=${userId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        
        const data = await response.json();
        setChartData(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [selectedExerciseId, userId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Exercise Selector */}
      <div className="lg:col-span-1">
        <ExerciseSelector
          userId={userId}
          onExerciseSelect={handleExerciseSelect}
          selectedExerciseId={selectedExerciseId}
        />
      </div>

      {/* Chart Display */}
      <div className="lg:col-span-2">
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-6">
          {!selectedExerciseId ? (
            <div className="flex items-center justify-center h-80 text-content-muted text-sm">
              Select an exercise to view its progress chart
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-80 text-content-secondary text-sm">
              Loading chart data...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-80 text-error text-sm">
              Error loading chart: {error}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-display font-semibold text-content-primary">
                  {selectedExerciseName}
                </h3>
                <p className="text-sm text-content-secondary">
                  Weight progression over time
                </p>
              </div>
              <LiftChart
                data={chartData}
                exerciseName={selectedExerciseName}
                height={320}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}