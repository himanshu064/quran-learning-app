import type { Metadata } from "next";
import { HomeScreen } from "./home-screen";

export const metadata: Metadata = { title: "Surahs" };

export default function SurahsPage() {
  return <HomeScreen />;
}
