import type { Metadata } from "next";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
