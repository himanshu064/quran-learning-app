"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle, LanguageToggle } from "@/components/common";
import { LessonSelector } from "@/components/app/LessonSelector";
import { useLanguage } from "@/providers";

const ROUTE_LABELS: Record<string, { key: string }> = {
  "/dashboard": { key: "nav.dashboard" },
  "/surahs": { key: "nav.surahs" },
  "/reader": { key: "nav.reader" },
  "/teaching": { key: "nav.teaching" },
  "/letters": { key: "nav.letters" },
  "/mcq": { key: "nav.mcq" },
  "/writing": { key: "nav.writing" },
  "/admin": { key: "nav.dashboard" },
};

export function UserTopbar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const route = Object.keys(ROUTE_LABELS).find((r) =>
    r === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(r),
  );
  const pageLabel = route ? t(ROUTE_LABELS[route].key) : "";
  // Only show lesson selector on screens that use lesson data
  const lessonScreens = ["/teaching", "/mcq", "/writing"];
  const showLessonSelector = lessonScreens.some((s) => pathname.startsWith(s));

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto flex items-center gap-2">
        {showLessonSelector && <LessonSelector />}
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
