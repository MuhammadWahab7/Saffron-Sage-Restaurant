import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const normalizeEmail = (email) => email.trim().toLowerCase();
const configurationError =
  "Account sign-in is not available right now. Please try again later.";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Could not restore Supabase session:", error.message);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const requireSupabase = useCallback(() => {
    if (!isSupabaseConfigured || !supabase) throw new Error(configurationError);
  }, []);

  const signUp = useCallback(
    async ({ name, email, password }) => {
      requireSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      return {
        user: data.user,
        requiresEmailConfirmation: !data.session,
        mode: "supabase",
      };
    },
    [requireSupabase],
  );

  const signIn = useCallback(
    async ({ email, password }) => {
      requireSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) throw error;
      return { user: data.user, mode: "supabase" };
    },
    [requireSupabase],
  );

  const signOut = useCallback(async () => {
    requireSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [requireSupabase]);

  const resetPassword = useCallback(
    async (email) => {
      requireSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    },
    [requireSupabase],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      authMode: isSupabaseConfigured ? "supabase" : "unconfigured",
      isLiveAuth: isSupabaseConfigured,
      configurationError,
    }),
    [user, loading, signUp, signIn, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
};

export const getUserDisplayName = (user) =>
  user?.user_metadata?.full_name?.trim() || user?.email?.split("@")[0] || "Guest";
