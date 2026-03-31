/**
 * Email Provider Abstraction
 *
 * Supports 2 providers + console fallback, selected via EMAIL_PROVIDER env var:
 *   - "resend"  → Resend API (RESEND_API_KEY)
 *   - "emailjs" → EmailJS REST API (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY)
 *   - "console" → Logs to console (default in development)
 *
 * If EMAIL_PROVIDER is not set, auto-detects from available env keys.
 * Falls back to "console" if no provider is configured.
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SendResult = { success: boolean; error?: string };

// ---------- Resend ----------

async function sendViaResend(payload: EmailPayload): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY not set" };

  const from = process.env.EMAIL_FROM || "noreply@example.com";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, error: `Resend error: ${res.status} ${body}` };
  }

  return { success: true };
}

// ---------- EmailJS ----------

async function sendViaEmailJS(payload: EmailPayload): Promise<SendResult> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return { success: false, error: "EmailJS env vars not set" };
  }

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: payload.to,
        subject: payload.subject,
        html_content: payload.html,
        message: payload.text || "",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, error: `EmailJS error: ${res.status} ${body}` };
  }

  return { success: true };
}

// ---------- Console (Development) ----------

async function sendViaConsole(payload: EmailPayload): Promise<SendResult> {
  console.log("──────────────────────────────────────");
  console.log(`[Email] To: ${payload.to}`);
  console.log(`[Email] Subject: ${payload.subject}`);
  console.log(`[Email] Body:\n${payload.text || payload.html}`);
  console.log("──────────────────────────────────────");
  return { success: true };
}

// ---------- Provider Resolution ----------

type Provider = "resend" | "emailjs" | "console";

function resolveProvider(): Provider {
  const explicit = process.env.EMAIL_PROVIDER as Provider | undefined;
  if (explicit && ["resend", "emailjs", "console"].includes(explicit)) {
    return explicit;
  }

  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.EMAILJS_SERVICE_ID) return "emailjs";

  return "console";
}

const providerMap: Record<Provider, (payload: EmailPayload) => Promise<SendResult>> = {
  resend: sendViaResend,
  emailjs: sendViaEmailJS,
  console: sendViaConsole,
};

/**
 * Send an email using the configured provider.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const provider = resolveProvider();
  console.log(`[Email] Provider: ${provider} | To: ${payload.to} | Subject: ${payload.subject}`);

  const sender = providerMap[provider];
  const result = await sender(payload);

  if (result.success) {
    console.log(`[Email] Sent successfully via ${provider}`);
  } else {
    console.error(`[Email] Failed via ${provider}: ${result.error}`);
  }

  return result;
}

/**
 * Returns the currently active email provider name (for diagnostics).
 */
export function getActiveProvider(): string {
  return resolveProvider();
}
