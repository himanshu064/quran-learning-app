import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import {
  account,
  session,
  user,
  verification,
} from "@/db/auth-schema";
import { db } from "./database";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user: u, url }) => {
      await sendVerificationEmail({
        to: u.email,
        name: u.name,
        verifyUrl: url,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user: u, url }) => {
      await sendPasswordResetEmail({
        to: u.email,
        name: u.name,
        resetUrl: url,
      });
    },
    resetPasswordTokenExpiresIn: 60 * 15,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, returned: true },
      role: {
        type: "string",
        defaultValue: "user",
        returned: true,
        input: false,
      },
      status: {
        type: "string",
        defaultValue: "active",
        returned: true,
        input: false,
      },
      statusReason: {
        type: "string",
        required: false,
        returned: true,
        input: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        returned: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const userId = session.userId;

          // Update lastLoginAt
          await db
            .update(user)
            .set({ lastLoginAt: new Date() })
            .where(eq(user.id, userId));

          // Audit logging will be added in Milestone 3
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session & {
  user: typeof auth.$Infer.Session.user & {
    role: string;
    status: string;
    statusReason?: string;
    lastLoginAt?: Date;
    phone?: string;
  };
};
