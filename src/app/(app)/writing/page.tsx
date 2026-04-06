import type { Metadata } from "next";
import { WritingScreen } from "./writing-screen";

export const metadata: Metadata = { title: "Writing Game" };

export default function WritingPage() {
  return <WritingScreen />;
}
