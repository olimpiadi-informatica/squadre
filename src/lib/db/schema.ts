import {
  and,
  avg,
  countDistinct,
  eq,
  gt,
  isNotNull,
  isNull,
  max,
  min,
  notExists,
  or,
  type SQL,
  type SQLWrapper,
  sql,
  sum,
} from "drizzle-orm";
import {
  alias,
  boolean,
  index,
  integer,
  numeric,
  pgMaterializedView,
  pgTable,
  primaryKey,
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
    junior: boolean().notNull().default(false),
    regular: boolean().notNull().default(true),
  },

  (table) => [
    uniqueIndex("task_slug_round_id").on(table.slug, table.roundId),
    index("task_round_id_idx").on(table.roundId),
  ],
);

export const institute = pgTable("institute", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  city: text().notNull(),
  region: text()
    .notNull()
    .references(() => region.id),
  email: text(),
  schoolEmail: text("school_email"),
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
    finalist: boolean(),
    hidden: boolean().notNull().default(false),
    unrestricted: boolean().notNull().default(false),
  },
  (table) => [uniqueIndex("team_slug_edition_id").on(table.slug, table.editionId)],
);

/**
 * Appartenenza di una squadra a uno o più campionati.
 *
 * Il regolamento è cambiato nel tempo, quindi il campionato è un dato e non un
 * booleano: 'regolari' (triennio, fino alle OIS 15; regolari, da OIS 16),
 * 'biennio' (OIS 11-15) e 'esordienti' (da OIS 16). La maggioranza delle
 * squadre ha una sola riga, ma nelle OIS 14/15 le squadre 'bt-' erano iscritte
 * sia al triennio sia al biennio: gareggiano in entrambe le classifiche con gli
 * stessi punteggi.
 *
 * Tutte le classifiche sono partizionate per campionato, così round e task
 * possono ospitare classifiche parallele senza mischiare i campionati.
 */
export const teamChampionship = pgTable(
  "team_championship",
  {
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    championship: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.championship] }),
    index("team_championship_championship_idx").on(table.championship),
  ],
);

export const participationStatusValues = ["logged", "submitted", "scored"] as const;
export type ParticipationStatus = (typeof participationStatusValues)[number];

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
    participationStatus: text("participation_status").$type<ParticipationStatus>(),
  },
  (table) => [
    uniqueIndex("team_round_round_id_team_id_unique").on(table.roundId, table.teamId),
    index("team_round_team_id_idx").on(table.teamId),
  ],
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
    // I punteggi delle finali storiche hanno al più 2 decimali
    score: numeric("score", { precision: 8, scale: 2, mode: "number" }).notNull(),
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

/**
 * Metadati degli screenshot di proctoring, importati insieme ai controlli
 * internet durante il caricamento dei risultati. I file immagine restano
 * sulla macchina che li serve (vedi SCREENSHOTS_DIR); qui conserviamo solo
 * timestamp e nome file, così le timeline non dipendono dal filesystem.
 */
export const screenshot = pgTable(
  "screenshot",
  {
    id: serial().primaryKey(),
    teamRoundId: integer("team_round_id")
      .notNull()
      .references(() => teamRound.id, { onDelete: "cascade" }),
    pcHash: text("pc_hash").notNull(),
    ts: timestamp().notNull(),
    filename: text().notNull(),
  },
  (table) => [
    uniqueIndex("screenshot_team_round_id_pc_hash_ts_unique").on(
      table.teamRoundId,
      table.pcHash,
      table.ts,
    ),
    index("screenshot_team_round_id_idx").on(table.teamRoundId),
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

export const email = pgTable("email", {
  id: serial().primaryKey(),
  address: text().notNull(),
  status: text().notNull().$type<"sending" | "sent" | "sending-failed">(),
  html: text(),
});

export const credentialEmail = pgTable(
  "credential_email",
  {
    id: serial().primaryKey(),
    token: uuid().defaultRandom().notNull(),
    instituteId: text("institute_id")
      .notNull()
      .references(() => institute.id),
    roundId: integer("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    emailId: integer("email_id")
      .notNull()
      .references(() => email.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("credential_email_institute_id_round_id_unique").on(
      table.instituteId,
      table.roundId,
    ),
  ],
);

export const penalizationLevelValues = ["yellow", "red"] as const;
export type PenalizationLevel = (typeof penalizationLevelValues)[number];

export const penalizationTypeValues = ["proctoring", "plagiarism", "ai", "other"] as const;
export type PenalizationType = (typeof penalizationTypeValues)[number];

export const institutePenalization = pgTable(
  "institute_penalization",
  {
    id: serial().primaryKey(),
    token: uuid().defaultRandom().notNull().unique(),
    roundId: integer("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    instituteId: text("institute_id")
      .notNull()
      .references(() => institute.id),
  },
  (table) => [
    uniqueIndex("institute_penalization_institute_id_round_id_unique").on(
      table.instituteId,
      table.roundId,
    ),
  ],
);

export const penalizationEmail = pgTable("penalization_email", {
  id: serial().primaryKey(),
  institutePenalizationId: integer("institute_penalization_id")
    .notNull()
    .references(() => institutePenalization.id, { onDelete: "cascade" }),
  emailId: integer("email_id")
    .notNull()
    .references(() => email.id, { onDelete: "cascade" }),
});

export const penalization = pgTable(
  "penalization",
  {
    id: serial().primaryKey(),
    level: text().notNull().$type<PenalizationLevel>(),
    type: text().notNull().$type<PenalizationType>(),
    description: text().notNull(),
    createdAt: timestamp("created_at").notNull(),
    sentAt: timestamp("sent_at"),
    appealAllowed: boolean().notNull(),
    allowAppealUntil: timestamp("allow_appeal_until"),
    appealApproved: boolean("appeal_approved"),
  },
  (table) => [index("idx_penalization_type").on(table.type)],
);

export const teamRoundPenalization = pgTable(
  "team_round_penalization",
  {
    id: serial().primaryKey(),
    teamRoundId: integer("team_round_id")
      .notNull()
      .references(() => teamRound.id, { onDelete: "cascade" }),
    submissionId: integer("submission_id").references(() => submission.id, {
      onDelete: "set null",
    }),
    penalizationId: integer("penalization_id")
      .notNull()
      .references(() => penalization.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("team_round_penalization_unique").on(
      table.teamRoundId,
      table.penalizationId,
      table.submissionId,
    ),
  ],
);

// Non esportato per evitare che drizzle-kit lo consideri una tabella del database
const penalizedTeamRound = alias(teamRound, "penalized_team_round");

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
  role: text(),
  banned: boolean(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
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
  impersonatedBy: text("impersonated_by"),
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
//
// Ogni vista di classifica espone la colonna `championship` e calcola rank (e
// medaglie) partizionando per campionato: round e task possono così ospitare
// classifiche parallele. Le viste aggregate (v05a-v08a) restano dei soli
// regolari, perché sono i totali di edizione/istituto/regione.

/**
 * Solo il campionato regolare gareggia in finale: per tutti gli altri il round
 * `final` è sempre escluso.
 */
function finalOnlyRegular(championship: SQLWrapper): SQL {
  return sql`(${championship} = 'regolari' OR ${round.slug} <> 'final')`;
}

/**
 * Come `finalOnlyRegular`, per le viste che costruiscono la lista dei round di
 * un'edizione: ai regolari basta essere finalisti per comparire in finale.
 */
function finalOnlyRegularFinalists(championship: SQLWrapper): SQL {
  return sql`((${championship} = 'regolari' AND ${team.finalist} = true) OR ${round.slug} <> 'final')`;
}

/**
 * Un round conta per un campionato solo se quel campionato ci ha effettivamente
 * segnato. Da OIS 16 un round ospita sia i task regolari sia quelli degli
 * esordienti, ma tutte le squadre hanno `team_round` in tutti i round: senza
 * questo filtro un campionato che non ha gareggiato riceverebbe rank 1 e
 * medaglie da partizioni composte solo da zeri.
 *
 * Gli alias interni (`s`, `t`, `tm`, `tc`) nascondono le tabelle esterne: i
 * riferimenti con il nome pieno (`round.id`, `team_championship.championship`)
 * restano quelli della riga corrente.
 */
const championshipScoredInRound = sql`exists (
  select 1
  from team_task_score s
  join task t on t.id = s.task_id
  join team tm on tm.id = s.team_id
  join team_championship tc on tc.team_id = tm.id
  where t.round_id = ${round.id}
    and tc.championship = ${teamChampionship.championship}
    and tm.hidden = false
)`;

export const v00a_taskStats = pgMaterializedView("v00a_task_stats").as((qb) =>
  qb
    .select({
      taskId: teamTaskScore.taskId,
      championship: sql<string>`${teamChampionship.championship}`.as("championship"),
      teamScored: countDistinct(teamTaskScore.teamId).as("team_scored"),
      totalScores: coalesce(sum(teamTaskScore.score), 0).as("total_scores"),
      maxScore: coalesce(max(teamTaskScore.score), 0).as("max_score"),
      avgScore: coalesce(avg(teamTaskScore.score), 0).as("avg_score"),
      medianScore: coalesce(median(teamTaskScore.score), 0).as("median_score"),
    })
    .from(teamTaskScore)
    .innerJoin(team, and(eq(team.id, teamTaskScore.teamId), eq(team.hidden, false)))
    .innerJoin(teamChampionship, eq(teamChampionship.teamId, team.id))
    .innerJoin(task, eq(task.id, teamTaskScore.taskId))
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .where(
      and(
        gt(teamTaskScore.score, 0),
        finalOnlyRegular(teamChampionship.championship),
        notExists(
          qb
            .select({ id: penalizedTeamRound.id })
            .from(penalizedTeamRound)
            .innerJoin(
              teamRoundPenalization,
              eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
            )
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(penalizedTeamRound.teamId, team.id),
                eq(penalization.level, "red"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
              ),
            ),
        ),
      ),
    )
    .groupBy(teamTaskScore.taskId, teamChampionship.championship),
);

export const v01a_teamTaskScoreStats = pgMaterializedView("v01a_team_task_score_stats").as((qb) =>
  qb
    .select({
      teamTaskScoreId: teamTaskScore.id,
      championship: sql<string>`${teamChampionship.championship}`.as("championship"),
      rankTot: sql<number>`(RANK() OVER (
          PARTITION BY ${teamTaskScore.taskId}, ${teamChampionship.championship}
          ORDER BY ${teamTaskScore.score} DESC
        ))::int`.as("rank_tot"),
    })
    .from(teamTaskScore)
    .innerJoin(team, and(eq(team.id, teamTaskScore.teamId), eq(team.hidden, false)))
    .innerJoin(teamChampionship, eq(teamChampionship.teamId, team.id))
    .innerJoin(task, eq(task.id, teamTaskScore.taskId))
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .where(
      and(
        finalOnlyRegular(teamChampionship.championship),
        notExists(
          qb
            .select({ id: penalizedTeamRound.id })
            .from(penalizedTeamRound)
            .innerJoin(
              teamRoundPenalization,
              eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
            )
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(penalizedTeamRound.teamId, team.id),
                eq(penalization.level, "red"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
              ),
            ),
        ),
      ),
    ),
);

export const v02b_teamRoundStats = pgMaterializedView("v02b_team_round_stats").as((qb) =>
  qb
    .select({
      teamRoundId: teamRound.id,
      championship: sql<string>`${teamChampionship.championship}`.as("championship"),
      totalScores: coalesce(sum(teamTaskScore.score), 0).as("total_scores"),
      rankTot: sql<number>`(RANK() OVER (
          PARTITION BY ${teamRound.roundId}, ${teamChampionship.championship}
          ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC
        ))::int`.as("rank_tot"),
      rankReg: sql<number>`(RANK() OVER (
          PARTITION BY ${teamRound.roundId}, ${teamChampionship.championship}, ${institute.region}
          ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC
        ))::int`.as("rank_reg"),
      // Le coccarde sono un riconoscimento del campionato regolare: gli altri
      // campionati non le ricevono (restano null, quindi mai visualizzate).
      medal: sql<number | null>`CASE
                                  WHEN ${teamChampionship.championship} <> 'regolari' THEN null
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId}, ${teamChampionship.championship} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) = 0    THEN 0
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId}, ${teamChampionship.championship} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) <= 0.05 THEN 1
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId}, ${teamChampionship.championship} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) <= 0.15 THEN 2
                                  WHEN PERCENT_RANK() OVER (PARTITION BY ${teamRound.roundId}, ${teamChampionship.championship} ORDER BY ${coalesce(sum(teamTaskScore.score), 0)} DESC) <= 0.30 THEN 3
                                  ELSE null
                                END`.as("medal"),
    })
    .from(team)
    .innerJoin(teamChampionship, eq(teamChampionship.teamId, team.id))
    .innerJoin(edition, and(eq(edition.id, team.editionId), eq(edition.public, true)))
    .innerJoin(
      round,
      and(
        eq(round.editionId, edition.id),
        eq(round.public, true),
        finalOnlyRegularFinalists(teamChampionship.championship),
      ),
    )
    .leftJoin(teamRound, and(eq(teamRound.teamId, team.id), eq(teamRound.roundId, round.id)))
    .leftJoin(task, eq(task.roundId, round.id))
    .leftJoin(
      teamTaskScore,
      and(eq(teamTaskScore.teamId, team.id), eq(teamTaskScore.taskId, task.id)),
    )
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .where(
      and(
        eq(team.hidden, false),
        championshipScoredInRound,
        notExists(
          qb
            .select({ id: teamRoundPenalization.id })
            .from(teamRoundPenalization)
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(teamRoundPenalization.teamRoundId, teamRound.id),
                eq(penalization.level, "yellow"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
              ),
            ),
        ),
        notExists(
          qb
            .select({ id: penalizedTeamRound.id })
            .from(penalizedTeamRound)
            .innerJoin(
              teamRoundPenalization,
              eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
            )
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(penalizedTeamRound.teamId, team.id),
                eq(penalization.level, "red"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
              ),
            ),
        ),
      ),
    )
    .groupBy(teamRound.id, teamChampionship.championship, institute.region),
);

export const v03b_roundStats = pgMaterializedView("v03b_round_stats").as((qb) =>
  qb
    .select({
      roundId: round.id,
      championship: sql<string>`v02b_team_round_stats.championship`.as("championship"),
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
    .where(and(eq(round.public, true), gt(v02b_teamRoundStats.totalScores, 0)))
    .groupBy(round.id, sql`v02b_team_round_stats.championship`),
);

export const v04a_teamStats = pgMaterializedView("v04a_team_stats").as((qb) =>
  qb
    .select({
      teamId: team.id,
      championship: sql<string>`${teamChampionship.championship}`.as("championship"),
      totalScores: coalesce(sum(v02b_teamRoundStats.totalScores), 0).as("total_scores"),
      rankTot: sql<number>`(RANK() OVER (
          PARTITION BY ${team.editionId}, ${teamChampionship.championship}
          ORDER BY ${coalesce(sum(v02b_teamRoundStats.totalScores), 0)} DESC
        ))::int`.as("rank_tot"),
      rankReg: sql<number>`(RANK() OVER (
          PARTITION BY ${team.editionId}, ${teamChampionship.championship}, ${institute.region}
          ORDER BY ${coalesce(sum(v02b_teamRoundStats.totalScores), 0)} DESC
        ))::int`.as("rank_reg"),
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
    .innerJoin(teamChampionship, eq(teamChampionship.teamId, team.id))
    .innerJoin(edition, and(eq(edition.id, team.editionId), eq(edition.public, true)))
    .innerJoin(
      round,
      and(
        eq(round.editionId, edition.id),
        eq(round.public, true),
        finalOnlyRegularFinalists(teamChampionship.championship),
      ),
    )
    .leftJoin(teamRound, and(eq(teamRound.teamId, team.id), eq(teamRound.roundId, round.id)))
    .leftJoin(
      v02b_teamRoundStats,
      and(
        eq(v02b_teamRoundStats.teamRoundId, teamRound.id),
        sql`v02b_team_round_stats.championship = team_championship.championship`,
      ),
    )
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .where(
      and(
        eq(team.hidden, false),
        notExists(
          qb
            .select({ id: penalizedTeamRound.id })
            .from(penalizedTeamRound)
            .innerJoin(
              teamRoundPenalization,
              eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
            )
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(penalizedTeamRound.teamId, team.id),
                eq(penalization.level, "red"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
              ),
            ),
        ),
      ),
    )
    .groupBy(team.id, teamChampionship.championship, team.editionId, institute.region),
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
    .innerJoin(team, and(eq(team.id, v04a_teamStats.teamId), eq(team.hidden, false)))
    .innerJoin(edition, and(eq(edition.id, team.editionId), eq(edition.public, true)))
    // i totali di edizione sono quelli del campionato regolare
    .where(sql`v04a_team_stats.championship = 'regolari'`)
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
    .innerJoin(team, and(eq(team.id, teamRound.teamId), eq(team.hidden, false)))
    .innerJoin(task, and(eq(task.roundId, teamRound.roundId), eq(task.regular, true)))
    .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    // istituti e task contati sui soli regolari, come le classifiche: un round
    // può ospitare anche i task degli esordienti, che qui non vanno contati
    .where(sql`v02b_team_round_stats.championship = 'regolari'`)
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
    .innerJoin(team, and(eq(team.id, teamRound.teamId), eq(team.hidden, false)))
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    // medaglie e rank dei soli regolari: i totali di istituto/regione non
    // devono mai mischiare i campionati
    .where(
      and(
        sql`v02b_team_round_stats.championship = 'regolari'`,
        sql`v04a_team_stats.championship = 'regolari'`,
      ),
    )
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
    .innerJoin(team, and(eq(team.id, teamRound.teamId), eq(team.hidden, false)))
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .where(
      and(
        sql`v02b_team_round_stats.championship = 'regolari'`,
        sql`v04a_team_stats.championship = 'regolari'`,
      ),
    )
    .groupBy(institute.region),
);
