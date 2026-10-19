import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Property } from "@/lib/models";
import { getAdminUser } from "@/lib/adminAuth";

export async function PATCH(req, { params }) {
  if (!process.env.ADMIN_EMAILS) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid property ID." }, { status: 400 });
  }

  try {
    const { action, notes = "" } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    }
    if (typeof notes !== "string" || notes.length > 2000) {
      return NextResponse.json({ error: "Review notes must be under 2,000 characters." }, { status: 400 });
    }
    if (action === "reject" && !notes.trim()) {
      return NextResponse.json({ error: "Add an improvement note before rejecting a listing." }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findByIdAndUpdate(
      params.id,
      {
        verificationStatus: action === "approve" ? "approved" : "rejected",
        verificationNotes: notes.trim(),
        status: action === "approve" ? "active" : "rejected",
        reviewedAt: new Date(),
        reviewedBy: admin.email,
      },
      { new: true, runValidators: true }
    );
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("Error reviewing property:", error);
    return NextResponse.json({ error: "Unable to update the property review." }, { status: 500 });
  }
}
