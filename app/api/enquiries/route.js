import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseForRequest } from "@/lib/supabaseServer";
import { getSupportEmail } from "@/lib/support";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function brandedEmail({ title, bodyHtml }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f7f5f0;padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#fffdf9;border-radius:14px;overflow:hidden;">
        <div style="background:#20372f;padding:20px 24px;color:#fff;font-size:18px;font-weight:700;">Mehmaan Easy</div>
        <div style="padding:24px;color:#24302b;"><h2>${title}</h2>${bodyHtml}</div>
      </div>
    </div>`;
}

export async function POST(req) {
  try {
    const supportEmail = getSupportEmail();

    const payload = await req.json();
    const propertyId = typeof payload.propertyId === "string" ? payload.propertyId : "";
    const buyerName = typeof payload.buyerName === "string" ? payload.buyerName.trim() : "";
    const buyerEmail = typeof payload.buyerEmail === "string" ? payload.buyerEmail.trim() : "";
    const buyerPhone = typeof payload.buyerPhone === "string" ? payload.buyerPhone.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (
      !UUID_PATTERN.test(propertyId) ||
      !buyerName ||
      buyerName.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) ||
      buyerEmail.length > 254 ||
      !/^[+\d()\s.-]{7,25}$/.test(buyerPhone) ||
      message.length > 2000
    ) {
      return NextResponse.json({ error: "Please provide valid contact details and enquiry text." }, { status: 400 });
    }

    const supabase = getSupabaseForRequest(req);
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id,title,city")
      .eq("id", propertyId)
      .eq("status", "active")
      .eq("verificationStatus", "approved")
      .maybeSingle();
    if (propertyError) throw propertyError;
    if (!property) {
      return NextResponse.json({ error: "This stay is no longer available for enquiries." }, { status: 404 });
    }

    const propertyLink = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/property/${property.id}`
      : "";
    const { error: enquiryError } = await supabase
      .from("enquiries")
      .insert({
        propertyId: property.id,
        recipientEmail: supportEmail,
        buyerName,
        buyerEmail,
        buyerPhone,
        message,
        propertyLink,
        propertyTitle: property.title,
      });
    if (enquiryError) throw enquiryError;

    let notificationSent = false;
    const mailUser = process.env.GMAIL_EMAIL;
    const mailPassword = process.env.GMAIL_APP_PASSWORD;
    if (mailUser && mailPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: mailUser, pass: mailPassword },
        });
        const safeName = escapeHtml(buyerName);
        const safeEmail = escapeHtml(buyerEmail);
        const safePhone = escapeHtml(buyerPhone);
        const safeMessage = escapeHtml(message || "Please share more information about this stay.");
        const safeTitle = escapeHtml(property.title);
        const safeLink = propertyLink
          ? `<p><a href="${escapeHtml(propertyLink)}">View stay details</a></p>`
          : "";
        await transporter.sendMail({
          from: `Mehmaan Easy <${mailUser}>`,
          to: supportEmail,
          replyTo: buyerEmail,
          subject: `Guest question about ${property.title}`,
          html: brandedEmail({
            title: "A guest has a question",
            bodyHtml: `<p><strong>${safeName}</strong> asked about <strong>${safeTitle}</strong> in ${escapeHtml(property.city)}.</p>
              <p>${safeEmail}<br/>${safePhone}</p>
              <p>${safeMessage}</p>${safeLink}`,
          }),
        });
        notificationSent = true;
      } catch (mailError) {
        console.error("Guest enquiry saved, but support email notification failed:", mailError);
      }
    }

    return NextResponse.json({ success: true, notificationSent }, { status: 201 });
  } catch (error) {
    console.error("Error creating Supabase support enquiry:", error);
    return NextResponse.json({ error: "Unable to submit your question." }, { status: 500 });
  }
}
