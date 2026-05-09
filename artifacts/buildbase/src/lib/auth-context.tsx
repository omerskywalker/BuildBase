import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./supabase";
import type { Profile } from "./types";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Supabase init error:", msg);
      setInitError(msg);
      setLoading(false);
      return;
    }

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        setProfile(data ?? null);
      } catch (e) {
        console.error("fetchProfile error:", e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch((e) => {
      console.error("getSession error:", e instanceof Error ? e.message : String(e));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  if (initError) {
    return (
      <div style={{ minHeight: "100vh", background: "#EDE4D3", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 520, background: "#E8DECE", border: "1px solid #C8B99D", borderRadius: 12, padding: 32 }}>
          <h2 style={{ color: "#2C1A10", marginBottom: 8, fontWeight: 700 }}>Database Configuration Error</h2>
          <p style={{ color: "#6B5A48", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            BuildBase could not connect to Supabase. Please check that your credentials are correct in Secrets.
          </p>
          <pre style={{ background: "#DDD2BF", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#B83020", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
            {initError}
          </pre>
          <p style={{ color: "#988A78", fontSize: 12, marginTop: 12 }}>
            Make sure VITE_SUPABASE_URL looks like: https://xxxx.supabase.co
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
