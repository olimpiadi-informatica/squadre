import { and, avg, countDistinct, eq, gt, max, min, ne, or, sql, sum } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgMaterializedView,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { coalesce, median } from "./utils";

// ─── Tables ───────────────────────────────────────────────────────────────────

export const region = pgTable("region", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
});

export const edition = pgTable("edition", {
  id: text().primaryKey().notNull(),
  year: text().notNull(),
  title: text().notNull(),
  public: boolean().notNull().default(true),
});

export const round = pgTable("round", {
  id: serial().primaryKey(),
  slug: text().notNull(),
  editionId: text("edition_id")
    .notNull()
    .references(() => edition.id, { onDelete: "cascade" }),
  title: text().notNull(),
  fullscore: integer().notNull(),
  public: boolean().notNull().default(true),
  startsAt: timestamp("starts_at").notNull().default(sql`'1970-01-01 00:00:00'`),
  endsAt: timestamp("ends_at").notNull().default(sql`'1970-01-01 00:00:00'`),
});

export const task = pgTable(
  "task",
  {
    id: serial().primaryKey(),
    slug: text().notNull(),
    roundId: integer("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    title: text().notNull(),
    statement: text().notNull(),
    junior: boolean().notNull().default(false),
    regular: boolean().notNull().default(true),
  },

  (table) => [uniqueIndex("task_slug_round_id").on(table.slug, table.roundId)],
);

export const institute = pgTable("institute", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  city: text().notNull(),
  region: text()
    .notNull()
    .references(() => region.id),
  email: text(),
});

export const team = pgTable(
  "team",
  {
    id: serial().primaryKey(),
    slug: text().notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id, { onDelete: "cascade" }),
    name: text().notNull(),
    instituteId: text("inst_id")
      .notNull()
      .references(() => institute.id),
    coach: text().notNull(),
    junior: boolean().notNull().default(false),
    finalist: boolean(),
  },
  (table) => [uniqueIndex("team_slug_edition_id").on(table.slug, table.editionId)],
);

export const teamRound = pgTable(
  "team_round",
  {
    id: serial().primaryKey(),
    roundId: integer("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    password: text().notNull().default(""),
    delay: integer().notNull().default(0),
  },
  (table) => [uniqueIndex("team_round_round_id_team_id_unique").on(table.roundId, table.teamId)],
);

export const teamTaskScore = pgTable(
  "team_task_score",
  {
    id: serial().primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    score: integer().notNull(),
  },
  (table) => [uniqueIndex("task_score_task_id_team_id_unique").on(table.taskId, table.teamId)],
);

export const internetCheckStatusValues = ["succeeded", "failed", "missing", "empty"] as const;
export type InternetCheckStatus = (typeof internetCheckStatusValues)[number];

export const internetCheck = pgTable("internet_check", {
  id: serial().primaryKey(),
  teamRoundId: integer("team_round_id")
    .notNull()
    .references(() => teamRound.id, { onDelete: "cascade" }),
  startTs: timestamp("start_ts").notNull(),
  endTs: timestamp("end_ts").notNull(),
  status: text().notNull().$type<InternetCheckStatus>(),
  pcHash: text("pc_hash").notNull(),
  userAgent: text("user_agent"),
  browserName: text("browser_name"),
  browserMajor: integer("browser_major"),
  osName: text("os_name"),
});

export const submission = pgTable(
  "submission",
  {
    id: serial().primaryKey(),
    slug: text().notNull(),
    teamRoundId: integer("team_round_id")
      .notNull()
      .references(() => teamRound.id, { onDelete: "cascade" }),
    taskId: integer("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    score: integer().notNull(),
    timestamp: timestamp().notNull(),
    language: text().notNull(),
    code: text().notNull(),
  },
  (table) => [
    index("idx_submission_team_round").on(table.teamRoundId),
    index("idx_submission_task").on(table.taskId),
    index("idx_submission_timestamp").on(table.timestamp),
  ],
);

export const highlight = pgTable(
  "highlight",
  {
    id: serial().primaryKey(),
    page: text().notNull(),
    link: text().notNull(),
    name: text().notNull(),
    description: text().notNull(),
  },
  (table) => [index("idx_highlight_page_id").on(table.page, table.id)],
);

export const instituteEmail = pgTable(
  "institute_email",
  {
    id: serial().primaryKey(),
    token: uuid().defaultRandom().notNull(),
    instituteId: text("institute_id")
      .notNull()
      .references(() => institute.id),
    roundId: integer("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    address: text(),
    status: text().notNull().$type<"sending" | "sent" | "sending-failed">(),
    html: text(),
  },
  (table) => [
    uniqueIndex("round_email_institute_id_round_id_unique").on(table.instituteId, table.roundId),
  ],
);

export const emailTemplate = pgTable("email_templates", {
  id: text().primaryKey().notNull(),
  content: text().notNull(),
});

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text().primaryKey().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text().primaryKey().notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text(),
  password: text(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Materialized Views ───────────────────────────────────────────────────────

export const v00a_taskStats = pgMaterializedView("v00a_task_stats").as((qb) =>
  qb
    .select({
      taskId: teamTaskScore.taskId,
      teamScored: countDistinct(teamTaskScore.teamId).as("team_scored"),
      totalScores: coalesce(sum(teamTaskScore.score), 0).as("total_scores"),
      maxScore: coalesce(max(teamTaskScore.score), 0).as("max_score"),
      avgScore: coalesce(avg(teamTaskScore.score), 0).as("avg_score"),
      medianScore: coalesce(median(teamTaskScore.score), 0).as("median_score"),
    })
    .from(teamTaskScore)
    .innerJoin(team, and(eq(team.id, teamTaskScore.teamId), eq(team.junior, false)))
    .innerJoin(task, eq(task.id, teamTaskScore.taskId))
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .where(gt(teamTaskScore.score, 0))
    .groupBy(teamTaskScore.taskId),
);

export const v01a_teamTaskScoreStats = pgMaterializedView("v01a_team_task_score_stats").as((qb) =>
  qb
    .select({
      teamTaskScoreId: teamTaskScore.id,
      rankTot:
        sql<number>`RANK() OVER (PARTITION BY ${teamTaskScore.taskId} ORDER BY ${teamTaskScore.score} DESC)`.as(
          "rank_tot",
        ),
    })
    .from(teamTaskScore)
    .innerJoin(team, and(eq(team.id, teamTaskScore.teamId), eq(team.junior, false)))
    .innerJoin(task, eq(task.id, teamTaskScore.taskId))
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true))),
);

export const v02b_teamRoundStats = pgMaterializedView("v02b_team_round_stats").as((qb) =>
  qb
    .select({
      teamRoundId: teamRound.id,
      totalScores: coalesce(sum(teamTaskScore.score), 0).as("total_scores"),
      rankTot:
        sql<number>`RANK() OVER (PARTITION BY ${teamRound.roundId} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC)`.as(
          "rank_tot",
        ),
      rankReg:
        sql<number>`RANK() OVER (PARTITION BY ${teamRound.roundId}, ${institute.region} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC)`.as(
          "rank_reg",
        ),
      medal: sql<number | null>`CASE
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) = 0    THEN 0
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) < 0.05 THEN 1
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) < 0.15 THEN 2
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) < 0.30 THEN 3
                                  ELSE null
                                END`.as("medal"),
    })
    .from(team)
    .innerJoin(edition, and(eq(edition.id, team.editionId), eq(edition.public, true)))
    .innerJoin(
      round,
      and(
        eq(round.editionId, edition.id),
        eq(round.public, true),
        or(team.finalist, ne(round.slug, "final")),
      ),
    )
    .leftJoin(teamRound, and(eq(teamRound.teamId, team.id), eq(teamRound.roundId, round.id)))
    .leftJoin(task, eq(task.roundId, round.id))
    .leftJoin(
      teamTaskScore,
      and(eq(teamTaskScore.teamId, team.id), eq(teamTaskScore.taskId, task.id)),
    )
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .where(eq(team.junior, false))
    .groupBy(teamRound.id, institute.region),
);

export const v03b_roundStats = pgMaterializedView("v03b_round_stats").as((qb) =>
  qb
    .select({
      roundId: round.id,
      teamScored: countDistinct(teamRound.teamId).as("team_scored"),
      totalScores: coalesce(sum(v02b_teamRoundStats.totalScores), 0).as("total_scores"),
      maxScore: coalesce(max(v02b_teamRoundStats.totalScores), 0).as("max_score"),
      avgScore: coalesce(avg(v02b_teamRoundStats.totalScores), 0).as("avg_score"),
      medianScore: coalesce(median(v02b_teamRoundStats.totalScores), 0).as("median_score"),
    })
    .from(round)
    .innerJoin(teamRound, eq(teamRound.roundId, round.id))
    .innerJoin(v02b_teamRoundStats, eq(v02b_teamRoundStats.teamRoundId, teamRound.id))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .where(gt(v02b_teamRoundStats.totalScores, 0))
    .groupBy(round.id),
);

export const v04a_teamStats = pgMaterializedView("v04a_team_stats").as((qb) =>
  qb
    .select({
      teamId: team.id,
      totalScores: coalesce(sum(v02b_teamRoundStats.totalScores), 0).as("total_scores"),
      rankTot:
        sql<number>`RANK() OVER (PARTITION BY ${team.editionId} ORDER BY ${coalesce(sum(v02b_teamRoundStats.totalScores), 0)} DESC)`.as(
          "rank_tot",
        ),
      rankReg:
        sql<number>`RANK() OVER (PARTITION BY ${team.editionId}, ${institute.region} ORDER BY ${coalesce(sum(v02b_teamRoundStats.totalScores), 0)} DESC)`.as(
          "rank_reg",
        ),
      avgRoundRank: coalesce(avg(v02b_teamRoundStats.rankTot), 0).as("avg_round_rank"),
      bestRoundRank: coalesce(min(v02b_teamRoundStats.rankTot), 0).as("best_round_rank"),
      totalMedals: sql<Record<number, number>>`JSON_BUILD_OBJECT(
        0, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 0),
        1, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 1),
        2, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 2),
        3, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 3)
      )`.as("total_medals"),
    })
    .from(team)
    .innerJoin(edition, and(eq(edition.id, team.editionId), eq(edition.public, true)))
    .innerJoin(
      round,
      and(
        eq(round.editionId, edition.id),
        eq(round.public, true),
        or(eq(team.finalist, true), ne(round.slug, "final")),
      ),
    )
    .leftJoin(teamRound, and(eq(teamRound.teamId, team.id), eq(teamRound.roundId, round.id)))
    .leftJoin(v02b_teamRoundStats, eq(v02b_teamRoundStats.teamRoundId, teamRound.id))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .where(eq(team.junior, false))
    .groupBy(team.id, team.editionId, institute.region),
);

export const v05a_editionStats = pgMaterializedView("v05a_edition_stats").as((qb) =>
  qb
    .select({
      editionId: team.editionId,
      totalTeams: countDistinct(team.id).as("total_teams"),
      totalScores: coalesce(sum(v04a_teamStats.totalScores), 0).as("total_scores"),
      highestScore: coalesce(max(v04a_teamStats.totalScores), 0).as("highest_score"),
    })
    .from(v04a_teamStats)
    .innerJoin(team, eq(team.id, v04a_teamStats.teamId))
    .innerJoin(edition, and(eq(edition.id, team.editionId), eq(edition.public, true)))
    .groupBy(team.editionId),
);

export const v06a_editionStats2 = pgMaterializedView("v06a_edition_stats2").as((qb) =>
  qb
    .select({
      editionId: round.editionId,
      totalInstitutes: countDistinct(team.instituteId).as("total_institutes"),
      totalTasks: countDistinct(task.id).as("total_tasks"),
    })
    .from(v02b_teamRoundStats)
    .innerJoin(teamRound, eq(teamRound.id, v02b_teamRoundStats.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(task, eq(task.roundId, teamRound.roundId))
    .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .groupBy(round.editionId),
);

/**
 * TODO: there is a drizzle bug that causes the column references  to be ambiguous. So we have to use raw SQL for now.
 */
export const v07a_instituteStats = pgMaterializedView("v07a_institute_stats").as((qb) =>
  qb
    .select({
      instituteId: team.instituteId,
      totalEditions: countDistinct(team.editionId).as("total_editions"),
      totalTeams: countDistinct(team.id).as("total_teams"),
      totalScores: coalesce(sum(sql`v02b_team_round_stats.total_scores`), 0).as("total_scores"),
      totalMedals: sql<Record<number, number>>`JSON_BUILD_OBJECT(
        0, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 0),
        1, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 1),
        2, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 2),
        3, COUNT(*) FILTER (WHERE v02b_team_round_stats.medal = 3)
      )`.as("total_medals"),
      bestEditionRank: coalesce(min(sql`v04a_team_stats.rank_tot`), 0).as("best_edition_rank"),
      bestRoundRank: coalesce(min(sql`v02b_team_round_stats.rank_tot`), 0).as("best_round_rank"),
    })
    .from(v02b_teamRoundStats)
    .innerJoin(teamRound, eq(teamRound.id, v02b_teamRoundStats.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .groupBy(team.instituteId),
);

export const v08a_regionStats = pgMaterializedView("v08a_region_stats").as((qb) =>
  qb
    .select({
      regionId: institute.region,
      totalEditions: countDistinct(edition.id).as("total_editions"),
      totalInstitutes: countDistinct(institute.id).as("total_institutes"),
      totalTeams: countDistinct(team.id).as("total_teams"),
      totalScores: coalesce(sum(sql`v02b_team_round_stats.total_scores`), 0).as("total_scores"),
      totalMedals: sql<Record<number, number>>`JSON_BUILD_OBJECT(
        0, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 0),
        1, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 1),
        2, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 2),
        3, COUNT(*) FILTER (WHERE ${v02b_teamRoundStats.medal} = 3)
      )`.as("total_medals"),
      bestEditionRank: coalesce(min(sql`v04a_team_stats.rank_tot`), 0).as("best_edition_rank"),
      bestRoundRank: coalesce(min(sql`v02b_team_round_stats.rank_tot`), 0).as("best_round_rank"),
    })
    .from(v02b_teamRoundStats)
    .innerJoin(teamRound, eq(teamRound.id, v02b_teamRoundStats.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .groupBy(institute.region),
);
