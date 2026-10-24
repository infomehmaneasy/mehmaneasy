import { NextResponse } from "next/server";
import { getAdminSupabaseContext } from "@/lib/supabaseServer";
import { DEFAULT_SITE_MEDIA } from "@/lib/siteMedia";

export const dynamic = "force-dynamic";

function validateMedia(media) {
  if (!media || typeof media !== "object" || Array.isArray(media)) {
    return "Provide the collection and destination images.";
  }

  for (const group of ["collections", "destinations"]) {
    if (!media[group] || typeof media[group] !== "object" || Array.isArray(media[group])) {
      return "Provide the collection and destination images.";
    }
    const entries = Object.entries(media[group]);
    if (group === "collections" && entries.length !== Object.keys(DEFAULT_SITE_MEDIA.collections).length) {
      return "Collection images cannot be added or removed.";
    }
    if (
      group === "collections" &&
      entries.some(([name]) => !Object.hasOwn(DEFAULT_SITE_MEDIA.collections, name))
    ) {
      return "Only the Classic, Easy and Royal collection covers can be changed.";
    }
    if (group === "destinations" && entries.length > 100) {
      return "You can add up to 100 destinations.";
    }
    for (const [name, value] of entries) {
      if (
        !name.trim() ||
        name.length > 80 ||
        typeof value !== "string" ||
        value.length > 2048 ||
        (value !== "" && !/^https:\/\//i.test(value))
      ) {
        return `Enter a valid HTTPS image URL for ${name}.`;
      }
    }
  }

  if (
    media.maintenance !== undefined &&
    (!media.maintenance ||
      typeof media.maintenance !== "object" ||
      typeof media.maintenance.enabled !== "boolean" ||
      typeof media.maintenance.message !== "string" ||
      media.maintenance.message.length > 1000 ||
      (media.maintenance.enabled && !media.maintenance.message.trim()))
  ) {
    return "Enter a maintenance message before enabling maintenance mode.";
  }

  return "";
}

export async function GET(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    const { data, error } = await context.supabase
      .from("site_media")
      .select("media")
      .eq("id", "discovery")
      .single();
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
        ...data.media,
        maintenance: data.media.maintenance || { enabled: false, message: "" },
      },
    });
  } catch (error) {
    console.error("Unable to load admin discovery images:", error);
    return NextResponse.json({ error: "Unable to load discovery images." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { media } = await req.json();
    const validationError = validateMedia(media);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: current, error: readError } = await context.supabase
      .from("site_media")
      .select("media")
      .eq("id", "discovery")
      .maybeSingle();
    if (readError) {
      if (readError.code === "PGRST205" || readError.code === "42P01") {
        return NextResponse.json(
          {
            error: "Home page image settings are not initialized.",
            migrationRequired: true,
          },
          { status: 503 }
        );
      }
      throw readError;
    }

    const updatedMedia = {
      ...media,
      maintenance: current?.media?.maintenance || { enabled: false, message: "" },
    };
    const { data, error } = await context.supabase
      .from("site_media")
      .upsert({ id: "discovery", media: updatedMedia }, { onConflict: "id" })
      .select("media")
      .single();
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
        ...data.media,
        maintenance: data.media.maintenance || { enabled: false, message: "" },
      },
    });
  } catch (error) {
    console.error("Unable to save discovery images:", error);
    return NextResponse.json({ error: "Unable to save discovery images." }, { status: 500 });
  }
}
