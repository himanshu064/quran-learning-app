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
import { useLanguage } from "@/providers";

function useBreadcrumbs() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [
    { label: t("nav.dashboard"), href: "/admin" },
  ];

  if (segments[1] === "users") {
    crumbs.push({ label: t("nav.users"), href: "/admin/users" });
    if (segments[2]) {
      crumbs.push({ label: t("userDetail.profile") });
    }
  } else if (segments[1] === "settings") {
    crumbs.push({ label: t("nav.settings") });
  }

  return crumbs;
}

export function AdminTopbar() {
  const crumbs = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={`${crumb.label}-${i}`} className="contents">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
