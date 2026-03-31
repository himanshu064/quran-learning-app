/**
 * Email Trigger Functions
 *
 * All email-sending logic is defined here.
 * Each function builds the email content and calls sendEmail().
 * To add a new email type, add a function here — no other files need to change.
 */

import { sendEmail } from "./provider";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Quran Learning App";

// ---------- Password Reset ----------

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const { to, name, resetUrl } = params;

  return sendEmail({
    to,
    subject: `Reset your password — ${APP_NAME}`,
    text: `Hi ${name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Reset Your Password</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(resetUrl)}" style="background-color: #0f766e; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">This link expires in 15 minutes.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">— ${escapeHtml(APP_NAME)}</p>
      </div>
    `,
  });
}

// ---------- Welcome Email ----------

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}) {
  const { to, name } = params;
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/sign-in`;

  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    text: `Hi ${name},\n\nWelcome to ${APP_NAME}! Your account has been created successfully.\n\nYou can sign in at: ${loginUrl}\n\n— ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Welcome to ${escapeHtml(APP_NAME)}!</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your account has been created successfully. Start your Quran learning journey today.</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(loginUrl)}" style="background-color: #0f766e; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Sign In
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">— ${escapeHtml(APP_NAME)}</p>
      </div>
    `,
  });
}

// ---------- Account Suspended ----------

export async function sendAccountSuspendedEmail(params: {
  to: string;
  name: string;
  reason?: string;
  supportEmail?: string;
}) {
  const { to, name, reason, supportEmail } = params;

  const reasonLine = reason
    ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
    : "";
  const supportLine = supportEmail
    ? `<p>If you believe this is a mistake, contact us at <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>`
    : `<p>If you believe this is a mistake, please contact support.</p>`;

  return sendEmail({
    to,
    subject: `Account suspended — ${APP_NAME}`,
    text: `Hi ${name},\n\nYour ${APP_NAME} account has been suspended.${reason ? `\n\nReason: ${reason}` : ""}\n\n${supportEmail ? `Contact: ${supportEmail}` : "Please contact support."}\n\n— ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b91c1c;">Account Suspended</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your ${escapeHtml(APP_NAME)} account has been suspended by an administrator.</p>
        ${reasonLine}
        ${supportLine}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">— ${escapeHtml(APP_NAME)}</p>
      </div>
    `,
  });
}

// ---------- Account Restored ----------

export async function sendAccountRestoredEmail(params: {
  to: string;
  name: string;
}) {
  const { to, name } = params;
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/sign-in`;

  return sendEmail({
    to,
    subject: `Account restored — ${APP_NAME}`,
    text: `Hi ${name},\n\nYour ${APP_NAME} account has been restored. You can sign in again at: ${loginUrl}\n\n— ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Account Restored</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your ${escapeHtml(APP_NAME)} account has been restored. You can sign in again.</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(loginUrl)}" style="background-color: #0f766e; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Sign In
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">— ${escapeHtml(APP_NAME)}</p>
      </div>
    `,
  });
}

// ---------- Email Verification ----------

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const { to, name, verifyUrl } = params;

  return sendEmail({
    to,
    subject: `Verify your email — ${APP_NAME}`,
    text: `Hi ${name},\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.\n\n— ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Verify Your Email</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for signing up! Please verify your email address to get started.</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(verifyUrl)}" style="background-color: #0f766e; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">— ${escapeHtml(APP_NAME)}</p>
      </div>
    `,
  });
}

// ---------- Helpers ----------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
