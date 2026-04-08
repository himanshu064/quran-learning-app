import type { Metadata } from "next";
import { UnifiedScreen } from "./unified-screen";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <UnifiedScreen />;
}
