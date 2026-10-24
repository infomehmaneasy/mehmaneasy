import { NextResponse } from "next/server";
import {
  createMaintenanceSession,
  isMaintenanceSessionValid,
  MAINTENANCE_COOKIE,
  verifyMaintenanceCredentials,
} from "@/lib/maintenanceAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function setSessionCookie(response, value, expiresAt) {
  response.cookies.set(MAINTENANCE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAt * 1000),
  });
}

export async function GET(req) {
  try {
    const authorized = isMaintenanceSessionValid(
      req.cookies.get(MAINTENANCE_COOKIE)?.value
    );
    return NextResponse.json({ authorized });
  } catch (error) {
    console.error("Unable to validate developer maintenance access:", error);
    return NextResponse.json(
      { error: "Developer maintenance access is not configured." },
      { status: 503 }
    );
  }
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!verifyMaintenanceCredentials(email, password)) {
      return NextResponse.json(
        { error: "Maintenance email or password is incorrect." },
        { status: 401 }
      );
    }
    const session = createMaintenanceSession();
    const response = NextResponse.json({ authorized: true });
    setSessionCookie(response, session.value, session.expiresAt);
    return response;
  } catch (error) {
    console.error("Unable to verify developer maintenance access:", error);
    return NextResponse.json(
      {
        error:
          error.message || "Developer maintenance access is not configured.",
      },
      { status: 503 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authorized: false });
  response.cookies.set(MAINTENANCE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
