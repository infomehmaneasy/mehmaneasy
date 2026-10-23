import { NextResponse } from "next/server";
import { getAdminSupabaseContext } from "@/lib/supabaseServer";
import { ExperienceValidationError, isExperienceId, normalizeExperience } from "@/lib/experienceData";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    if (!isExperienceId(params.id)) {
      return NextResponse.json({ error: "Invalid experience ID." }, { status: 400 });
    }
    const payload = normalizeExperience(await req.json());
    const { data: experience, error } = await context.supabase
      .from("experiences")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!experience) return NextResponse.json({ error: "Experience not found." }, { status: 404 });
    return NextResponse.json({ experience });
  } catch (error) {
    if (error instanceof ExperienceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating admin experience:", error);
    return NextResponse.json({ error: "Unable to update experience listing." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    if (!isExperienceId(params.id)) {
      return NextResponse.json({ error: "Invalid experience ID." }, { status: 400 });
    }
    const { data, error } = await context.supabase
      .from("experiences")
      .delete()
      .eq("id", params.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Experience not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin experience:", error);
    return NextResponse.json({ error: "Unable to delete experience listing." }, { status: 500 });
  }
}
