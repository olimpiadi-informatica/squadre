import { random } from "lodash";

import { db } from "~/lib/db";
import { edition, institute, round, team, teamRound } from "~/lib/db/schema";
import { generateWord } from "~/lib/password";

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

  // await db.transaction(async (tx) => {
  await db.insert(edition).values({ id, year, title, public: 0 });

  await db.insert(round).values([
    { id: "1", editionId: id, title: "Round 1", fullscore: 0, public: 0, startsAt: round1Date },
    { id: "2", editionId: id, title: "Round 2", fullscore: 0, public: 0, startsAt: round2Date },
    { id: "3", editionId: id, title: "Round 3", fullscore: 0, public: 0, startsAt: round3Date },
    { id: "4", editionId: id, title: "Round 4", fullscore: 0, public: 0, startsAt: round4Date },
    {
      id: "final",
      editionId: id,
      title: "Final",
      fullscore: 0,
      public: 0,
      startsAt: roundFinalDate,
    },
  ]);

  if (institutes.length > 0) {
    await db.insert(institute).values(institutes).onConflictDoNothing();
  }

  if (teams.length > 0) {
    await db.insert(team).values(teams);

    const delays = Object.fromEntries(teams.map((t) => [t.instId, random(0, 600)]));

    const roundIds = ["1", "2", "3", "4", "final"];
    const teamRoundRows = teams.flatMap((t) =>
      roundIds.map((roundId) => ({
        roundId,
        editionId: id,
        teamId: t.id,
        score: 0,
        rankTot: 0,
        rankReg: 0,
        password: generateWord(),
        delay: delays[t.instId]!,
      })),
    );

    await db.insert(teamRound).values(teamRoundRows);
  }
  // });
}
