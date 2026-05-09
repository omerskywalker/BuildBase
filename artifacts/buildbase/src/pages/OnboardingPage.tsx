import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / Prefer not to say" },
];

export default function OnboardingPage() {
  const { profile } = useAuth();
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [gender, setGender] = useState<"male" | "female" | "other">("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("Please enter your name."); return; }
    setLoading(true); setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error: err } = await supabase.from("profiles").update({ full_name: fullName.trim(), gender, onboarding_done: true }).eq("id", user.id);
      if (err) throw err;
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#EDE4D3" }}>
      <div className="w-full max-w-md rounded-xl p-8 border" style={{ background: "#E8DECE", borderColor: "#C8B99D" }}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#2C1A10", fontFamily: "var(--font-display)" }}>
            Welcome to <span style={{ color: "#1C3A2A" }}>Build</span><span style={{ color: "#C84B1A" }}>Base</span>
          </h1>
          <p className="text-sm" style={{ color: "#6B5A48", lineHeight: 1.6 }}>Let's get you set up with your personalized strength training program.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#6B5A48" }}>Your name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" required style={{ background: "#EDE4D3", border: "1px solid #C8B99D", borderRadius: 8, padding: "10px 12px", color: "#2C1A10", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#6B5A48" }}>Gender</label>
            <p style={{ fontSize: 12, color: "#988A78", marginBottom: 4 }}>This is used to set default training weights for you.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GENDER_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 8, border: `1px solid ${gender === opt.value ? "#C84B1A" : "#C8B99D"}`, background: gender === opt.value ? "#FFF8F3" : "#EDE4D3" }}>
                  <input type="radio" name="gender" value={opt.value} checked={gender === opt.value} onChange={() => setGender(opt.value as "male" | "female" | "other")} style={{ accentColor: "#C84B1A" }} />
                  <span style={{ fontSize: 14, color: "#2C1A10" }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: "#B83020", background: "#E8DECE", border: "1px solid #B83020", borderRadius: 6, padding: "8px 12px" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ background: loading ? "#8C3410" : "#C84B1A", color: "#FEFCF8", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", width: "100%", marginTop: 4 }}>
            {loading ? "Saving…" : "Get Started →"}
          </button>
        </form>
      </div>
    </main>
  );
}
