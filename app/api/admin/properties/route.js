import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Property } from "@/lib/models";
import { getAdminUser } from "@/lib/adminAuth";

export async function GET(req) {
  if (!process.env.ADMIN_EMAILS) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    await dbConnect();
    const properties = await Property.find({
      status: { $in: ["pending_review", "active"] },
      $or: [
        { verificationStatus: "pending" },
        { verificationStatus: { $exists: false } },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Error loading property verification queue:", error);
    return NextResponse.json(
      { error: "Unable to load the property verification queue." },
      { status: 500 }
    );
  }
}
