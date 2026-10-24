import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function migrationResponse() {
  return NextResponse.json(
    { error: "Site settings are not initialized. Apply the discovery media migration first." },
    { status: 503 }
  );
}

export async function GET(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const { data, error } = await supabase
      .from("site_media")
      .select("media")
      .eq("id", "discovery")
      .maybeSingle();
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") return migrationResponse();
      throw error;
    }
    if (!data) return migrationResponse();
    return NextResponse.json({
      maintenance: data.media?.maintenance || { enabled: false, message: "" },
    });
  } catch (error) {
    console.error("Unable to load site availability:", error);
    return NextResponse.json({ error: "Unable to check site availability." }, { status: 500 });
  }
}
