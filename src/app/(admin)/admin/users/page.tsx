import type { Metadata } from "next";
import { getUsers } from "@/lib/admin/queries";
import { UsersContent } from "./users-content";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status ?? "all";
  const page = Number(params.page ?? "1");
  const limit = [10, 20, 50].includes(Number(params.limit))
    ? Number(params.limit)
    : 10;

  const { users, total, totalPages } = await getUsers({
    search: search || undefined,
    status: status || undefined,
    page,
    limit,
  });

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }));

  return (
    <UsersContent
      users={serializedUsers}
      total={total}
      page={page}
      totalPages={totalPages}
      perPage={limit}
      currentSearch={search}
      currentStatus={status}
    />
  );
}
