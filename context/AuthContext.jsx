"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (session) => {
    if (!session?.access_token) return null;
    const response = await fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Unable to load your profile.");
    }
    const data = await response.json();
    return data.profile;
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.access_token) throw new Error("Please sign in again.");
    return data.session.access_token;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.error("Unable to restore Supabase session:", error.message);
      const session = data?.session;
      if (mounted) {
        setUser(session?.user || null);
        try {
          setProfile(session ? await fetchProfile(session) : null);
        } catch (profileError) {
          console.error("Unable to load Supabase profile:", profileError);
        }
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }
      queueMicrotask(async () => {
        try {
          const nextProfile = await fetchProfile(session);
          if (mounted) setProfile(nextProfile);
        } catch (profileError) {
          console.error("Unable to load Supabase profile:", profileError);
        } finally {
          if (mounted) setLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  async function registerWithEmail(registrationData) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.signUp({
      email: registrationData.email.trim().toLowerCase(),
      password: registrationData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: registrationData.name.trim(),
          phone: registrationData.phone.trim(),
          place: registrationData.place.trim(),
          pincode: registrationData.pincode.trim(),
          role: registrationData.role,
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Unable to create your account.");
    return { email: data.user.email };
  }

  async function login(email, password) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function loginWithGoogle(role) {
    if (!supabase) throw new Error("Supabase is not configured.");
    if (role) window.localStorage.setItem("pendingGoogleRole", role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function refreshProfile() {
    if (!supabase) return;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    setUser(data.session?.user || null);
    setProfile(await fetchProfile(data.session));
  }

  const setRole = useCallback(async (role) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.rpc("set_my_role", { new_role: role });
    if (error) throw error;
    setProfile(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        registerWithEmail,
        login,
        loginWithGoogle,
        signOut,
        refreshProfile,
        setRole,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
