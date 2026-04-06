import type { Metadata } from "next";
import { LettersScreen } from "./letters-screen";

export const metadata: Metadata = { title: "Letters" };

export default function LettersPage() {
  return <LettersScreen />;
}
