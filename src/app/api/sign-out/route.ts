import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
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
