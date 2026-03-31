import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Account Suspended" };
import { AuthCardHeader } from "@/components/auth/AuthCardHeader";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CardContent } from "@/components/ui/card";
import { getSetting } from "@/lib/settings";
import { SignOutButton } from "./sign-out-button";

export default async function SuspendedPage() {
  const supportEmail = await getSetting("support_email");

  return (
    <AuthLayout>
      <AuthCard>
        <AuthCardHeader
          title="Account suspended"
          description="Your account has been suspended by an administrator."
        />
        <CardContent className="grid gap-4">
          {supportEmail && (
            <p className="text-sm text-muted-foreground">
              If you believe this is a mistake, please contact{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="underline underline-offset-4"
              >
                {supportEmail}
              </a>
            </p>
          )}
          {!supportEmail && (
            <p className="text-sm text-muted-foreground">
              If you believe this is a mistake, please contact support.
            </p>
          )}
          <SignOutButton />
        </CardContent>
      </AuthCard>
    </AuthLayout>
  );
}
