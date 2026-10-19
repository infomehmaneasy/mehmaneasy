import { NextResponse } from "next/server";
import { getAdminSupabaseContext } from "@/lib/supabaseServer";
import { getSupportEmail } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    const supportEmail = getSupportEmail();

    const { data: enquiries, error } = await context.supabase
      .from("enquiries")
      .select("*")
      .eq("recipientEmail", supportEmail)
      .eq("status", "new")
      .order("createdAt", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ enquiries });
  } catch (error) {
    console.error("Error loading Supabase support enquiries:", error);
    return NextResponse.json({ error: "Unable to load support enquiries." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const context = await getAdminSupabaseContext(req);
    if (context.error) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }
    const { enquiryId } = await req.json();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(enquiryId || "")) {
      return NextResponse.json({ error: "Invalid enquiry ID." }, { status: 400 });
    }

    const { data: enquiry, error } = await context.supabase
      .from("enquiries")
      .update({ status: "reviewed" })
      .eq("id", enquiryId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!enquiry) return NextResponse.json({ error: "Support enquiry not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating Supabase support enquiry:", error);
    return NextResponse.json({ error: "Unable to update support enquiry." }, { status: 500 });
  }
}
