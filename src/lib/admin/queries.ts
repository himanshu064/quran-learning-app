import { eq, ne, ilike, or, count, desc, and, inArray, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/database";
import { user } from "@/db/auth-schema";
import { userProgress, userSettings } from "@/db/schema";

// Only count regular users, not admins
const nonAdminFilter = ne(user.role, "admin");

export async function getDashboardStats() {
  const [totalUsers] = await db
    .select({ count: count() })
    .from(user)
    .where(nonAdminFilter);

  const statusCounts = await db
    .select({ status: user.status, count: count() })
    .from(user)
    .where(nonAdminFilter)
    .groupBy(user.status);

  const activeUsers =
    statusCounts.find((s) => s.status === "active")?.count ?? 0;
  const suspendedUsers =
    statusCounts.find((s) => s.status === "suspended")?.count ?? 0;

  const [completedLessons] = await db
    .select({ count: count() })
    .from(userProgress)
    .where(eq(userProgress.completed, true));

  const lessonCompletionRates = await db
    .select({
      lessonId: userProgress.lessonId,
      count: count(),
    })
    .from(userProgress)
    .where(eq(userProgress.completed, true))
    .groupBy(userProgress.lessonId)
    .orderBy(userProgress.lessonId);

  const recentRegistrations = await db
    .select()
    .from(user)
    .where(nonAdminFilter)
    .orderBy(desc(user.createdAt))
    .limit(10);

  return {
    totalUsers: totalUsers.count,
    activeUsers,
    suspendedUsers,
    completedLessons: completedLessons.count,
    lessonCompletionRates,
    recentRegistrations,
  };
}

export async function getUsers(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { search, status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [nonAdminFilter];
  if (search) {
    const searchCondition = or(
      ilike(user.name, `%${search}%`),
      ilike(user.email, `%${search}%`),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (status && status !== "all") {
    switch (status) {
      case "active":
        // Verified + has logged in + not suspended
        conditions.push(eq(user.status, "active"));
        conditions.push(eq(user.emailVerified, true));
        conditions.push(isNotNull(user.lastLoginAt));
        break;
      case "registered":
        // Verified but never logged in
        conditions.push(eq(user.status, "active"));
        conditions.push(eq(user.emailVerified, true));
        conditions.push(isNull(user.lastLoginAt));
        break;
      case "unverified":
        // Email not verified AND not suspended/banned
        conditions.push(eq(user.emailVerified, false));
        conditions.push(eq(user.status, "active"));
        break;
      case "suspended":
        conditions.push(eq(user.status, "suspended"));
        break;
      default:
        conditions.push(eq(user.status, status));
    }
  }

  const where = and(...conditions);

  const [users, [total]] = await Promise.all([
    db
      .select()
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(user).where(where),
  ]);

  // Get progress summary for each user
  const userIds = users.map((u) => u.id);
  let progressSummary: Record<
    string,
    { completedCount: number; bestMcqScore: number | null; bestMcqTotal: number | null }
  > = {};

  if (userIds.length > 0) {
    const progressRows = await db
      .select()
      .from(userProgress)
      .where(inArray(userProgress.userId, userIds));

    for (const row of progressRows) {
      if (!progressSummary[row.userId]) {
        progressSummary[row.userId] = {
          completedCount: 0,
          bestMcqScore: null,
          bestMcqTotal: null,
        };
      }
      if (row.completed) {
        progressSummary[row.userId].completedCount++;
      }
      if (
        row.mcqScore !== null &&
        (progressSummary[row.userId].bestMcqScore === null ||
          row.mcqScore > progressSummary[row.userId].bestMcqScore!)
      ) {
        progressSummary[row.userId].bestMcqScore = row.mcqScore;
        progressSummary[row.userId].bestMcqTotal = row.mcqTotal;
      }
    }
  }

  return {
    users: users.map((u) => ({
      ...u,
      progress: progressSummary[u.id] ?? {
        completedCount: 0,
        bestMcqScore: null,
        bestMcqTotal: null,
      },
    })),
    total: total.count,
    page,
    totalPages: Math.ceil(total.count / limit),
  };
}

export async function getUserById(id: string) {
  const [userData] = await db.select().from(user).where(eq(user.id, id));
  if (!userData) return null;

  const [progress, settings] = await Promise.all([
    db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, id))
      .orderBy(userProgress.lessonId),
    db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, id)),
  ]);

  return {
    user: userData,
    progress,
    settings: settings[0] ?? null,
  };
}
