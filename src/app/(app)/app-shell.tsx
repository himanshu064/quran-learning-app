"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LanguageProvider } from "@/providers";
import { UserSidebar, UserTopbar } from "@/components/app";

export function AppShell({
  userName,
  userEmail,
  appName,
  defaultLanguage,
  children,
}: {
  userName: string;
  userEmail: string;
  appName: string;
  defaultLanguage: "ar" | "en";
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider defaultLanguage={defaultLanguage}>
      <SidebarProvider>
        <UserSidebar
          userName={userName}
          userEmail={userEmail}
          appName={appName}
        />
        <SidebarInset>
          <UserTopbar />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </LanguageProvider>
  );
}
