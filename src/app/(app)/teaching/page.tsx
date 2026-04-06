import type { Metadata } from "next";
import { TeachingScreen } from "./teaching-screen";

export const metadata: Metadata = { title: "Teaching" };

export default function TeachingPage() {
  return <TeachingScreen />;
}
