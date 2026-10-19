import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Otp, User } from "@/lib/models";
import { adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req) {
  try {
    await dbConnect();
    const { email, code, registrationData } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanCode = typeof code === "string" ? code.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const otpDoc = await Otp.findOne({ email: cleanEmail });
    if (!otpDoc) {
      return NextResponse.json({ error: "No code found — request a new one." }, { status: 404 });
    }

    if (otpDoc.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    if (Date.now() > otpDoc.expiresAt.getTime()) {
      return NextResponse.json({ error: "Code expired — request a new one." }, { status: 400 });
    }

    if (hashCode(cleanCode) !== otpDoc.codeHash) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
    }

    // OTP is valid! Delete the OTP doc so it cannot be reused.
    await Otp.deleteOne({ email: cleanEmail });

    // Now check if a user is logging in or completing registration.
    // If registrationData is provided, we perform registration.
    if (registrationData) {
      const { name, password, phone, place, pincode, role = "guest" } = registrationData;
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 100 ||
        typeof password !== "string" ||
        password.length < 6 ||
        password.length > 128 ||
        !["guest", "host"].includes(role)
      ) {
        return NextResponse.json({ error: "Registration details are invalid." }, { status: 400 });
      }
      let firebaseUser = null;
      let userDocCreated = false;

      try {
        // Step 1: Create Firebase Auth user
        firebaseUser = await adminAuth.createUser({
          email: cleanEmail,
          password: password,
          displayName: name,
        });

        // Step 2: Write profile to MongoDB
        await User.create({
          uid: firebaseUser.uid,
          name,
          email: cleanEmail,
          phone,
          place,
          pincode,
          verified: true,
          role,
        });
        userDocCreated = true;

        return NextResponse.json({ verified: true, uid: firebaseUser.uid });
      } catch (err) {
        // Rollback transaction manually: if Firebase user was created but MongoDB failed, delete Firebase User
        if (firebaseUser && !userDocCreated) {
          try {
            await adminAuth.deleteUser(firebaseUser.uid);
          } catch (delErr) {
            console.error("Critical rollback error: failed to delete Firebase Auth user", delErr);
          }
        }
        return NextResponse.json({ error: err.message || "Registration failed." }, { status: 500 });
      }
    }

    // If no registrationData, we are doing a simpler validation (e.g. verifying an existing user or buyer OTP)
    // Find the user if they exist
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      existingUser.verified = true;
      await existingUser.save();
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: error.message || "Verification failed." }, { status: 500 });
  }
}
