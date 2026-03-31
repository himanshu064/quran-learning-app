"use client";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const handleSignOut = async () => {
    await fetch("/api/sign-out", { method: "POST" }).catch(() => {});
    window.location.href = "/auth/sign-in";
  };

  return (
    <Button variant="outline" className="w-full cursor-pointer" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
