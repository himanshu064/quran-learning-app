import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Under Maintenance" };
import { AuthCardHeader } from "@/components/auth/AuthCardHeader";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CardContent } from "@/components/ui/card";
import { getSetting } from "@/lib/settings";

export default async function MaintenancePage() {
  const supportEmail = await getSetting("support_email");

  return (
    <AuthLayout>
      <AuthCard>
        <AuthCardHeader
          title="Under Maintenance"
          description="The application is currently undergoing maintenance. Please check back shortly."
        />
        <CardContent>
          {supportEmail && (
            <p className="text-sm text-muted-foreground">
              For questions, contact{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="underline underline-offset-4"
              >
                {supportEmail}
              </a>
            </p>
          )}
        </CardContent>
      </AuthCard>
    </AuthLayout>
  );
}
