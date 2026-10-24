"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(true);
  const profileRequest = useRef(0);
  const profileUserId = useRef(null);

  const fetchProfile = useCallback(async (session) => {
    if (!session?.access_token) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("User profile not found.");
    return { ...data, verified: Boolean(session.user.email_confirmed_at) };
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
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const requestId = ++profileRequest.current;
      setUser(session?.user || null);
      if (!session) {
        profileUserId.current = null;
        setProfile(null);
        setProfileError("");
        setLoading(false);
        return;
      }
      if (profileUserId.current !== session.user.id) {
        setProfile(null);
        setProfileError("");
        setLoading(true);
      } else if (event === "TOKEN_REFRESHED") {
        setLoading(false);
        return;
      }
      queueMicrotask(async () => {
        try {
          const nextProfile = await fetchProfile(session);
          if (mounted && requestId === profileRequest.current) {
            profileUserId.current = session.user.id;
            setProfile(nextProfile);
            setProfileError("");
          }
        } catch (profileError) {
          console.error("Unable to load Supabase profile:", profileError);
          if (mounted && requestId === profileRequest.current) {
            setProfileError(profileError.message || "Unable to load your account profile.");
          }
        } finally {
          if (mounted && requestId === profileRequest.current) setLoading(false);
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
    const availability = await fetch("/api/maintenance", { cache: "no-store" });
    const availabilityData = await availability.json();
    if (!availability.ok) {
      throw new Error(availabilityData.error || "Unable to check site availability.");
    }
    if (availabilityData.maintenance?.enabled) {
      throw new Error(availabilityData.maintenance.message || "Sign-in and sign-up are temporarily unavailable.");
    }

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
    return { email: data.user.email, session: data.session };
  }

  async function login(email, password) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const availability = await fetch("/api/maintenance", { cache: "no-store" });
    const availabilityData = await availability.json();
    if (!availability.ok) {
      throw new Error(availabilityData.error || "Unable to check site availability.");
    }
    if (availabilityData.maintenance?.enabled) {
      throw new Error(availabilityData.maintenance.message || "Sign-in and sign-up are temporarily unavailable.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function loginWithGoogle(role) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const availability = await fetch("/api/maintenance", { cache: "no-store" });
    const availabilityData = await availability.json();
    if (!availability.ok) {
      throw new Error(availabilityData.error || "Unable to check site availability.");
    }
    if (availabilityData.maintenance?.enabled) {
      throw new Error(availabilityData.maintenance.message || "Sign-in and sign-up are temporarily unavailable.");
    }
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
    setProfileError("");
    try {
      const nextProfile = await fetchProfile(data.session);
      setProfile(nextProfile);
      profileUserId.current = data.session?.user?.id || null;
    } catch (error) {
      setProfileError(error.message || "Unable to load your account profile.");
      setLoading(false);
      throw error;
    }
    setLoading(false);
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
        profileError,
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
