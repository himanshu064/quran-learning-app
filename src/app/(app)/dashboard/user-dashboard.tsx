"use client";

import {
  BookOpen,
  GraduationCap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/providers";

export function UserDashboard() {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "مرحبًا بك في تطبيق تعلّم القرآن."
            : "Welcome to the Quran Learning App."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "ابدأ رحلتك" : "Start Your Journey"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? "سيتم إضافة الدروس والتمارين قريبًا"
              : "Lessons and exercises coming soon"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {language === "ar"
                  ? "حسابك جاهز!"
                  : "Your account is ready!"}
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                {language === "ar"
                  ? "تم إعداد حسابك بنجاح. ستتمكن قريبًا من الوصول إلى دروس القرآن والتمارين التفاعلية."
                  : "Your account has been set up successfully. You'll soon have access to Quran lessons and interactive exercises."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
