"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/data-table";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  progress: {
    completedCount: number;
    bestMcqScore: number | null;
    bestMcqTotal: number | null;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Derives a display status from user fields:
 * - suspended/banned → use as-is
 * - active + email not verified → "unverified"
 * - active + email verified + never logged in → "registered"
 * - active + email verified + has logged in → "active"
 */
function getDisplayStatus(user: UserRow): string {
  if (user.status === "suspended") return "suspended";
  if (user.status === "banned") return "banned";
  if (!user.emailVerified) return "unverified";
  if (!user.lastLoginAt) return "registered";
  return "active";
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/20";
    case "registered":
      return "bg-blue-500/15 text-blue-500 border-blue-500/20";
    case "unverified":
      return "bg-orange-500/15 text-orange-500 border-orange-500/20";
    case "suspended":
      return "bg-amber-500/15 text-amber-500 border-amber-500/20";
    case "banned":
      return "bg-red-500/15 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "registered":
      return "Registered";
    case "unverified":
      return "Unverified";
    case "suspended":
      return "Suspended";
    case "banned":
      return "Banned";
    default:
      return status;
  }
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Link
          href={`/admin/users/${user.id}`}
          className="flex items-center gap-3"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-none group-hover:underline">
              {user.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </Link>
      );
    },
    filterFn: (row, columnId, filterValue: string) => {
      const name = row.original.name.toLowerCase();
      const email = row.original.email.toLowerCase();
      const search = filterValue.toLowerCase();
      return name.includes(search) || email.includes(search);
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.phone ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString("en-US")}
      </span>
    ),
  },
  {
    id: "displayStatus",
    accessorFn: (row) => getDisplayStatus(row),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const displayStatus = getDisplayStatus(row.original);
      return (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${getStatusColor(displayStatus)}`}
        >
          {getStatusLabel(displayStatus)}
        </span>
      );
    },
    filterFn: (row, id, value: string[]) => {
      const displayStatus = getDisplayStatus(row.original);
      return value.includes(displayStatus);
    },
  },
  {
    id: "lessons",
    header: "Lessons",
    cell: ({ row }) => (
      <div className="text-center">
        <span className="tabular-nums font-medium">
          {row.original.progress.completedCount}
        </span>
        <span className="text-muted-foreground"> / 9</span>
      </div>
    ),
  },
  {
    id: "mcq",
    header: "Best MCQ",
    cell: ({ row }) => {
      const { bestMcqScore, bestMcqTotal } = row.original.progress;
      return (
        <div className="text-center">
          {bestMcqScore !== null ? (
            <span className="tabular-nums font-medium">
              {bestMcqScore}/{bestMcqTotal}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
];
