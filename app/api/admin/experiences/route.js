import { NextResponse } from "next/server";
import { getAdminSupabaseContext } from "@/lib/supabaseServer";
import { ExperienceValidationError, normalizeExperience } from "@/lib/experienceData";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    const { data: experiences, error } = await context.supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ experiences: experiences || [] });
  } catch (error) {
    console.error("Error loading admin experiences:", error);
    return NextResponse.json({ error: "Unable to load experience listings." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    const payload = normalizeExperience(await req.json());
    const { data: experience, error } = await context.supabase
      .from("experiences")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    if (error instanceof ExperienceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating admin experience:", error);
    return NextResponse.json({ error: "Unable to create experience listing." }, { status: 500 });
  }
}
