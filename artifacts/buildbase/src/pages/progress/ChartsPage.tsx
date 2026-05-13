import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import LiftChart from "@/components/LiftChart";

interface Exercise { id: string; name: string; muscle_group: string | null; }
interface ChartDataPoint { date: string; weight: number; sessionName: string; }

function ExerciseSelector({ userId, onSelect, selectedId }: { userId: string; onSelect: (id: string, name: string) => void; selectedId: string | null }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/progress/exercises?userId=${userId}`).then(r => r.json()).then(d => setExercises(d.exercises || [])).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="rounded-lg p-4 border border-border-subtle" style={{ background: "#E8DECE" }}><div className="text-sm" style={{ color: "#6B5A48" }}>Loading exercises...</div></div>;
  if (exercises.length === 0) return <div className="rounded-lg p-4 border border-border-subtle text-center" style={{ background: "#E8DECE" }}><div className="text-sm" style={{ color: "#988A78" }}>No exercises with logged sets found.</div></div>;

  return (
    <div className="rounded-lg p-4 border border-border-subtle" style={{ background: "#E8DECE" }}>
      <h3 className="font-semibold mb-3" style={{ color: "#2C1A10" }}>Select Exercise</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {exercises.map(ex => (
          <button key={ex.id} onClick={() => onSelect(ex.id, ex.name)} className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
            style={{ background: selectedId === ex.id ? "#DDD2BF" : "transparent", color: selectedId === ex.id ? "#2C1A10" : "#6B5A48", fontWeight: selectedId === ex.id ? 600 : 400 }}>
            <div>{ex.name}</div>
            {ex.muscle_group && <div className="text-xs mt-1" style={{ color: "#988A78" }}>{ex.muscle_group}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChartsPage() {
  const { profile } = useAuth();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = profile?.id ?? "";

  useEffect(() => {
    if (!selectedExerciseId || !userId) { setChartData([]); return; }
    setLoading(true);
    apiFetch(`/api/progress/charts?exerciseId=${selectedExerciseId}&userId=${userId}`)
      .then(r => r.json()).then(d => setChartData(d.data || [])).catch(() => setChartData([])).finally(() => setLoading(false));
  }, [selectedExerciseId, userId]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/progress" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ color: "#6B5A48" }}>
          <ArrowLeft size={16} /> Back to Progress
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Lift Charts</h1>
          <p className="text-sm" style={{ color: "#6B5A48" }}>Track your weight progression over time per exercise</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {userId && <ExerciseSelector userId={userId} onSelect={(id, name) => { setSelectedExerciseId(id); setSelectedExerciseName(name); }} selectedId={selectedExerciseId} />}
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-lg p-6 border border-border-subtle" style={{ background: "#E8DECE" }}>
            {!selectedExerciseId ? (
              <div className="flex items-center justify-center h-80 text-sm" style={{ color: "#988A78" }}>Select an exercise to view its progress chart</div>
            ) : loading ? (
              <div className="flex items-center justify-center h-80 text-sm" style={{ color: "#6B5A48" }}>Loading chart data...</div>
            ) : (
              <>
                <div className="mb-4"><h3 className="font-semibold" style={{ color: "#2C1A10" }}>{selectedExerciseName}</h3><p className="text-sm" style={{ color: "#6B5A48" }}>Weight progression over time</p></div>
                <LiftChart data={chartData} exerciseName={selectedExerciseName} height={320} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
