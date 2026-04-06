"use client";

import {
  Users,
  BarChart3,
  Shield,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/providers";

export function AdminDashboard() {
  const { language } = useLanguage();

  const placeholderCards = [
    {
      title: language === "ar" ? "المستخدمون المسجلون" : "Registered Users",
      description: language === "ar" ? "عرض وإدارة المستخدمين" : "View and manage users",
      icon: Users,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
    {
      title: language === "ar" ? "التحليلات" : "Analytics",
      description: language === "ar" ? "إحصائيات المنصة" : "Platform statistics",
      icon: BarChart3,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      title: language === "ar" ? "إدارة الوصول" : "Access Management",
      description: language === "ar" ? "تفعيل/تعطيل وصول المستخدمين" : "Enable/disable user access",
      icon: Shield,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
    },
    {
      title: language === "ar" ? "تقدم المستخدمين" : "User Progress",
      description: language === "ar" ? "عرض تقدم كل مستخدم" : "View individual user progress",
      icon: Activity,
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {language === "ar" ? "لوحة تحكم المشرف" : "Admin Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "إدارة المستخدمين ومراقبة المنصة."
            : "Manage users and monitor the platform."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden py-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
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

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "قيد الإنشاء" : "Coming Soon"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? "سيتم تنفيذ لوحة تحكم المشرف بالكامل في المرحلة الثالثة."
              : "The full admin panel will be implemented in Milestone 3."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{language === "ar" ? "عرض المستخدمين المسجلين مع البحث والتصفية" : "View registered users with search and filter"}</li>
            <li>{language === "ar" ? "عرض تقدم كل مستخدم (الدروس المكتملة، نتائج الاختبارات)" : "View individual user progress (lessons completed, MCQ scores)"}</li>
            <li>{language === "ar" ? "تفعيل/تعطيل وصول المستخدمين" : "Enable/disable user access (revoke/restore login)"}</li>
            <li>{language === "ar" ? "عرض المستخدمين النشطين مقابل غير النشطين" : "View active vs inactive users"}</li>
            <li>{language === "ar" ? "التحليلات الأساسية" : "Basic analytics dashboard"}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
