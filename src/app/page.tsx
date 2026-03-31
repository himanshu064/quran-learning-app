import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles role-based redirect for authenticated users.
  // Unauthenticated users reaching here get sent to sign-in.
  redirect("/auth/sign-in");
}
