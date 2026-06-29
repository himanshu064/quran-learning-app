import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/admin/queries";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <DashboardContent
      stats={{
        ...stats,
        recentRegistrations: stats.recentRegistrations.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
      }}
    />
  );
}
