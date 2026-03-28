import { sql } from "drizzle-orm";
import { random } from "lodash";

import { generateWord } from "~/lib/password";

import { db } from "./db";
import { edition, institute, round, team, teamRound } from "./db/schema";

export type EditionData = {
  id: string;
  year: string;
  title: string;
  round1Date: Date;
  round2Date: Date;
  round3Date: Date;
  round4Date: Date;
  roundFinalDate: Date;
};

type InstituteInsert = typeof institute.$inferInsert;
type TeamInsert = typeof team.$inferInsert;

export async function createNewEdition(
  data: EditionData,
  institutes: InstituteInsert[],
  teams: TeamInsert[],
): Promise<void> {
  const { id, year, title, round1Date, round2Date, round3Date, round4Date, roundFinalDate } = data;

  await db.transaction(async (tx) => {
    await tx.insert(edition).values({ id, year, title, public: false });

    const roundRows = await tx
      .insert(round)
      .values([
        {
          slug: "1",
          editionId: id,
          title: "Round 1",
          fullscore: 0,
          public: false,
          startsAt: round1Date,
        },
        {
          slug: "2",
          editionId: id,
          title: "Round 2",
          fullscore: 0,
          public: false,
          startsAt: round2Date,
        },
        {
          slug: "3",
          editionId: id,
          title: "Round 3",
          fullscore: 0,
          public: false,
          startsAt: round3Date,
        },
        {
          slug: "4",
          editionId: id,
          title: "Round 4",
          fullscore: 0,
          public: false,
          startsAt: round4Date,
        },
        {
          slug: "final",
          editionId: id,
          title: "Final",
          fullscore: 0,
          public: false,
          startsAt: roundFinalDate,
        },
      ])
      .returning({ id: round.id, slug: round.slug });

    if (institutes.length > 0) {
      await tx
        .insert(institute)
        .values(institutes)
        .onConflictDoUpdate({
          target: institute.id,
          set: {
            name: sql.raw(`EXCLUDED.${institute.name.name}`),
            city: sql.raw(`EXCLUDED.${institute.city.name}`),
            region: sql.raw(`EXCLUDED.${institute.region.name}`),
            email: sql.raw(`EXCLUDED.${institute.email.name}`),
          },
        });
    }

    if (teams.length > 0) {
      const teamRows = await tx
        .insert(team)
        .values(teams)
        .returning({ id: team.id, instituteId: team.instituteId });

      const delays = Object.fromEntries(teams.map((t) => [t.instituteId, random(0, 600)]));

      await tx.insert(teamRound).values(
        teamRows.flatMap((t) =>
          roundRows.map(
            (round) =>
              ({
                roundId: round.id,
                teamId: t.id,
                password: generateWord(),
                delay: round.slug.length === 1 ? delays[t.instituteId]! : 0,
              }) satisfies typeof teamRound.$inferInsert,
          ),
        ),
      );
    }
  });
}
