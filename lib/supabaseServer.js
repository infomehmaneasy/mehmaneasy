import { createClient } from "@supabase/supabase-js";

export function getSupabaseForRequest(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL and publishable key are not configured.");
  }

  const authorization = req.headers.get("authorization");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: authorization ? { headers: { Authorization: authorization } } : undefined,
  });
}

export async function getAuthenticatedSupabaseUser(req, supabaseClient = getSupabaseForRequest(req)) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const { data, error } = await supabaseClient.auth.getUser(authorization.slice(7));
  if (error) return null;
  return data.user;
}

export async function getAdminSupabaseContext(req) {
  const supabase = getSupabaseForRequest(req);
  const user = await getAuthenticatedSupabaseUser(req, supabase);
  if (!user) return { error: "Admin access required.", status: 403 };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (profile?.role !== "admin") return { error: "Admin access required.", status: 403 };
  return { supabase, user, profile };
}
