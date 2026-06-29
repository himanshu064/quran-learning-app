import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserById } from "@/lib/admin/queries";
import { UserDetailContent } from "./user-detail-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getUserById(id);
  return { title: data ? `User: ${data.user.name}` : "User Not Found" };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUserById(id);

  if (!data) notFound();

  return (
    <UserDetailContent
      user={{
        ...data.user,
        createdAt: data.user.createdAt.toISOString(),
        updatedAt: data.user.updatedAt.toISOString(),
        lastLoginAt: data.user.lastLoginAt?.toISOString() ?? null,
      }}
      progress={data.progress.map((p) => ({
        ...p,
        completedAt: p.completedAt?.toISOString() ?? null,
        mcqCompletedAt: p.mcqCompletedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
      settings={data.settings}
    />
  );
}
