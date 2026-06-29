"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/providers";
import { getLessonConfig } from "@/lib/quran/lesson-config";

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  completedLessons: number;
  lessonCompletionRates: { lessonId: string; count: number }[];
  recentRegistrations: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }[];
};

// Legacy lessonId → dictionary key. Older builds saved the dedicated Letters
// practice under "letters"; current code uses lesson ids. Maps stale rows to a
// readable label without merging their completion counts.
const LEGACY_LESSON_LABELS: Record<string, string> = {
  letters: "nav.letters",
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

export function DashboardContent({ stats }: { stats: DashboardStats }) {
  const { t, language } = useLanguage();

  // Resolve a human-readable lesson name. Prefer the translated dictionary
  // entry (clean short names for lesson1–lesson9); fall back to the lesson
  // config label for the remaining lessons; map known legacy ids (e.g. the old
  // "letters" practice id) to their dictionary label, and only then fall back
  // to the raw id so a missing key never leaks into the UI.
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

  const statCards = [
    {
      title: t("dashboard.totalUsers"),
      value: stats.totalUsers,
      description: t("dashboard.totalUsersDesc"),
      icon: Users,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
    {
      title: t("dashboard.activeUsers"),
      value: stats.activeUsers,
      description: t("dashboard.activeUsersDesc"),
      icon: UserCheck,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      title: t("dashboard.suspended"),
      value: stats.suspendedUsers,
      description: t("dashboard.suspendedDesc"),
      icon: UserX,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
    },
    {
      title: t("dashboard.lessonsCompleted"),
      value: stats.completedLessons,
      description: t("dashboard.lessonsCompletedDesc"),
      icon: BookOpen,
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden py-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.lessonCompletion")}</CardTitle>
              <CardDescription>
                {t("dashboard.lessonCompletionDesc")}
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.lessonCompletionRates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.noCompletions")}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {t("dashboard.noCompletionsDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.lessonCompletionRates.map((lesson) => {
                  const percentage =
                    stats.totalUsers > 0
                      ? Math.round((lesson.count / stats.totalUsers) * 100)
                      : 0;
                  return (
                    <div key={lesson.lessonId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {lessonName(lesson.lessonId)}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {lesson.count}{" "}
                          <span className="text-xs">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.recentRegistrations")}</CardTitle>
              <CardDescription>
                {t("dashboard.recentRegistrationsDesc")}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">
                {t("common.viewAll")}
                <ArrowUpRight className="ms-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.noUsers")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentRegistrations.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      <p className="truncate text-sm font-medium leading-none">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusColor(u.status)}`}
                      >
                        {t(`status.${u.status}`)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
