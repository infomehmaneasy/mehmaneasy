import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Enquiry } from "@/lib/models";
import { getAdminUser } from "@/lib/adminAuth";

async function authorize(req) {
  if (!process.env.ADMIN_EMAILS) {
    return { response: NextResponse.json({ error: "Admin access is not configured." }, { status: 503 }) };
  }
  const admin = await getAdminUser(req);
  if (!admin) {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return { admin };
}

export async function GET(req) {
  const authorization = await authorize(req);
  if (authorization.response) return authorization.response;
  if (!process.env.SUPPORT_EMAIL?.trim()) {
    return NextResponse.json({ error: "Guest support is not configured." }, { status: 503 });
  }

  try {
    await dbConnect();
    const enquiries = await Enquiry.find({
      recipientEmail: process.env.SUPPORT_EMAIL?.trim(),
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

export async function PATCH(req) {
  const authorization = await authorize(req);
  if (authorization.response) return authorization.response;
  if (!process.env.SUPPORT_EMAIL?.trim()) {
    return NextResponse.json({ error: "Guest support is not configured." }, { status: 503 });
  }

  try {
    const { enquiryId } = await req.json();
    if (!mongoose.isValidObjectId(enquiryId)) {
      return NextResponse.json({ error: "Invalid enquiry ID." }, { status: 400 });
    }
    await dbConnect();
    const enquiry = await Enquiry.findOneAndUpdate(
      {
        _id: enquiryId,
        recipientEmail: process.env.SUPPORT_EMAIL?.trim(),
      },
      { status: "reviewed" },
      { new: true, runValidators: true }
    );
    if (!enquiry) {
      return NextResponse.json({ error: "Support enquiry not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating support enquiry:", error);
    return NextResponse.json({ error: "Unable to update support enquiry." }, { status: 500 });
  }
}
