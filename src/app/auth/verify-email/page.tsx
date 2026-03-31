"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthCardHeader } from "@/components/auth/AuthCardHeader";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">(
    token ? "verifying" : "no-token",
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    // better-auth handles verification via the API route automatically
    // when the user clicks the email link. The link format is:
    // /api/auth/verify-email?token=xxx&callbackURL=/auth/verify-email?verified=true
    // So if we have a "verified" param, it was successful
    const verified = searchParams.get("verified");
    if (verified === "true") {
      setStatus("success");
      return;
    }

    // If we have a raw token, try to verify it
    (async () => {
      try {
        const { error } = await authClient.verifyEmail({ query: { token } });
        if (error) {
          setStatus("error");
        } else {
          setStatus("success");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [token, searchParams]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: searchParams.get("email") || "",
        callbackURL: "/auth/verify-email",
      });
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  if (status === "verifying") {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthCardHeader
            title="Verifying your email"
            description="Please wait while we verify your email address..."
          />
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout>
        <AuthCard>
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <div>
              <h2 className="text-xl font-semibold">Email verified!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your email has been verified successfully. You can now sign in.
              </p>
            </div>
            <Button
              className="w-full cursor-pointer"
              onClick={() => router.push("/auth/sign-in")}
            >
              Continue to Sign In
            </Button>
          </CardContent>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout>
        <AuthCard>
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <div>
              <h2 className="text-xl font-semibold">Verification failed</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This verification link is invalid or has expired.
              </p>
            </div>
            <div className="grid w-full gap-2">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => router.push("/auth/sign-in")}
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </AuthCard>
      </AuthLayout>
    );
  }

  // no-token — show "check your inbox" message (after sign-up redirect)
  return (
    <AuthLayout>
      <AuthCard>
        <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
          <Mail className="h-12 w-12 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ve sent a verification link to your email address. Click
              the link to verify your account.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <div className="grid w-full gap-2">
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={() => router.push("/auth/sign-in")}
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </AuthCard>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
