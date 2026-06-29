"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/database";
import { auth } from "@/lib/auth";
import { user, session } from "@/db/auth-schema";
import { siteSetting } from "@/db/schema";
import { logAuditEvent } from "./audit";
import {
  sendAccountSuspendedEmail,
  sendAccountRestoredEmail,
} from "@/lib/email";
import { getSetting } from "@/lib/settings";

async function getAdminSession() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) throw new Error("Not authenticated");
  const role = (s.user as { role?: string }).role;
  if (role !== "admin") throw new Error("Not authorized");
  return s;
}

export async function toggleUserStatus(
  userId: string,
  newStatus: "active" | "suspended" | "banned",
  reason?: string,
) {
  const adminSession = await getAdminSession();
  const headersList = await headers();

  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId));
  if (!targetUser) throw new Error("User not found");

  const oldStatus = targetUser.status;

  await db
    .update(user)
    .set({
      status: newStatus,
      statusReason: reason ?? null,
    })
    .where(eq(user.id, userId));

  // Invalidate all sessions if suspending/banning
  if (newStatus !== "active") {
    await db.delete(session).where(eq(session.userId, userId));
  }

  const action =
    newStatus === "active" ? "restore_user" : `${newStatus}_user`;
  const actionCategory = newStatus === "active" ? "approve" : "reject";

  await logAuditEvent({
    userId: adminSession.user.id,
    action,
    actionCategory,
    entityType: "user",
    entityName: targetUser.email,
    changes: { status: { from: oldStatus, to: newStatus } },
    status: "success",
    ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
    userAgent: headersList.get("user-agent") ?? undefined,
    description: `Admin ${actionCategory === "approve" ? "restored" : newStatus} user ${targetUser.email}${reason ? `: ${reason}` : ""}`,
  });

  // Send notification email (fire-and-forget — don't block the action)
  if (newStatus === "active") {
    sendAccountRestoredEmail({
      to: targetUser.email,
      name: targetUser.name,
    }).catch(() => {});
  } else {
    const supportEmail = await getSetting("support_email");
    sendAccountSuspendedEmail({
      to: targetUser.email,
      name: targetUser.name,
      reason,
      supportEmail: supportEmail || undefined,
    }).catch(() => {});
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateSiteSetting(
  settingId: string,
  newValue: string,
) {
  const adminSession = await getAdminSession();
  const headersList = await headers();

  const [existing] = await db
    .select()
    .from(siteSetting)
    .where(eq(siteSetting.id, settingId));
  if (!existing) throw new Error("Setting not found");

  const oldValue = existing.value;

  await db
    .update(siteSetting)
    .set({
      value: newValue,
      updatedBy: adminSession.user.id,
    })
    .where(eq(siteSetting.id, settingId));

  await logAuditEvent({
    userId: adminSession.user.id,
    action: "update_setting",
    actionCategory: "update",
    entityType: "site_setting",
    entityName: existing.key,
    changes: { value: { from: oldValue, to: newValue } },
    status: "success",
    ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
    userAgent: headersList.get("user-agent") ?? undefined,
    description: `Updated setting "${existing.key}" from "${oldValue}" to "${newValue}"`,
  });

  revalidatePath("/admin/settings");
}

export async function saveAllSettings(
  changes: { id: string; value: string }[],
) {
  const adminSession = await getAdminSession();
  const headersList = await headers();

  for (const change of changes) {
    const [existing] = await db
      .select()
      .from(siteSetting)
      .where(eq(siteSetting.id, change.id));
    if (!existing) continue;

    const oldValue = existing.value;

    await db
      .update(siteSetting)
      .set({
        value: change.value,
        updatedBy: adminSession.user.id,
      })
      .where(eq(siteSetting.id, change.id));

    await logAuditEvent({
      userId: adminSession.user.id,
      action: "update_setting",
      actionCategory: "update",
      entityType: "site_setting",
      entityName: existing.key,
      changes: { value: { from: oldValue, to: change.value } },
      status: "success",
      ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
      userAgent: headersList.get("user-agent") ?? undefined,
      description: `Updated setting "${existing.key}" from "${oldValue}" to "${change.value}"`,
    });
  }

  revalidatePath("/admin/settings");
}

const DEFAULT_SETTINGS: Record<string, string> = {
  maintenance_mode: "false",
  app_name: "Quran Learning",
  default_language: "ar",
  default_theme: "dark",
  registration_enabled: "true",
  max_mcq_attempts: "2",
  reciter: "husary",
  support_email: "",
  announcement: "",
};

export async function resetAllSettings() {
  const adminSession = await getAdminSession();
  const headersList = await headers();

  const allSettings = await db.select().from(siteSetting);

  for (const setting of allSettings) {
    const defaultValue = DEFAULT_SETTINGS[setting.key];
    if (defaultValue === undefined) continue;
    if (setting.value === defaultValue) continue;

    const oldValue = setting.value;

    await db
      .update(siteSetting)
      .set({
        value: defaultValue,
        updatedBy: adminSession.user.id,
      })
      .where(eq(siteSetting.id, setting.id));

    await logAuditEvent({
      userId: adminSession.user.id,
      action: "reset_setting",
      actionCategory: "update",
      entityType: "site_setting",
      entityName: setting.key,
      changes: { value: { from: oldValue, to: defaultValue } },
      status: "success",
      ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
      userAgent: headersList.get("user-agent") ?? undefined,
      description: `Reset setting "${setting.key}" from "${oldValue}" to default "${defaultValue}"`,
    });
  }

  revalidatePath("/admin/settings");
}
