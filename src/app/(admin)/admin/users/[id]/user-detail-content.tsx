"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Globe,
  Palette,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/providers";
import { getLessonConfig } from "@/lib/quran/lesson-config";
import { AccessToggle } from "./access-toggle";

// Legacy lessonId → dictionary key (see dashboard-content for context).
const LEGACY_LESSON_LABELS: Record<string, string> = {
  letters: "nav.letters",
};
import type { UserSettings } from "@/db/schema";

type SerializedUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  statusReason: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type SerializedProgress = {
  id: string;
  lessonId: string;
  slideIndex: number;
  completed: boolean;
  completedAt: string | null;
  mcqScore: number | null;
  mcqTotal: number | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-500";
    case "suspended":
      return "bg-amber-500/15 text-amber-500";
    case "banned":
      return "bg-red-500/15 text-red-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function UserDetailContent({
  user,
  progress,
  settings,
}: {
  user: SerializedUser;
  progress: SerializedProgress[];
  settings: UserSettings | null;
}) {
  const { t, language } = useLanguage();
  const completedCount = progress.filter((p) => p.completed).length;

  // Resolve a human-readable lesson name with graceful fallbacks so a missing
  // dictionary key (e.g. lesson10+ or legacy "letters" rows) never leaks.
  const lessonName = (lessonId: string) => {
    const key = `lessons.${lessonId}`;
    const translated = t(key);
    if (translated !== key) return translated;
    const config = getLessonConfig(lessonId);
    if (config) return language === "ar" ? config.labelAr : config.labelEn;
    const legacyKey = LEGACY_LESSON_LABELS[lessonId];
    if (legacyKey) return t(legacyKey);
    return lessonId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">
                {user.name}
              </h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${getStatusColor(user.status)}`}
              >
                {t(`status.${user.status}`)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("userDetail.profile")}</CardTitle>
            <CardDescription>{t("userDetail.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Mail} label={t("users.email")} value={user.email} />
              <InfoItem
                icon={Phone}
                label={t("users.phone")}
                value={user.phone ?? "—"}
              />
              <InfoItem icon={Shield} label={t("userDetail.role")} value={user.role} />
              <InfoItem
                icon={Calendar}
                label={t("users.registered")}
                value={new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <InfoItem
                icon={Clock}
                label={t("userDetail.lastLogin")}
                value={
                  user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : t("userDetail.never")
                }
              />
              <InfoItem
                icon={BookOpen}
                label={t("userDetail.lessonProgress")}
                value={`${completedCount} ${t("userDetail.lessonsOf")}`}
              />
              {settings && (
                <>
                  <InfoItem
                    icon={Globe}
                    label={t("userDetail.language")}
                    value={settings.language === "ar" ? t("settings.arabic") : t("settings.english")}
                  />
                  <InfoItem
                    icon={Palette}
                    label={t("userDetail.theme")}
                    value={settings.theme === "dark" ? t("settings.dark") : t("settings.light")}
                  />
                </>
              )}
            </div>
            {user.statusReason && (
              <>
                <Separator className="my-4" />
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold uppercase text-amber-500">
                    {t("userDetail.statusReason")}
                  </p>
                  <p className="mt-1 text-sm">{user.statusReason}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("userDetail.accessManagement")}</CardTitle>
            <CardDescription>
              {t("userDetail.accessManagementDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccessToggle
              userId={user.id}
              currentStatus={user.status}
              userName={user.name}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("userDetail.lessonProgress")}</CardTitle>
              <CardDescription>
                {completedCount} {t("userDetail.lessonsOf")}
              </CardDescription>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {progress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("userDetail.noProgress")}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {t("userDetail.noProgressDesc")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.name")}</TableHead>
                  <TableHead>{t("userDetail.slideProgress")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("userDetail.mcqScore")}</TableHead>
                  <TableHead>{t("userDetail.completedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {lessonName(p.lessonId)}
                    </TableCell>
                    <TableCell>
                      <span className="tabular-nums text-muted-foreground">
                        {t("userDetail.slideProgress")} {p.slideIndex}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.completed ? (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {t("userDetail.completed")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {t("userDetail.inProgress")}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.mcqScore !== null ? (
                        <span className="tabular-nums font-medium">
                          {p.mcqScore}{" "}
                          <span className="text-muted-foreground">
                            / {p.mcqTotal}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.completedAt
                        ? new Date(p.completedAt).toLocaleDateString("en-US")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
