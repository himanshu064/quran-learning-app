"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./database";
import { auditLog } from "@/db/schema";

/**
 * Logs admin sign-out to the audit log before signing out.
 * Called from server actions (dashboard sign-out button).
 */
export async function signOutWithAudit() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (session?.user) {
    const role = (session.user as { role?: string }).role;

    if (role === "admin") {
      await db.insert(auditLog).values({
        userId: session.user.id,
        action: "logout",
        actionCategory: "logout",
        entityType: "session",
        entityName: session.user.email,
        status: "success",
        ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
        userAgent: headersList.get("user-agent") ?? undefined,
        description: `Admin ${session.user.email} signed out`,
      });
    }
  }

  await auth.api.signOut({ headers: headersList });
}
