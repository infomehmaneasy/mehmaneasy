import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Otp } from "@/lib/models";
import nodemailer from "nodemailer";
import crypto from "crypto";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function brandedEmail({ title, bodyHtml }) {
  return `
  <div style="font-family:Arial,sans-serif;background:#0E2529;padding:32px;">
     <div style="max-width:480px;margin:0 auto;background:#FBF8F0;border-radius:14px;overflow:hidden;">
       <div style="background:#0E2529;padding:20px 24px;">
         <span style="color:#E3C687;font-size:18px;font-weight:700;">EV</span>
       </div>
       <div style="padding:24px;color:#0E2529;">
         <h2 style="margin:0 0 12px;">${title}</h2>
         ${bodyHtml}
       </div>
     </div>
   </div>`;
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
    if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: "Email verification is not configured. Please contact the site administrator." },
        { status: 503 }
      );
    }

    await dbConnect();
    const now = new Date();
    const existing = await Otp.findOne({ email: cleanEmail });
    if (existing && now.getTime() - existing.requestedAt.getTime() < 60_000) {
      return NextResponse.json(
        { error: "Please wait before requesting another verification code." },
        { status: 429 }
      );
    }
    const requestWindowStart = existing?.requestWindowStart || now;
    const windowIsActive = now.getTime() - requestWindowStart.getTime() < 15 * 60_000;
    const requestCount = windowIsActive ? (existing?.requestCount || 0) + 1 : 1;
    if (requestCount > 3) {
      return NextResponse.json(
        { error: "Too many verification requests. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const code = String(crypto.randomInt(100000, 1000000));
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      {
        codeHash: hashCode(code),
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        attempts: 0,
        requestedAt: now,
        requestWindowStart: windowIsActive ? requestWindowStart : now,
        requestCount,
      },
      { upsert: true, new: true }
    );

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_EMAIL, pass: GMAIL_APP_PASSWORD },
      });

      await transporter.sendMail({
        from: `EV <${GMAIL_EMAIL}>`,
        to: cleanEmail,
        subject: "Your EV verification code",
        html: brandedEmail({
          title: "Verify your email",
          bodyHtml: `
            <p>Your boarding code is:</p>
            <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#0E2529;">${code}</p>
            <p style="color:#5a5a5a;font-size:13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          `,
        }),
      });
    } catch (mailError) {
      console.error("Unable to send email verification code:", mailError);
      return NextResponse.json({ error: "Unable to send a verification email right now." }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP." }, { status: 500 });
  }
}
