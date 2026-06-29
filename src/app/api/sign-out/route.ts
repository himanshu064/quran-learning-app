import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { auditLog } from "@/db/schema";

export async function POST(request: Request) {
  // Try to get session for audit logging before sign-out
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (session?.user) {
      const role = (session.user as { role?: string }).role;

      // Audit log for admin sign-out
      if (role === "admin") {
        await db.insert(auditLog).values({
          userId: session.user.id,
          action: "logout",
          actionCategory: "logout",
          entityType: "session",
          entityName: session.user.email,
          status: "success",
          ipAddress: request.headers.get("x-forwarded-for") ?? "unknown",
          userAgent: request.headers.get("user-agent") ?? undefined,
          description: `Admin ${session.user.email} signed out`,
        });
      }
    }
  } catch {
    // Ignore — session might already be invalid
  }

  // Sign out via better-auth API
  try {
    await auth.api.signOut({ headers: request.headers });
  } catch {
    // Ignore errors
  }

  // Build response that forcefully clears ALL better-auth cookies
  const response = NextResponse.json({ success: true });

  const cookiesToClear = [
    "better-auth.session_token",
    "better-auth.session_data",
    "__Secure-better-auth.session_token",
    "__Secure-better-auth.session_data",
  ];

  for (const name of cookiesToClear) {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
}
