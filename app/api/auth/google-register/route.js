import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    await dbConnect();
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const firebaseUser = await adminAuth.verifyIdToken(authHeader.slice(7));
    if (!firebaseUser.email || !firebaseUser.email_verified) {
      return NextResponse.json({ error: "A verified Google email is required." }, { status: 403 });
    }
    const { name, phone, role = "guest" } = await req.json();
    const email = firebaseUser.email.toLowerCase();

    if (
      !name ||
      name.length > 100 ||
      !["guest", "host"].includes(role)
    ) {
      return NextResponse.json({ error: "A valid display name is required." }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.uid !== firebaseUser.uid) {
        return NextResponse.json({ error: "This email is linked to a different account." }, { status: 409 });
      }
      return NextResponse.json({ success: true, message: "User already registered." });
    }

    const newUser = await User.create({
      uid: firebaseUser.uid,
      name,
      email,
      phone: typeof phone === "string" ? phone.slice(0, 25) : "Not provided",
      place: "Not provided",
      pincode: "000000",
      verified: true,
      role,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error creating Google user profile in Mongo:", error);
    return NextResponse.json({ error: error.message || "Failed to save profile." }, { status: 500 });
  }
}
