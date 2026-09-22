import { eq, sql } from "drizzle-orm";

import { db } from "~/lib/db";
import { institute, round, team, teamRound } from "~/lib/db/schema";
import { generateWord } from "~/lib/password";

export const TEST_INSTITUTE_ALDINI = {
  id: "TEST001",
  name: "Itis Dei Miei Stivali",
  city: "Radinoreto",
  region: "mol",
  email: "ois@aldini.istruzioneer.it",
  schoolEmail: null,
};

export const TEST_INSTITUTE_STAFF = {
  id: "TEST002",
  name: "Liceo Scientifico Tonnate Iproblemi",
  city: "Radinoreto",
  region: "mol",
  email: "ois-staff@googlegroups.com",
  schoolEmail: null,
};

export const TEST_INSTITUTES = [TEST_INSTITUTE_ALDINI, TEST_INSTITUTE_STAFF];

export const TEST_TEAMS = [
  // Gruppo 1: inviato a ois@aldini.istruzioneer.it
  {
    slug: "t-ois-001",
    name: "Fuffole Buffose",
    instituteId: TEST_INSTITUTE_ALDINI.id,
    coach: "OIS Staff",
    junior: false,
    hidden: true,
    unrestricted: false,
  },
  {
    slug: "b-ois-002",
    name: "I Trùzzi",
    instituteId: TEST_INSTITUTE_ALDINI.id,
    coach: "OIS Staff",
    junior: true,
    hidden: true,
    unrestricted: false,
  },
  {
    slug: "bt-ois-003",
    name: "Nerd+Nerd",
    instituteId: TEST_INSTITUTE_ALDINI.id,
    coach: "OIS Staff",
    junior: false,
    hidden: true,
    unrestricted: false,
  },
  // Gruppo 2: i "tonni", inviati a ois-staff@googlegroups.com
  {
    slug: "tonno",
    name: "Fuffole Buffose",
    instituteId: TEST_INSTITUTE_STAFF.id,
    coach: "OIS Staff",
    junior: false,
    hidden: true,
    unrestricted: true,
  },
  {
    slug: "bonno",
    name: "I Trùzzi",
    instituteId: TEST_INSTITUTE_STAFF.id,
    coach: "OIS Staff",
    junior: true,
    hidden: true,
    unrestricted: true,
  },
  {
    slug: "btonno",
    name: "Nerd+Nerd",
    instituteId: TEST_INSTITUTE_STAFF.id,
    coach: "OIS Staff",
    junior: true,
    hidden: true,
    unrestricted: true,
  },
];

export async function seedTestUsers(editionId: string): Promise<void> {
  // 1. Inserisci o aggiorna gli istituti di test
  for (const inst of TEST_INSTITUTES) {
    await db
      .insert(institute)
      .values(inst)
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

  // 2. Inserisci o aggiorna le squadre di test per questa edizione
  const insertedTeamIds: number[] = [];
  for (const t of TEST_TEAMS) {
    const [teamRow] = await db
      .insert(team)
      .values({
        ...t,
        editionId,
        finalist: false,
      })
      .onConflictDoUpdate({
        target: [team.slug, team.editionId],
        set: {
          name: t.name,
          instituteId: t.instituteId,
          coach: t.coach,
          junior: t.junior,
          hidden: t.hidden,
          unrestricted: t.unrestricted,
        },
      })
      .returning({ id: team.id });

    if (teamRow) {
      insertedTeamIds.push(teamRow.id);
    }
  }

  // 3. Recupera tutti i round di questa edizione
  const roundRows = await db
    .select({ id: round.id })
    .from(round)
    .where(eq(round.editionId, editionId));

  // 4. Inserisci i record team_round con password casuale (senza sovrascrivere quelle esistenti)
  for (const r of roundRows) {
    for (const teamId of insertedTeamIds) {
      await db
        .insert(teamRound)
        .values({
          roundId: r.id,
          teamId,
          password: generateWord(),
          delay: 0,
        })
        .onConflictDoNothing({
          target: [teamRound.roundId, teamRound.teamId],
        });
    }
  }
}
