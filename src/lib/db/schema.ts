import { foreignKey, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const region = sqliteTable("region", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
});

export const edition = sqliteTable("edition", {
  id: text().primaryKey().notNull(),
  year: text().notNull(),
  title: text().notNull(),
});

export const round = sqliteTable(
  "round",
  {
    id: text().notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => edition.id),
    title: text().notNull(),
    fullscore: integer().notNull(),
  },
  (table) => [
    index("idx_round_edition_title_id").on(table.editionId, table.title, table.id),
    primaryKey({ columns: [table.id, table.editionId], name: "round_id_edition_id_pk" }),
  ],
);

export const task = sqliteTable(
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

export const institute = sqliteTable(
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

export const team = sqliteTable(
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
    finalist: integer(),
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

export const roundScore = sqliteTable(
  "round_score",
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
  },
  (table) => [
    index("idx_round_score_medal_team_id_edition_id").on(
      table.medal,
      table.teamId,
      table.editionId,
    ),
    index("idx_round_score_edition_team_id").on(table.editionId, table.teamId),
    index("idx_round_score_edition_round_id_rank_tot_team_id_total_score").on(
      table.editionId,
      table.roundId,
      table.rankTot,
      table.teamId,
      table.score,
    ),
    foreignKey({
      columns: [table.teamId, table.editionId],
      foreignColumns: [team.id, team.editionId],
      name: "round_score_team_id_edition_id_team_id_edition_id_fk",
    }),
    foreignKey({
      columns: [table.roundId, table.editionId],
      foreignColumns: [round.id, round.editionId],
      name: "round_score_round_id_edition_id_round_id_edition_id_fk",
    }),
    primaryKey({
      columns: [table.roundId, table.editionId, table.teamId],
      name: "round_score_round_id_edition_id_team_id_pk",
    }),
  ],
);

export const taskScore = sqliteTable(
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
    foreignKey({
      columns: [table.taskName, table.editionId],
      foreignColumns: [task.name, task.editionId],
      name: "task_score_task_name_edition_id_task_name_edition_id_fk",
    }),
    primaryKey({
      columns: [table.taskName, table.teamId],
      name: "task_score_task_name_team_id_pk",
    }),
  ],
);

export const highlight = sqliteTable(
  "highlight",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    page: text().notNull(),
    link: text().notNull(),
    name: text().notNull(),
    description: text().notNull(),
  },
  (table) => [index("idx_highlight_page_id").on(table.page, table.id)],
);
