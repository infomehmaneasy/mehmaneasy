import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabaseServer";
import { EXPERIENCE_CATEGORIES } from "@/lib/experienceData";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    if (category && !EXPERIENCE_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Choose a valid experience category." }, { status: 400 });
    }

    let query = getSupabaseForRequest(req)
      .from("experiences")
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ experiences: data || [] });
  } catch (error) {
    console.error("Error loading public experiences:", error);
    return NextResponse.json({ error: "Unable to load experiences." }, { status: 500 });
  }
}
