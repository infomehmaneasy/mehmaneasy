import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabaseServer";
import { DEFAULT_SITE_MEDIA } from "@/lib/siteMedia";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const { data, error } = await supabase
      .from("site_media")
      .select("media")
      .eq("id", "discovery")
      .maybeSingle();
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json(
          {
            error: "Home page image settings are not initialized.",
            migrationRequired: true,
          },
          { status: 503 }
        );
      }
      throw error;
    }
    return NextResponse.json({
      media: {
        collections: { ...DEFAULT_SITE_MEDIA.collections, ...data?.media?.collections },
        destinations: { ...data?.media?.destinations },
      },
    });
  } catch (error) {
    console.error("Unable to load discovery images:", error);
    return NextResponse.json({ error: "Unable to load discovery images." }, { status: 500 });
  }
}
