"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BookText,
  GraduationCap,
  Languages,
  ListChecks,
  PenLine,
  LogOut,
  BookOpenCheck,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LessonSelector } from "@/components/app/LessonSelector";
import { useLanguage } from "@/providers";

const mainNav = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const learningNav = [
  { key: "nav.surahs", href: "/dashboard?tab=home", icon: BookOpen },
  { key: "nav.reader", href: "/dashboard?tab=reader", icon: BookText },
  { key: "nav.teaching", href: "/dashboard?tab=teaching", icon: GraduationCap },
  { key: "nav.letters", href: "/dashboard?tab=letters", icon: Languages },
  { key: "nav.mcq", href: "/dashboard?tab=mcq", icon: ListChecks },
  { key: "nav.writing", href: "/dashboard?tab=writing", icon: PenLine },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserSidebar({
  userName,
  userEmail,
  appName,
}: {
  userName: string;
  userEmail: string;
  appName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();
  const { t, direction } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" && !searchParams.get("tab");
    }
    if (href.startsWith("/dashboard?tab=")) {
      const tab = href.split("tab=")[1];
      return pathname === "/dashboard" && searchParams.get("tab") === tab;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await fetch("/api/sign-out", { method: "POST" }).catch(() => {});
    window.location.href = "/auth/sign-in";
  };

  return (
    <Sidebar collapsible="icon" side={direction === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpenCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {appName || t("common.appName")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("nav.learning")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const label = t(item.key);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Learning nav */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.learningLabel")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningNav.map((item) => {
                const label = t(item.key);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Lesson selector */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.lessonLabel")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <LessonSelector />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                  <ChevronsUpDown className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
