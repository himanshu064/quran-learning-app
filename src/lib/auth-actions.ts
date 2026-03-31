"use server";

import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Signs the user out.
 */
export async function signOutWithAudit() {
  const headersList = await headers();
  await auth.api.signOut({ headers: headersList });
}
