import { auth } from "../lib/auth";
import { db } from "../lib/database";
import { user } from "../db/auth-schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin@123";
  const name = process.env.ADMIN_NAME || "Admin";

  // Check if user already exists
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existing) {
    console.log(`User ${email} already exists (id: ${existing.id})`);

    // Ensure role is admin
    if (existing.role !== "admin") {
      await db
        .update(user)
        .set({ role: "admin" })
        .where(eq(user.id, existing.id));
      console.log("Updated role to admin");
    } else {
      console.log("Already an admin, skipping");
    }
    process.exit(0);
  }

  // Create user via better-auth API (handles password hashing + account row)
  const ctx = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  if (!ctx?.user?.id) {
    console.error("Failed to create user");
    process.exit(1);
  }

  // Set role to admin
  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, ctx.user.id));

  console.log(`Admin user created: ${email} (id: ${ctx.user.id})`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
