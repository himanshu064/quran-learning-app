"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  Trophy,
  Play,
  Bookmark,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage, useLessonContext } from "@/providers";
import { useProgress } from "@/hooks";
import { getAvailableLessons } from "@/lib/quran";

export function UserDashboard() {
  const { language, t } = useLanguage();
  const { setLesson } = useLessonContext();
  const { progress, settings, completedCount, getLessonProgress } = useProgress();

  const lessons = getAvailableLessons();
  const totalLessons = lessons.length;
  const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Determine which lesson to resume: if lastLesson is completed, find the next incomplete one
  const resumeLesson = (() => {
    if (!settings?.lastLesson) return null;
    const lastLp = getLessonProgress(settings.lastLesson);
    if (!lastLp?.completed) return settings.lastLesson;
    // Last lesson is done — find the first incomplete lesson
    const nextIncomplete = lessons.find((l) => !getLessonProgress(l.id)?.completed);
    return nextIncomplete?.id ?? null;
  })();
  const resumeLessonConfig = resumeLesson
    ? lessons.find((l) => l.id === resumeLesson)
    : null;

  const statCards = [
    {
      title: language === "ar" ? "الدروس المكتملة" : "Lessons Completed",
      value: `${completedCount} / ${totalLessons}`,
      description: language === "ar" ? "من الدروس المتاحة" : "of available lessons",
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      title: language === "ar" ? "التقدم العام" : "Overall Progress",
      value: `${overallPercent}%`,
      description: language === "ar" ? "نسبة الإنجاز" : "completion rate",
      icon: TrendingUp,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
    {
      title: language === "ar" ? "نتائج الاختبارات" : "Quiz Scores",
      value: String(progress.filter((p) => p.mcqScore != null).length),
      description: language === "ar" ? "اختبارات مكتملة" : "quizzes completed",
      icon: Trophy,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
    },
    {
      title: language === "ar" ? "الدرس الحالي" : "Current Lesson",
      value: resumeLesson?.replace("lesson", "") || "—",
      description: language === "ar" ? "الدرس التالي" : "next lesson to complete",
      icon: GraduationCap,
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
          {language === "ar"
            ? "تتبع تقدمك في تعلّم القرآن."
            : "Track your Quran learning progress."}
        </p>
      </div>

      {/* Stat cards */}
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
        {/* Resume & Quick Actions + Quiz Scores */}
        <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "المتابعة" : "Resume"}
            </CardTitle>
            <CardDescription>
              {language === "ar"
                ? "أكمل من حيث توقفت"
                : "Continue from where you stopped"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Continue reading */}
            {settings?.lastReadSurah && (
              <Link
                href={`/reader?surah=${settings.lastReadSurah}&ayah=${settings.lastReadAyah ?? 1}`}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="h-4 w-4 ms-0.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {language === "ar" ? "متابعة القراءة" : "Continue Reading"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar"
                      ? `سورة ${settings.lastReadSurah} · آية ${settings.lastReadAyah ?? 1}`
                      : `Surah ${settings.lastReadSurah} · Ayah ${settings.lastReadAyah ?? 1}`}
                  </p>
                </div>
              </Link>
            )}

            {/* Resume lesson */}
            {resumeLesson && resumeLessonConfig && (
              <Link
                href={resumeLesson === "lesson2" ? "/letters" : "/teaching"}
                onClick={() => setLesson(resumeLesson)}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {language === "ar" ? "متابعة الدرس" : "Resume Lesson"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar" ? resumeLessonConfig.labelAr : resumeLessonConfig.labelEn}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  {language === "ar" ? "متابعة" : "Continue"}
                </Button>
              </Link>
            )}

            {!settings?.lastReadSurah && !resumeLesson && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "ابدأ رحلتك في تعلّم القرآن"
                    : "Start your Quran learning journey"}
                </p>
                <Button asChild>
                  <Link href="/surahs">
                    {language === "ar" ? "ابدأ الآن" : "Get Started"}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Scores */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "نتائج الاختبارات" : "Quiz Scores"}
            </CardTitle>
            <CardDescription>
              {language === "ar"
                ? "درجاتك في اختبارات الاستماع"
                : "Your listening quiz results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const quizResults = lessons
                .map((lesson) => ({
                  lesson,
                  lp: getLessonProgress(lesson.id),
                }))
                .filter(({ lp }) => lp?.mcqScore != null);

              if (quizResults.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <Trophy className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {language === "ar"
                        ? "لم تكمل أي اختبار بعد"
                        : "No quizzes completed yet"}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/mcq">
                        {language === "ar" ? "ابدأ اختبار" : "Take a Quiz"}
                      </Link>
                    </Button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {quizResults.map(({ lesson, lp }) => {
                    const score = lp!.mcqScore!;
                    const total = lp!.mcqTotal ?? 0;
                    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            percent >= 80
                              ? "bg-emerald-500/15 text-emerald-500"
                              : percent >= 50
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-red-500/15 text-red-500",
                          )}
                        >
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">
                            {language === "ar" ? lesson.labelAr : lesson.labelEn}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Progress value={percent} className="h-1.5 flex-1" />
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {percent}%
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums">
                          {score}/{total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
        </div>

        {/* Lesson Progress */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {language === "ar" ? "تقدم الدروس" : "Lesson Progress"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "حالة كل درس"
                  : "Status of each lesson"}
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const lp = getLessonProgress(lesson.id);
                const lessonHref = lesson.id === "lesson2" ? "/letters" : "/teaching";
                return (
                  <Link
                    key={lesson.id}
                    href={lessonHref}
                    onClick={() => setLesson(lesson.id)}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    {lp?.completed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-sm">
                      {language === "ar" ? lesson.labelAr : lesson.labelEn}
                    </span>
                    {lp && !lp.completed && lp.slideIndex > 0 && (
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {language === "ar" ? `شريحة ${lp.slideIndex}` : `Slide ${lp.slideIndex}`}
                      </Badge>
                    )}
                    {lp?.mcqScore != null && (
                      <Badge variant="outline" className="text-[10px]">
                        MCQ: {lp.mcqScore}/{lp.mcqTotal}
                      </Badge>
                    )}
                    {lp?.completed && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-[10px] text-emerald-500"
                      >
                        {language === "ar" ? "مكتمل" : "Done"}
                      </Badge>
                    )}
                    {lp && !lp.completed && (
                      <Badge variant="secondary" className="text-[10px]">
                        {language === "ar" ? "قيد التقدم" : "In progress"}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
