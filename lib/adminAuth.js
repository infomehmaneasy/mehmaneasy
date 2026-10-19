import { adminAuth } from "@/lib/firebaseAdmin";

export async function getAdminUser(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const user = await adminAuth.verifyIdToken(authHeader.slice(7));
    const allowedEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (!user.email || !user.email_verified || !allowedEmails.includes(user.email.toLowerCase())) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
