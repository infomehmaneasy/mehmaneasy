import { NextResponse } from "next/server";
import {
  getAuthenticatedSupabaseUser,
  getSupabaseForRequest,
} from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return NextResponse.json({ error: "User profile not found." }, { status: 404 });

    return NextResponse.json({ profile: { ...profile, verified: Boolean(user.email_confirmed_at) } });
  } catch (error) {
    console.error("Error retrieving Supabase profile:", error);
    return NextResponse.json({ error: "Failed to load your profile." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const payload = await req.json();
    if (!["guest", "host"].includes(payload?.role)) {
      return NextResponse.json({ error: "Choose a valid account role." }, { status: 400 });
    }

    const { data: profile, error } = await supabase.rpc("set_my_role", {
      new_role: payload.role,
    });
    if (error) throw error;
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error updating Supabase profile:", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
