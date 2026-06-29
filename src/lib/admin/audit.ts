import { db } from "@/lib/database";
import { auditLog, type NewAuditLog } from "@/db/schema";

export async function logAuditEvent(
  params: Omit<NewAuditLog, "id" | "createdAt">,
) {
  await db.insert(auditLog).values(params);
}
