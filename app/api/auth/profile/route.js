import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { adminAuth } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const firebaseUser = await getAuthenticatedUser(req);
    if (!firebaseUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await dbConnect();
    const profile = await User.findOne({ uid: firebaseUser.uid });
    if (!profile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    return NextResponse.json({ error: "Failed to load user profile." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const firebaseUser = await getAuthenticatedUser(req);
    if (!firebaseUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const payload = await req.json();
    if (!["guest", "host"].includes(payload?.role)) {
      return NextResponse.json({ error: "Choose a valid account role." }, { status: 400 });
    }

    await dbConnect();
    const profile = await User.findOneAndUpdate(
      { uid: firebaseUser.uid },
      { role: payload.role },
      { new: true, runValidators: true }
    );
    if (!profile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
