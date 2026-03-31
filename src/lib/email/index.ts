export { sendEmail, getActiveProvider } from "./provider";
export type { EmailPayload } from "./provider";
export {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendAccountSuspendedEmail,
  sendAccountRestoredEmail,
} from "./triggers";
