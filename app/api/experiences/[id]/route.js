import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabaseServer";
import { isExperienceId } from "@/lib/experienceData";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  if (!isExperienceId(params.id)) {
    return NextResponse.json({ error: "Invalid experience ID." }, { status: 400 });
  }
  try {
    const { data, error } = await getSupabaseForRequest(req)
      .from("experiences")
      .select("*")
      .eq("id", params.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Experience not found." }, { status: 404 });
    return NextResponse.json({ experience: data });
  } catch (error) {
    console.error("Error loading experience details:", error);
    return NextResponse.json({ error: "Unable to load this experience." }, { status: 500 });
  }
}
