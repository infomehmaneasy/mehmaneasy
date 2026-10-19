import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Enquiry, Property } from "@/lib/models";
import { getAdminUser } from "@/lib/adminAuth";
import nodemailer from "nodemailer";

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
      <div style="background:#20372f;padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:700;">Mehmaan Easy</span>
      </div>
      <div style="padding:24px;color:#24302b;">
        <h2 style="margin:0 0 12px;">${title}</h2>
        ${bodyHtml}
      </div>
    </div>
  </div>`;
}

export async function GET(req) {
  if (!process.env.SUPPORT_EMAIL?.trim()) {
    return NextResponse.json({ error: "Guest support is not configured." }, { status: 503 });
  }
  if (!process.env.ADMIN_EMAILS) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    await dbConnect();
    const enquiries = await Enquiry.find({
      recipientEmail: process.env.SUPPORT_EMAIL.trim(),
      status: "new",
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ enquiries });
  } catch (error) {
    console.error("Error loading support enquiries:", error);
    return NextResponse.json({ error: "Unable to load support enquiries." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL?.trim();
    if (!supportEmail) {
      return NextResponse.json(
        { error: "Guest support is not configured. Please contact the site administrator." },
        { status: 503 }
      );
    }

    const payload = await req.json();
    const buyerName = typeof payload.buyerName === "string" ? payload.buyerName.trim() : "";
    const buyerEmail = typeof payload.buyerEmail === "string" ? payload.buyerEmail.trim() : "";
    const buyerPhone = typeof payload.buyerPhone === "string" ? payload.buyerPhone.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (
      !mongoose.isValidObjectId(payload.propertyId) ||
      !buyerName ||
      buyerName.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) ||
      buyerEmail.length > 254 ||
      !/^[+\d()\s.-]{7,25}$/.test(buyerPhone) ||
      message.length > 2000
    ) {
      return NextResponse.json({ error: "Please provide valid contact details and enquiry text." }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findOne({
      _id: payload.propertyId,
      status: "active",
      verificationStatus: "approved",
    }).select("_id title city");
    if (!property) {
      return NextResponse.json({ error: "This stay is no longer available for enquiries." }, { status: 404 });
    }

    const propertyLink = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/property/${property.id}`
      : "";
    const enquiry = await Enquiry.create({
      propertyId: String(property._id),
      sellerEmail: supportEmail,
      recipientEmail: supportEmail,
      buyerName,
      buyerEmail,
      buyerPhone,
      message,
      propertyLink,
      propertyTitle: property.title,
      status: "new",
    });

    const mailUser = process.env.GMAIL_EMAIL;
    const mailPassword = process.env.GMAIL_APP_PASSWORD;
    let notificationSent = false;
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
          ? `<p><a href="${escapeHtml(propertyLink)}" style="color:#bd604a;">View stay details</a></p>`
          : "";

        await transporter.sendMail({
          from: `Mehmaan Easy <${mailUser}>`,
          to: supportEmail,
          replyTo: buyerEmail,
          subject: `Guest question about ${property.title}`,
          html: brandedEmail({
            title: "A guest has a question",
            bodyHtml: `
              <p><strong>${safeName}</strong> asked about <strong>${safeTitle}</strong> in ${escapeHtml(property.city)}.</p>
              <p>${safeEmail}<br/>${safePhone}</p>
              <p style="background:#f4f2ed;padding:12px;border-radius:8px;">${safeMessage}</p>
              ${safeLink}
            `,
          }),
        });
        notificationSent = true;
      } catch (mailError) {
        console.error("Guest enquiry saved, but support email notification failed:", mailError);
      }
    }

    return NextResponse.json(
      { success: true, enquiryId: enquiry.id, notificationSent },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating support enquiry:", error);
    return NextResponse.json(
      { error: error.message || "Unable to submit your question." },
      { status: 500 }
    );
  }
}
