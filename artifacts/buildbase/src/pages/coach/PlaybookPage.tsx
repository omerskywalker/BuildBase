import { useState } from "react";
import { Search, ChevronDown, ChevronUp, Target, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaybookContent { type: "exercise" | "principle" | "cue"; title: string; content: string; tags?: string[]; priority?: "high" | "medium" | "low"; }
interface PlaybookSection { id: string; title: string; phase?: string; category: string; content: PlaybookContent[]; }

const PLAYBOOK: PlaybookSection[] = [
  { id: "form-fundamentals", title: "Form Assessment & Coaching", category: "Assessment", content: [
    { type: "principle", title: "Three-Stage Assessment System", priority: "high", content: "Use the internal form assessment to track client progress:\n\n• Needs Cues: Client struggles with basic form, requires constant verbal cues\n• Getting There: Shows improvement, occasional cues needed\n• Locked In: Solid form demonstrated consistently, client sees \"Solid Form ✅\" badge\n\nNever reveal raw assessment scores to clients. They only see positive reinforcement when locked in." },
    { type: "cue", title: "Universal Coaching Cues", tags: ["form", "cues"], priority: "high", content: "Core cues that work across all movements:\n\n• \"Chest up, shoulders back\"\n• \"Tight core, breathe behind the shield\"\n• \"Control the weight, don't let it control you\"\n• \"Full range of motion, pause at the bottom\"\n• \"Drive through your heels\"" },
  ]},
  { id: "squat-mastery", title: "Squat Technique & Progressions", category: "Movement Patterns", phase: "All Phases", content: [
    { type: "exercise", title: "Goblet Squat Setup", tags: ["squat", "goblet", "lower-body"], priority: "high", content: "Setup: Hold weight at chest, elbows down, feet shoulder-width.\n\nExecution:\n• Hinge at hips first, then bend knees\n• Keep chest up, weight on heels\n• Descend until hip crease below knee\n• Drive through heels to return\n\nCommon Issues:\n• Knees caving → \"Push knees out over toes\"\n• Forward lean → \"Keep that chest proud\"\n• Shallow depth → \"Sit back into an imaginary chair\"" },
    { type: "exercise", title: "Back Squat Progression", tags: ["squat", "barbell", "lower-body"], priority: "high", content: "High bar: Across upper traps. Low bar: Across rear delts.\n\nBreathing: Big breath at top, brace core, hold during lift, exhale at top.\n\nDepth: Hip crease below knee cap, maintain neutral spine.\n\nSpotting: Hands under armpits, not on bar." },
  ]},
  { id: "deadlift-mastery", title: "Deadlift Technique & Safety", category: "Movement Patterns", phase: "Phase 2-3", content: [
    { type: "exercise", title: "Romanian Deadlift (RDL)", tags: ["deadlift", "rdl", "posterior-chain"], priority: "high", content: "Setup: Bar at hip level, slight bend in knees.\n\nMovement:\n• Push hips back, keep bar close\n• Maintain neutral spine\n• Feel stretch in hamstrings\n• Return by driving hips forward\n\nCritical Cues:\n• \"Bow to the audience, stick your butt out\"\n• \"Bar stays glued to your legs\"\n• \"Feel it in your hamstrings, not your back\"" },
    { type: "exercise", title: "Conventional Deadlift", tags: ["deadlift", "conventional"], priority: "high", content: "Setup: Feet hip-width, bar over mid-foot, shins close.\n\nLifting:\n1. Brace core and lats\n2. Drive through heels\n3. Knees and hips extend together\n4. Stand tall, squeeze glutes\n\nRed Flags:\n• Rounded lower back → Reset\n• Bar drifting forward → \"Keep it close\"" },
  ]},
  { id: "upper-body", title: "Upper Body Movement Patterns", category: "Movement Patterns", phase: "All Phases", content: [
    { type: "exercise", title: "Push-Up Progressions", tags: ["push", "upper-body"], priority: "medium", content: "Regressions: Wall → Incline → Knee → Eccentric only\n\nStandard: Hands under shoulders, straight line, lower to floor, push explosively.\n\nProgressions: Diamond → Weighted → Single-arm\n\nForm Focus: No sagging hips, full range of motion." },
    { type: "exercise", title: "Horizontal Row", tags: ["row", "upper-body", "pull"], priority: "medium", content: "Setup: Bar at hip height, hang below.\n\nExecution:\n• Maintain rigid body line\n• Pull chest to bar\n• Slow controlled descent\n\nCues: \"Turn elbows to pockets\", \"Squeeze shoulder blades together\"" },
  ]},
  { id: "program-phases", title: "12-Week Program Philosophy", category: "Program Design", content: [
    { type: "principle", title: "Phase 1: Foundation (Weeks 1-4)", priority: "high", content: "Goal: Movement pattern mastery + baseline strength.\n\nFocus: Form over weight. Establish neural connections.\n\nCoaching Priority: Teach the movements thoroughly. Use needs_cues liberally.\n\nExpected: Clients feel sore initially — normal adaptation." },
    { type: "principle", title: "Phase 2: Development (Weeks 5-8)", priority: "high", content: "Goal: Progressive overload + intensity introduction.\n\nFocus: Weight increases, compound movements emphasized.\n\nCoaching Priority: Monitor form under fatigue. Move clients to getting_there.\n\nExpected: Strength gains become visible. Track PRs." },
    { type: "principle", title: "Phase 3: Peak (Weeks 9-12)", priority: "high", content: "Goal: Maximum performance + program completion.\n\nFocus: Intensity peaks, minimal regressions.\n\nCoaching Priority: Celebrate locked_in status. Support mental game.\n\nExpected: Significant strength gains, high confidence." },
  ]},
];

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <Target className="w-4 h-4 text-error" />,
  medium: <AlertCircle className="w-4 h-4 text-warning" />,
  low: <CheckCircle className="w-4 h-4 text-success" />,
};

const TYPE_COLORS: Record<string, string> = {
  exercise: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  principle: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  cue: "bg-green-500/10 text-green-700 border-green-500/20",
};

export default function PlaybookPage() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const filtered = PLAYBOOK.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase()) ||
    s.content.some(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.content.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-display)", marginBottom: 4 }}>Coaching Playbook</h1>
        <p style={{ color: "#6B5A48", fontSize: 16 }}>Your reference guide for coaching principles, cues, and exercise technique.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#988A78" }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search playbook..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: "#E8DECE", borderColor: "#C8B99D", color: "#2C1A10" }} />
      </div>

      {filtered.length === 0 && <div className="text-center py-8"><p style={{ color: "#988A78" }}>No results found for "{query}"</p></div>}

      <div className="space-y-4">
        {filtered.map(section => (
          <Card key={section.id}>
            <button onClick={() => toggle(section.id)} className="w-full text-left">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg" style={{ color: "#2C1A10" }}>{section.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ fontSize: 12, color: "#6B5A48", background: "#DDD2BF", padding: "2px 8px", borderRadius: 4 }}>{section.category}</span>
                      {section.phase && <span style={{ fontSize: 12, color: "#6B5A48" }}>{section.phase}</span>}
                    </div>
                  </div>
                  {expanded.has(section.id) ? <ChevronUp className="w-5 h-5" style={{ color: "#988A78" }} /> : <ChevronDown className="w-5 h-5" style={{ color: "#988A78" }} />}
                </div>
              </CardHeader>
            </button>

            {expanded.has(section.id) && (
              <CardContent>
                <div className="space-y-6">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="border-l-2 pl-4" style={{ borderColor: "#C8B99D" }}>
                      <div className="flex items-center gap-3 mb-2">
                        {item.priority && PRIORITY_ICONS[item.priority]}
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10" }}>{item.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded border capitalize ${TYPE_COLORS[item.type]}`}>{item.type}</span>
                      </div>
                      <div className="whitespace-pre-line text-sm" style={{ color: "#6B5A48", lineHeight: 1.7 }}>{item.content}</div>
                      {item.tags && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.tags.map(tag => <span key={tag} style={{ fontSize: 11, color: "#988A78", background: "#E8DECE", padding: "2px 8px", borderRadius: 12, border: "1px solid #C8B99D" }}>{tag}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
