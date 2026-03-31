import type { Metadata } from "next";
import { UserDashboard } from "./user-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <UserDashboard />;
}
