import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const status = (session.user as { status?: string }).status;
    // Let suspended/banned users stay on auth pages (e.g. /auth/suspended)
    if (status === "active") {
      // redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
      redirect("/dashboard");
    }
  }
  return <>{children}</>;
}
