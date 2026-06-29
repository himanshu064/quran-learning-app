"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toggleUserStatus } from "@/lib/admin/actions";
import { useLanguage } from "@/providers";

export function AccessToggle({
  userId,
  currentStatus,
  userName,
}: {
  userId: string;
  currentStatus: string;
  userName: string;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isSuspended = currentStatus !== "active";

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newStatus = isSuspended ? "active" : "suspended";
      await toggleUserStatus(userId, newStatus, reason || undefined);
      toast.success(
        isSuspended
          ? `${userName}'s access has been restored`
          : `${userName}'s account has been suspended`,
      );
      setReason("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isSuspended
          ? `${userName}${t("userDetail.suspendedMsg")}`
          : `${userName}${t("userDetail.activeMsg")}`}
      </p>

      {!isSuspended && (
        <div className="space-y-2">
          <Label htmlFor="reason">{t("userDetail.reasonLabel")}</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("userDetail.reasonPlaceholder")}
          />
        </div>
      )}

      <Button
        variant={isSuspended ? "default" : "destructive"}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading
          ? t("userDetail.updating")
          : isSuspended
            ? t("userDetail.restoreAccess")
            : t("userDetail.suspendUser")}
      </Button>
    </div>
  );
}
