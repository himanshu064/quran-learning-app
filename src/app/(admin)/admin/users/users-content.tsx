"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VercelTabs } from "@/components/common";
import { useLanguage } from "@/providers";
import { useDebounce } from "@/hooks";
import type { UserRow } from "./_lib/columns";

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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
    default:
      return status;
  }
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export function UsersContent({
  users,
  total,
  page,
  totalPages,
  perPage,
  currentSearch,
  currentStatus,
}: {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  currentSearch: string;
  currentStatus: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const debouncedSearch = useDebounce(search, 300);
  const isInitialMount = useRef(true);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 on search/filter change
      if (!updates.page) params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition],
  );

  // Debounced search → update URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("users.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
      </div>

      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("users.allUsers")}</CardTitle>
              <CardDescription>
                {total} {t("users.usersFound")}
              </CardDescription>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative sm:max-w-sm">
            <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("users.searchPlaceholder")}
              className="ps-9"
            />
          </div>

          {/* Status Tabs */}
          <VercelTabs
            tabs={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "registered", label: "Registered" },
              { value: "unverified", label: "Unverified" },
              { value: "suspended", label: "Suspended" },
            ]}
            activeTab={currentStatus}
            onTabChange={(value) => updateParams({ status: value })}
          />

          {/* Table */}
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("users.noUsers")}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Lessons</TableHead>
                    <TableHead className="text-center">Best MCQ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const displayStatus = getDisplayStatus(u);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium leading-none hover:underline">
                                {u.name || "—"}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("en-US")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${getStatusColor(displayStatus)}`}
                          >
                            {getStatusLabel(displayStatus)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="tabular-nums font-medium">
                            {u.progress.completedCount}
                          </span>
                          <span className="text-muted-foreground"> / 9</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.progress.bestMcqScore !== null ? (
                            <span className="tabular-nums font-medium">
                              {u.progress.bestMcqScore}/
                              {u.progress.bestMcqTotal}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total} user{total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-4">
                {/* Per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Per page</span>
                  <Select
                    value={String(perPage)}
                    onValueChange={(value) => updateParams({ limit: value })}
                  >
                    <SelectTrigger className="h-8 w-[70px] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((n) => (
                        <SelectItem key={n} value={String(n)} className="cursor-pointer">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => updateParams({ page: String(p) })}
                      >
                        {p}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => updateParams({ page: String(page + 1) })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
