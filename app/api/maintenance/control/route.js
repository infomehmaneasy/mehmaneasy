import { NextResponse } from "next/server";
import {
  isMaintenanceSessionValid,
  MAINTENANCE_COOKIE,
} from "@/lib/maintenanceAccess";
import { createSiteMediaAdminClient } from "@/lib/siteMediaAdmin";

export const dynamic = "force-dynamic";

function authorize(req) {
  return isMaintenanceSessionValid(req.cookies.get(MAINTENANCE_COOKIE)?.value);
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Developer maintenance sign-in is required." }, { status: 401 });
}

function migrationResponse() {
  return NextResponse.json(
    { error: "Site settings are not initialized. Apply the discovery media migration first." },
    { status: 503 }
  );
}

async function loadMedia(supabase) {
  const { data, error } = await supabase
    .from("site_media")
    .select("media")
    .eq("id", "discovery")
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return { response: migrationResponse() };
    throw error;
  }
  if (!data) return { response: migrationResponse() };
  return { data };
}

export async function GET(req) {
  try {
    if (!authorize(req)) return unauthorizedResponse();
    const supabase = createSiteMediaAdminClient();
    const { data, response } = await loadMedia(supabase);
    if (response) return response;
    return NextResponse.json({
      maintenance: data.media.maintenance || { enabled: false, message: "" },
    });
  } catch (error) {
    console.error("Unable to load developer maintenance settings:", error);
    return NextResponse.json(
      { error: error.message || "Unable to load maintenance settings." },
      { status: 503 }
    );
  }
}

export async function PATCH(req) {
  try {
    if (!authorize(req)) return unauthorizedResponse();
    const { enabled, message } = await req.json();
    if (
      typeof enabled !== "boolean" ||
      typeof message !== "string" ||
      message.length > 1000 ||
      (enabled && !message.trim())
    ) {
      return NextResponse.json(
        { error: "Enter a maintenance message before enabling maintenance mode." },
        { status: 400 }
      );
    }

    const supabase = createSiteMediaAdminClient();
    const { data, response } = await loadMedia(supabase);
    if (response) return response;
    const maintenance = { enabled, message: message.trim() };
    const { error } = await supabase
      .from("site_media")
      .update({ media: { ...data.media, maintenance } })
      .eq("id", "discovery");
    if (error) throw error;
    return NextResponse.json({ maintenance });
  } catch (error) {
    console.error("Unable to save developer maintenance settings:", error);
    return NextResponse.json(
      { error: error.message || "Unable to save maintenance settings." },
      { status: 503 }
    );
  }
}
