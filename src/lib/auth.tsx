import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

type AppRole = "super_admin" | "school_admin" | "teacher" | "student";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Only student role is allowed to work offline with cached session.
 * All other roles require online session verification.
 */
function isOnline() {
  return navigator.onLine;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchRole = async (userId: string): Promise<AppRole | null> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Priority: super_admin > school_admin > teacher > student
    const priority: AppRole[] = ["super_admin", "school_admin", "teacher", "student"];
    const roles = data.map((r) => r.role as AppRole);
    const bestRole = priority.find((p) => roles.includes(p)) ?? roles[0];
    return bestRole;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: restoredSession } }) => {
      if (restoredSession?.user) {
        // If we're offline, only allow student role from cache
        if (!isOnline()) {
          const cachedRole = localStorage.getItem("app_cached_role") as AppRole | null;
          if (cachedRole === "student") {
            setSession(restoredSession);
            setUser(restoredSession.user);
            setRole("student");
          } else {
            // Non-student roles cannot use cached session offline — force logout state
            setSession(null);
            setUser(null);
            setRole(null);
          }
          setLoading(false);
          return;
        }

        // Online: verify session and fetch role from server
        setSession(restoredSession);
        setUser(restoredSession.user);
        const fetchedRole = await fetchRole(restoredSession.user.id);
        setRole(fetchedRole);
        // Cache role for offline student access
        if (fetchedRole) {
          localStorage.setItem("app_cached_role", fetchedRole);
        } else {
          localStorage.removeItem("app_cached_role");
        }
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem("app_cached_role");
      }
      setLoading(false);
    });

    // Handle subsequent auth changes (sign in/out) — never await inside callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchRole(session.user.id).then((r) => {
            setRole(r);
            if (r) {
              localStorage.setItem("app_cached_role", r);
            }
          });
        } else {
          setRole(null);
          localStorage.removeItem("app_cached_role");
        }
        setLoading(false);
      }
    );

    // Listen for online/offline changes
    const handleOnline = async () => {
      // When coming back online, re-verify session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        const freshRole = await fetchRole(currentSession.user.id);
        setRole(freshRole);
        setSession(currentSession);
        setUser(currentSession.user);
        if (freshRole) {
          localStorage.setItem("app_cached_role", freshRole);
        }
      } else {
        // Session expired or invalid
        setSession(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem("app_cached_role");
      }
    };

    const handleOffline = () => {
      // If offline and not a student, clear auth state
      const cachedRole = localStorage.getItem("app_cached_role") as AppRole | null;
      if (cachedRole && cachedRole !== "student") {
        setSession(null);
        setUser(null);
        setRole(null);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isOnline()) {
      throw new Error("You must be online to sign in.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    setUser(null);
    setSession(null);
    setRole(null);
    localStorage.removeItem("app_cached_role");
    window.location.href = "/";
  };

  useSessionTimeout();

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
