import type { Metadata } from "next";
import { McqScreen } from "./mcq-screen";

export const metadata: Metadata = { title: "Listening Game" };

export default function McqPage() {
  return <McqScreen />;
}
