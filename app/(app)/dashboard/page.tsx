import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CoachNotesBanner from "@/components/CoachNotesBanner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get user profile to check if they have a coach (coach_id not null)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, coach_id")
    .eq("id", user.id)
    .single();

  const hasCoach = profile?.coach_id !== null;
  const isUser = profile?.role === "user";

  return (
    <div>
      <h1 style={{ 
        fontSize: 28, 
        fontWeight: 700, 
        color: "#2C1A10", 
        fontFamily: "var(--font-display)", 
        marginBottom: 16 
      }}>
        Dashboard
      </h1>
      
      {/* Show coach notes banner only for users who have a coach */}
      {isUser && hasCoach && <CoachNotesBanner />}
      
      <div className="space-y-6">
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: "#E8DECE", border: "1px solid #C8B99D" }}
        >
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: "#2C1A10", 
            marginBottom: 8 
          }}>
            Welcome to BuildBase
          </h2>
          <p style={{ color: "#6B5A48", fontSize: 14, lineHeight: 1.5 }}>
            Your personalized strength training dashboard. Track your progress, 
            log sessions, and stay connected with your coach.
          </p>
        </div>
        
        {/* TODO Batch 2: Additional dashboard features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: "#E5DAC8", border: "1px solid #B5A68C" }}
          >
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: "#2C1A10", 
              marginBottom: 4 
            }}>
              Next Session
            </h3>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>
              Track your next workout session
            </p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: "#E5DAC8", border: "1px solid #B5A68C" }}
          >
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: "#2C1A10", 
              marginBottom: 4 
            }}>
              Progress Summary
            </h3>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>
              View your streak and recent activity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
