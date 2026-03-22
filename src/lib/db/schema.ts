import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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

export const round = pgTable(
  "round",
  {
    id: text().notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id),
    title: text().notNull(),
    fullscore: integer().notNull(),
    public: boolean().notNull().default(true),
    startsAt: timestamp("starts_at").notNull().default(sql`'1970-01-01 00:00:00'`),
  },
  (table) => [
    index("idx_round_edition_title_id").on(table.editionId, table.title, table.id),
    primaryKey({ columns: [table.id, table.editionId], name: "round_id_edition_id_pk" }),
  ],
);

export const task = pgTable(
  "task",
  {
    name: text().primaryKey().notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id),
    roundId: text("round_id").notNull(),
    title: text().notNull(),
    statement: text().notNull(),
  },
  (table) => [
    index("idx_task_edition_round_id_name").on(table.editionId, table.roundId, table.name),
    foreignKey({
      columns: [table.roundId, table.editionId],
      foreignColumns: [round.id, round.editionId],
      name: "task_round_id_edition_id_round_id_edition_id_fk",
    }),
  ],
);

export const institute = pgTable(
  "institute",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    city: text().notNull(),
    region: text()
      .notNull()
      .references(() => region.id),
  },
  (table) => [
    index("idx_institute_region_city_name_id").on(table.region, table.city, table.name, table.id),
    index("idx_institute_name").on(table.name),
  ],
);

export const team = pgTable(
  "team",
  {
    id: text().notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id),
    name: text().notNull(),
    instId: text("inst_id")
      .notNull()
      .references(() => institute.id),
    coach: text().notNull(),
    junior: boolean().notNull().default(false),
    finalist: boolean(),
    rankReg: integer("rank_reg").notNull(),
    rankTot: integer("rank_tot").notNull(),
    points: integer().notNull(),
  },
  (table) => [
    index("idx_team_inst_id_points_edition_id_id").on(
      table.instId,
      table.points,
      table.editionId,
      table.id,
    ),
    index("idx_team_edition_rank_tot_id_name_points").on(
      table.editionId,
      table.rankTot,
      table.id,
      table.name,
      table.points,
    ),
    index("idx_team_edition_name").on(table.editionId, table.name),
    index("idx_team_edition_id").on(table.editionId, table.id),
    primaryKey({ columns: [table.id, table.editionId], name: "team_id_edition_id_pk" }),
  ],
);

export const teamRound = pgTable(
  "team_round",
  {
    roundId: text("round_id").notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id),
    teamId: text("team_id").notNull(),
    score: integer().notNull(),
    rankTot: integer("rank_tot").notNull(),
    rankReg: integer("rank_reg").notNull(),
    medal: integer(),
    password: text().notNull().default(""),
    delay: integer().notNull().default(0),
  },
  (table) => [
    index("idx_team_round_medal_team_id_edition_id").on(table.medal, table.teamId, table.editionId),
    index("idx_team_round_edition_team_id").on(table.editionId, table.teamId),
    index("idx_team_round_edition_round_id_rank_tot_team_id_total_score").on(
      table.editionId,
      table.roundId,
      table.rankTot,
      table.teamId,
      table.score,
    ),
    foreignKey({
      columns: [table.teamId, table.editionId],
      foreignColumns: [team.id, team.editionId],
      name: "team_round_team_id_edition_id_team_id_edition_id_fk",
    }),
    foreignKey({
      columns: [table.roundId, table.editionId],
      foreignColumns: [round.id, round.editionId],
      name: "team_round_round_id_edition_id_round_id_edition_id_fk",
    }),
    primaryKey({
      columns: [table.roundId, table.editionId, table.teamId],
      name: "team_round_round_id_edition_id_team_id_pk",
    }),
  ],
);

export const taskScore = pgTable(
  "task_score",
  {
    taskName: text("task_name")
      .notNull()
      .references(() => task.name),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id),
    teamId: text("team_id").notNull(),
    score: integer().notNull(),
  },
  (table) => [
    index("idx_task_score_task_name_score").on(table.taskName, table.score),
    index("idx_task_score_edition_team_id").on(table.editionId, table.teamId),
    foreignKey({
      columns: [table.teamId, table.editionId],
      foreignColumns: [team.id, team.editionId],
      name: "task_score_team_id_edition_id_team_id_edition_id_fk",
    }),
    primaryKey({
      columns: [table.taskName, table.teamId],
      name: "task_score_task_name_team_id_pk",
    }),
  ],
);

export const highlight = pgTable(
  "highlight",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    page: text().notNull(),
    link: text().notNull(),
    name: text().notNull(),
    description: text().notNull(),
  },
  (table) => [index("idx_highlight_page_id").on(table.page, table.id)],
);

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
