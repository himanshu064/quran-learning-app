"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar, AdminTopbar } from "@/components/admin";
import { LanguageProvider } from "@/providers";

export function AdminShell({
  adminName,
  adminEmail,
  appName,
  announcement,
  defaultLanguage,
  children,
}: {
  adminName: string;
  adminEmail: string;
  appName: string;
  announcement: string;
  defaultLanguage: "ar" | "en";
  children: React.ReactNode;
}) {
  const [showBanner, setShowBanner] = useState(!!announcement);

  return (
    <LanguageProvider defaultLanguage={defaultLanguage}>
      <SidebarProvider>
        <AdminSidebar
          adminName={adminName}
          adminEmail={adminEmail}
          appName={appName}
        />
        <SidebarInset className="items-stretch justify-start">
          <AdminTopbar />
          {showBanner && announcement && (
            <div className="flex items-center gap-2 border-b bg-primary/10 px-4 py-2 text-sm">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              <p className="flex-1">{announcement}</p>
              <button
                onClick={() => setShowBanner(false)}
                className="shrink-0 rounded-sm p-0.5 hover:bg-primary/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </LanguageProvider>
  );
}
