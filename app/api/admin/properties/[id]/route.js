import { NextResponse } from "next/server";
import { getAdminSupabaseContext } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req, { params }) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    if (!UUID_PATTERN.test(params.id)) {
      return NextResponse.json({ error: "Invalid property ID." }, { status: 400 });
    }

    const { action, notes = "" } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    }
    if (typeof notes !== "string" || notes.length > 2000) {
      return NextResponse.json({ error: "Review notes must be under 2,000 characters." }, { status: 400 });
    }
    if (action === "reject" && !notes.trim()) {
      return NextResponse.json({ error: "Add an improvement note before rejecting a listing." }, { status: 400 });
    }

    const { data: property, error } = await context.supabase
      .from("properties")
      .update({
        verificationStatus: action === "approve" ? "approved" : "rejected",
        verificationNotes: notes.trim(),
        status: action === "approve" ? "active" : "rejected",
        reviewedAt: new Date().toISOString(),
        reviewedBy: context.user.email || context.user.id,
      })
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("Error reviewing Supabase property:", error);
    return NextResponse.json({ error: "Unable to update the property review." }, { status: 500 });
  }
}
