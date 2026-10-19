import { NextResponse } from "next/server";
import { getAdminSupabaseContext } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { data: properties, error } = await context.supabase
      .from("properties")
      .select("*")
      .in("status", ["pending_review", "active"])
      .eq("verificationStatus", "pending")
      .order("createdAt", { ascending: true })
      .limit(100);
    if (error) throw error;

    const ids = (properties || []).map((property) => property.id);
    const { data: privateData, error: privateError } = ids.length
      ? await context.supabase.from("property_private").select("*").in("propertyId", ids)
      : { data: [], error: null };
    if (privateError) throw privateError;
    const privateById = new Map((privateData || []).map((item) => [item.propertyId, item]));
    return NextResponse.json({
      properties: (properties || []).map((property) => ({
        ...property,
        ...privateById.get(property.id),
        _id: property.id,
      })),
    });
  } catch (error) {
    console.error("Error loading Supabase verification queue:", error);
    return NextResponse.json({ error: "Unable to load the property verification queue." }, { status: 500 });
  }
}
