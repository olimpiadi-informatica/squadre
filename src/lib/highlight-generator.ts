import { and, eq } from "drizzle-orm";
import { chunk, groupBy, keyBy, meanBy, orderBy, sum, sumBy, take } from "es-toolkit";

import { db } from "~/lib/db";
import {
  edition,
  highlight,
  institute,
  region,
  round,
  task,
  team,
  teamRound,
  teamTaskScore,
  v02b_teamRoundStats,
  v04a_teamStats,
} from "~/lib/db/schema";

export type HighlightInsert = {
  page: string;
  link: string;
  name: string;
  description: string;
};

type HighlightItem = Omit<HighlightInsert, "page">;

type Comparator<V> = (a: V, b: V) => number;

const compareNumbers: Comparator<number> = (a, b) => b - a;

const compareMedals: Comparator<readonly number[]> = (a, b) => {
  for (let i = 0; i < 4; i++) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const qualifiers: Record<string, string> = {
  awards: "best",
  rank: "highest",
  average: "highest",
  minimum: "highest",
  maximum: "highest",
  regional: "highest",
  full: "most",
  teams: "most",
  total: "most",
  points: "most",
  partial: "most",
  schools: "most",
};

function joiner(list: string[]): string {
  if (list.length === 0) return "";
  const joined =
    list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
  const firstWord = joined.split(" ")[0];
  const qualifier = qualifiers[firstWord] || "most";
  return `${qualifier} ${joined}`;
}

function findWinner<T, V>(
  items: readonly T[],
  valueFn: (item: T) => V,
  compareFn: Comparator<V>,
): { item: T; val: V } | null {
  if (items.length === 0) return null;
  const list = items
    .map((item) => ({ item, val: valueFn(item) }))
    .sort((a, b) => compareFn(a.val, b.val));

  if (list.length === 1 || compareFn(list[0].val, list[1].val) < 0) {
    return list[0];
  }
  return null;
}

interface Stat<T> {
  evaluate(items: readonly T[]): { item: T; text: string; weight: number } | null;
}

function createStat<T, V>(
  name: string,
  weight: number,
  getValue: (item: T) => V,
  compare: Comparator<V>,
  format: (val: V) => string,
): Stat<T> {
  return {
    evaluate(items) {
      const winner = findWinner(items, getValue, compare);
      if (!winner) return null;
      return {
        item: winner.item,
        weight,
        text: `${name} (${format(winner.val)})`,
      };
    },
  };
}

function numberStat<T>(
  name: string,
  weight: number,
  getValue: (item: T) => number,
  compare: Comparator<number> = compareNumbers,
): Stat<T> {
  return createStat(name, weight, getValue, compare, (val) =>
    name === "average rank" ? `${Math.round(Math.abs(val))}%` : String(Math.round(Math.abs(val))),
  );
}

function medalsStat<T>(
  name: string,
  weight: number,
  getMedals: (item: T) => readonly number[],
): Stat<T> {
  return createStat(name, weight, getMedals, compareMedals, (medals) => String(sum(medals)));
}

function recordAchievement<K>(
  scoresMap: Map<K, { score: number; achievements: { weight: number; text: string }[] }>,
  key: K,
  winner: { weight: number; text: string },
) {
  const entry = scoresMap.get(key);
  if (entry) {
    entry.score += winner.weight;
    entry.achievements.push({
      weight: winner.weight,
      text: winner.text,
    });
  }
}

function bestof<T, V>(
  list: readonly T[],
  scoreFn: (item: T) => V,
  addrFn: (item: T) => readonly (string | number)[],
  titleFn: (item: T) => string,
  desc: string | ((score: V) => string),
  compareFn: Comparator<V>,
  aggregateFn?: (a: V, b: V) => V,
  formatScore?: (score: V) => string,
): HighlightItem | null {
  if (list.length === 0) return null;

  const grouped = groupBy(list, (item) => addrFn(item).map(String).join("/"));
  const candidates = Object.entries(grouped).map(([addr, items]) => {
    const score = aggregateFn ? items.map(scoreFn).reduce(aggregateFn) : scoreFn(items[0]);
    return { addr, title: titleFn(items[0]), score };
  });

  candidates.sort((a, b) => compareFn(a.score, b.score));

  if (candidates.length === 0) return null;
  if (candidates.length > 1 && compareFn(candidates[0].score, candidates[1].score) >= 0) {
    return null;
  }

  const best = candidates[0];
  let descriptionStr = "";
  if (typeof desc === "function") {
    descriptionStr = desc(best.score);
  } else if (desc.endsWith("%")) {
    const formatted = formatScore ? formatScore(best.score) : String(best.score);
    descriptionStr = `${desc.slice(0, -1)}(${formatted})`;
  } else {
    descriptionStr = desc;
  }

  return {
    link: `/${best.addr}`,
    name: best.title,
    description: descriptionStr,
  };
}

function bestofNumber<T>(
  list: readonly T[],
  scoreFn: (item: T) => number,
  addrFn: (item: T) => readonly (string | number)[],
  titleFn: (item: T) => string,
  desc: string | ((score: number) => string),
): HighlightItem | null {
  return bestof(
    list,
    scoreFn,
    addrFn,
    titleFn,
    desc,
    compareNumbers,
    (a, b) => a + b,
    (val) => String(Math.round(val)),
  );
}

type RawData = {
  editions: { id: string; title: string; year: string; public: boolean }[];
  rounds: {
    id: number;
    slug: string;
    editionId: string;
    title: string;
    fullscore: number;
    public: boolean;
  }[];
  tasks: { id: number; slug: string; roundId: number; title: string }[];
  teams: {
    id: number;
    slug: string;
    editionId: string;
    name: string;
    instituteId: string;
    coach: string;
    finalist: boolean | null;
    junior: boolean;
  }[];
  institutes: { id: string; name: string; city: string; region: string }[];
  regions: { id: string; name: string }[];
  teamRounds: {
    id: number;
    roundId: number;
    teamId: number;
    totalScores: string | number | null;
    rankTot: string | number | null;
    rankReg: string | number | null;
    medal: number | null;
  }[];
  teamStats: {
    id: number;
    totalScores: string | number | null;
    rankTot: string | number | null;
    rankReg: string | number | null;
    totalMedals: Record<number, number> | null;
  }[];
  scores: { taskId: number; teamId: number; score: number }[];
};

export function computeAllHighlights(data: RawData): HighlightInsert[] {
  type InstObj = (typeof data.institutes)[number] & {
    fullName: string;
    editions: Map<string, TeamObj[]>;
    totalPoints: number;
    teamsCount: number;
    medals: number[];
    bestedrank: number;
    bestrank: number;
    bestavgrank: number;
    avgrank: number;
  };

  type RegObj = (typeof data.regions)[number] & {
    institutes: Set<InstObj>;
    teams: TeamObj[];
    teamsCount: number;
    points: number;
    medals: number[];
    bestedrank: number;
    bestrank: number;
    bestavgrank: number;
  };

  type TeamObj = (typeof data.teams)[number] & {
    rounds: Map<number, (typeof data.teamRounds)[number]>;
    scores: Map<number, number>;
    points: number;
    rankTot: number;
    rankReg: number;
    bestrank: number;
    medals: number[];
    avgrank: number;
    institute?: InstObj;
    region?: RegObj;
  };

  type TaskObj = (typeof data.tasks)[number] & {
    scoresSum: number;
    fullscores: number;
    average: number;
  };

  type RoundObj = (typeof data.rounds)[number] & {
    tasks: TaskObj[];
  };

  type EditionObj = (typeof data.editions)[number] & {
    rounds: RoundObj[];
    teams: TeamObj[];
  };

  const institutesMap = new Map<string, InstObj>();
  for (const row of data.institutes) {
    institutesMap.set(row.id, {
      ...row,
      fullName: `${row.name}, ${row.city}`,
      editions: new Map(),
      totalPoints: 0,
      teamsCount: 0,
      medals: [0, 0, 0, 0],
      bestedrank: 1e9,
      bestrank: 1e9,
      bestavgrank: 0,
      avgrank: 0,
    });
  }

  const regionsMap = new Map<string, RegObj>();
  for (const row of data.regions) {
    regionsMap.set(row.id, {
      ...row,
      institutes: new Set(),
      teams: [],
      teamsCount: 0,
      points: 0,
      medals: [0, 0, 0, 0],
      bestedrank: 1e9,
      bestrank: 1e9,
      bestavgrank: 0,
    });
  }

  const teamsMap = new Map<number, TeamObj>();
  for (const row of data.teams) {
    teamsMap.set(row.id, {
      ...row,
      rounds: new Map(),
      scores: new Map(),
      points: 0,
      rankTot: 1e9,
      rankReg: 1e9,
      bestrank: 1e9,
      medals: [0, 0, 0, 0],
      avgrank: 0,
    });
  }

  const teamStatsById = keyBy(data.teamStats, (ts) => ts.id);
  for (const t of teamsMap.values()) {
    const stat = teamStatsById[t.id];
    if (stat) {
      t.points = Number(stat.totalScores || 0);
      t.rankTot = Number(stat.rankTot || 1e9);
      t.rankReg = Number(stat.rankReg || 1e9);
      if (stat.totalMedals) {
        t.medals = [
          Number(stat.totalMedals[0] || 0),
          Number(stat.totalMedals[1] || 0),
          Number(stat.totalMedals[2] || 0),
          Number(stat.totalMedals[3] || 0),
        ];
      }
    }
  }

  for (const tr of data.teamRounds) {
    const t = teamsMap.get(tr.teamId);
    if (t) {
      t.rounds.set(tr.roundId, tr);
      t.bestrank = Math.min(t.bestrank, Number(tr.rankTot || 1e9));
    }
  }

  for (const sc of data.scores) {
    const t = teamsMap.get(sc.teamId);
    if (t) {
      t.scores.set(sc.taskId, Number(sc.score));
    }
  }

  const editionsMap = new Map<string, EditionObj>();
  for (const ed of data.editions) {
    editionsMap.set(ed.id, {
      ...ed,
      rounds: [],
      teams: [],
    });
  }

  const roundsMap = new Map<number, RoundObj>();
  for (const r of data.rounds) {
    const roundObj: RoundObj = {
      ...r,
      tasks: [],
    };
    roundsMap.set(r.id, roundObj);
    const ed = editionsMap.get(r.editionId);
    if (ed) ed.rounds.push(roundObj);
  }

  const tasksMap = new Map<number, TaskObj>();
  for (const task of data.tasks) {
    const taskObj: TaskObj = {
      ...task,
      scoresSum: 0,
      fullscores: 0,
      average: 0,
    };
    tasksMap.set(task.id, taskObj);
    const r = roundsMap.get(task.roundId);
    if (r) r.tasks.push(taskObj);
  }

  for (const t of teamsMap.values()) {
    const ed = editionsMap.get(t.editionId);
    if (ed) ed.teams.push(t);
    const inst = institutesMap.get(t.instituteId);
    if (inst) {
      t.institute = inst;
      if (!inst.editions.has(t.editionId)) {
        inst.editions.set(t.editionId, []);
      }
      inst.editions.get(t.editionId)!.push(t);
      inst.teamsCount++;
      inst.totalPoints += t.points;
      for (let m = 0; m < 4; m++) inst.medals[m] += t.medals[m];
      inst.bestedrank = Math.min(inst.bestedrank, t.rankTot);
      inst.bestrank = Math.min(inst.bestrank, t.bestrank);
      const reg = regionsMap.get(inst.region);
      if (reg) {
        t.region = reg;
        reg.teams.push(t);
      }
    }
  }

  for (const ed of editionsMap.values()) {
    const totalTeams = ed.teams.length;
    for (const r of ed.rounds) {
      for (const task of r.tasks) {
        for (const t of ed.teams) {
          const score = t.scores.get(task.id);
          if (score !== undefined) {
            task.scoresSum += score;
            if (score === 100) task.fullscores++;
          }
        }
        task.average = totalTeams > 0 ? task.scoresSum / totalTeams : 0;
      }
    }

    for (const t of ed.teams) {
      const activeRounds = ed.rounds.filter((r) => r.slug !== "final" || t.finalist);
      const sumLoss = sumBy(activeRounds, (r) => {
        const tr = t.rounds.get(r.id);
        const rank = tr ? Number(tr.rankTot) : totalTeams;
        return rank / totalTeams;
      });
      t.avgrank = activeRounds.length > 0 ? 100 - (100 * sumLoss) / activeRounds.length : 0;
      const inst = institutesMap.get(t.instituteId);
      if (inst) {
        inst.bestavgrank = Math.max(inst.bestavgrank, t.avgrank);
      }
    }
  }

  for (const inst of institutesMap.values()) {
    const allInstTeams = Array.from(inst.editions.values()).flat();
    if (allInstTeams.length > 0) {
      inst.avgrank = meanBy(allInstTeams, (t) => t.avgrank);
    }
    const reg = regionsMap.get(inst.region);
    if (reg) {
      reg.institutes.add(inst);
      reg.teamsCount += inst.teamsCount;
      reg.points += inst.totalPoints;
      for (let m = 0; m < 4; m++) reg.medals[m] += inst.medals[m];
      reg.bestedrank = Math.min(reg.bestedrank, inst.bestedrank);
      reg.bestrank = Math.min(reg.bestrank, inst.bestrank);
      reg.bestavgrank = Math.max(reg.bestavgrank, inst.avgrank);
    }
  }

  const allHighlights: HighlightInsert[] = [];

  // 1. /edition (History view)
  const allTeamsList = Array.from(teamsMap.values());
  const allTasksList = Array.from(tasksMap.values()).filter((t) => roundsMap.has(t.roundId));
  const allInstitutesList = Array.from(institutesMap.values()).filter((i) => i.teamsCount > 0);

  const h1 = bestofNumber(
    allTeamsList,
    (t) => t.avgrank,
    (t) => ["edition", t.editionId, "team", t.slug],
    (t) => t.name,
    "is the team with the highest average rank",
  );
  if (h1) allHighlights.push({ page: "/edition", ...h1 });

  const h2 = bestofNumber(
    allTeamsList,
    (t) => t.points,
    (t) => ["edition", t.editionId, "team", t.slug],
    (t) => t.name,
    "is the team with the highest total score",
  );
  if (h2) allHighlights.push({ page: "/edition", ...h2 });

  const h3 = bestofNumber(
    allTasksList,
    (t) => -t.average,
    (t) => {
      const r = roundsMap.get(t.roundId)!;
      return ["edition", r.editionId, "round", r.slug, t.slug];
    },
    (t) => t.title,
    "is the most difficult task",
  );
  if (h3) allHighlights.push({ page: "/edition", ...h3 });

  const h4 = bestofNumber(
    allInstitutesList,
    (i) => i.totalPoints,
    (i) => ["region", i.region, i.id],
    (i) => i.name,
    "is the institute with the most points %",
  );
  if (h4) allHighlights.push({ page: "/edition", ...h4 });

  // 2. /region (Italy view)
  const italyStats: Stat<RegObj>[] = [
    numberStat("schools", 1.9, (r) => r.institutes.size),
    numberStat("teams", 1.8, (r) => r.teamsCount),
    numberStat("points per team", 1.7, (r) => (r.teamsCount > 0 ? r.points / r.teamsCount : 0)),
    numberStat("total points", 1.6, (r) => r.points),
    medalsStat("awards", 1.4, (r) => r.medals),
    numberStat("average rank", 1.5, (r) => r.bestavgrank),
  ];

  const regionScores = new Map<
    string,
    { score: number; achievements: { weight: number; text: string }[] }
  >();
  for (const r of regionsMap.values()) {
    regionScores.set(r.id, { score: 0, achievements: [] });
  }

  const allRegionsList = Array.from(regionsMap.values());
  for (const st of italyStats) {
    const winner = st.evaluate(allRegionsList);
    if (winner) {
      recordAchievement(regionScores, winner.item.id, winner);
    }
  }

  const topRegions = take(
    orderBy(
      Array.from(regionsMap.values())
        .map((r) => ({ region: r, ...regionScores.get(r.id)! }))
        .filter((r) => r.score > 0),
      [(r) => r.score],
      ["desc"],
    ),
    3,
  );

  for (const tr of topRegions) {
    const sortedAchievements = orderBy(tr.achievements, [(a) => a.weight], ["desc"]).map(
      (a) => a.text,
    );
    allHighlights.push({
      page: "/region",
      link: `/region/${tr.region.id}`,
      name: tr.region.name,
      description: `is the region with the ${joiner(sortedAchievements)}`,
    });
  }

  // 3. /edition/:editionId
  for (const ed of editionsMap.values()) {
    const edPage = `/edition/${ed.id}`;
    const edTasks = ed.rounds.flatMap((r) => r.tasks);

    // Task più difficile dell'edizione
    const edH1 = bestofNumber(
      edTasks,
      (t) => -t.average,
      (t) => {
        const r = roundsMap.get(t.roundId)!;
        return ["edition", ed.id, "round", r.slug, t.slug];
      },
      (t) => t.title,
      "is the most difficult task of this edition",
    );
    if (edH1) allHighlights.push({ page: edPage, ...edH1 });

    // Istituto con più punti nell'edizione
    const edH2 = bestofNumber(
      ed.teams,
      (t) => t.points,
      (t) => ["region", t.institute!.region, t.institute!.id],
      (t) => t.institute!.fullName,
      "is the institute with the most points %",
    );
    if (edH2) allHighlights.push({ page: edPage, ...edH2 });

    // Regione con più punti nell'edizione
    const edH3 = bestofNumber(
      ed.teams,
      (t) => t.points,
      (t) => ["region", t.region!.id],
      (t) => t.region!.name,
      "is the region with the most points %",
    );
    if (edH3) allHighlights.push({ page: edPage, ...edH3 });

    // Squadra con i migliori premi nell'edizione
    const edH4 = bestof(
      ed.teams,
      (t) => t.medals,
      (t) => ["edition", ed.id, "team", t.slug],
      (t) => t.name,
      "is the team with the best awards",
      compareMedals,
    );
    if (edH4) allHighlights.push({ page: edPage, ...edH4 });

    // 4. /edition/:editionId/round/:roundSlug
    for (const r of ed.rounds) {
      const roundPage = `/edition/${ed.id}/round/${r.slug}`;
      const rTeams = ed.teams.filter((t) => t.rounds.has(r.id));

      const rH1 = bestofNumber(
        r.tasks,
        (t) => -t.average,
        (t) => ["edition", ed.id, "round", r.slug, t.slug],
        (t) => t.title,
        "is the most difficult task of this contest",
      );
      if (rH1) allHighlights.push({ page: roundPage, ...rH1 });

      const rH2 = bestofNumber(
        rTeams,
        (t) => Number(t.rounds.get(r.id)!.totalScores || 0),
        (t) => ["region", t.institute!.region, t.institute!.id],
        (t) => t.institute!.fullName,
        "is the institute with the most points %",
      );
      if (rH2) allHighlights.push({ page: roundPage, ...rH2 });

      const rH3 = bestofNumber(
        rTeams,
        (t) => Number(t.rounds.get(r.id)!.totalScores || 0),
        (t) => ["region", t.region!.id],
        (t) => t.region!.name,
        "is the region with the most points %",
      );
      if (rH3) allHighlights.push({ page: roundPage, ...rH3 });

      // 5. /edition/:editionId/round/:roundSlug/:taskSlug
      for (const task of r.tasks) {
        const taskPage = `/edition/${ed.id}/round/${r.slug}/${task.slug}`;
        const tTeams = ed.teams.filter((t) => t.scores.has(task.id));

        const tH1 = bestofNumber(
          tTeams,
          (t) => t.scores.get(task.id) || 0,
          (t) => ["region", t.institute!.region, t.institute!.id],
          (t) => t.institute!.fullName,
          "is the institute with the most points %",
        );
        if (tH1) allHighlights.push({ page: taskPage, ...tH1 });

        const tH2 = bestofNumber(
          tTeams,
          (t) => t.scores.get(task.id) || 0,
          (t) => ["region", t.region!.id],
          (t) => t.region!.name,
          "is the region with the most points %",
        );
        if (tH2) allHighlights.push({ page: taskPage, ...tH2 });
      }
    }

    // 8. /edition/:editionId/team/:teamSlug
    type TeamContestObj = {
      round: RoundObj;
      scores: number[];
      total: number;
      rankTot: number;
      rankReg: number;
      minScore: number;
      maxScore: number;
      partialScores: number;
      fullScores: number;
    };

    const teamStatsDef: Stat<TeamContestObj>[] = [
      numberStat("minimum score", 1.6, (cr) => cr.minScore),
      numberStat("maximum score", 1.6, (cr) => cr.maxScore),
      numberStat("partial scores", 1.6, (cr) => cr.partialScores),
      numberStat("full scores", 1.7, (cr) => cr.fullScores),
      numberStat("total points", 1.8, (cr) => cr.total),
      numberStat("rank", 1.9, (cr) => -cr.rankTot),
      numberStat("regional rank", 1.5, (cr) => -cr.rankReg),
    ];

    for (const t of ed.teams) {
      const teamPage = `/edition/${ed.id}/team/${t.slug}`;
      const teamContests: TeamContestObj[] = [];

      for (const r of ed.rounds) {
        if (r.slug === "final" && !t.finalist) break;
        const tr = t.rounds.get(r.id);
        const taskScores = r.tasks.map((task) => t.scores.get(task.id) || 0);
        teamContests.push({
          round: r,
          scores: taskScores,
          total: Number(tr ? tr.totalScores : 0),
          rankTot: Number(tr ? tr.rankTot : 1e9),
          rankReg: Number(tr ? tr.rankReg : 1e9),
          minScore: taskScores.length > 0 ? Math.min(...taskScores) : 0,
          maxScore: taskScores.length > 0 ? Math.max(...taskScores) : 0,
          partialScores: taskScores.filter((s) => s > 0).length,
          fullScores: taskScores.filter((s) => s === 100).length,
        });
      }

      const contestScores = new Map<
        number,
        { score: number; achievements: { weight: number; text: string }[] }
      >();
      for (const tc of teamContests) {
        contestScores.set(tc.round.id, { score: 0, achievements: [] });
      }

      for (const st of teamStatsDef) {
        const winner = st.evaluate(teamContests);
        if (winner) {
          recordAchievement(contestScores, winner.item.round.id, winner);
        }
      }

      const topContests = take(
        orderBy(
          teamContests
            .map((tc) => ({ contest: tc, ...contestScores.get(tc.round.id)! }))
            .filter((c) => c.score > 0),
          [(c) => c.score],
          ["desc"],
        ),
        3,
      );

      const teamHighlights = topContests.map((tc) => {
        const sortedAchievements = orderBy(tc.achievements, [(a) => a.weight], ["desc"]).map(
          (a) => a.text,
        );
        return {
          page: teamPage,
          link: `/edition/${ed.id}/round/${tc.contest.round.slug}`,
          name: tc.contest.round.title,
          description: `is the round with the ${joiner(sortedAchievements)}`,
        };
      });

      // Hardest task solved by team (max over all tasks in team's contests)
      const allTeamTasks = teamContests.flatMap((tc) =>
        tc.round.tasks.map((task) => ({
          task,
          round: tc.round,
          score: t.scores.get(task.id) ?? 0,
        })),
      );

      const hardest =
        allTeamTasks.length > 0
          ? orderBy(
              allTeamTasks,
              [(item) => item.score, (item) => item.task.fullscores, (item) => item.task.average],
              ["desc", "asc", "asc"],
            )[0]
          : null;

      if (hardest) {
        teamHighlights.unshift({
          page: teamPage,
          link: `/edition/${ed.id}/round/${hardest.round.slug}/${hardest.task.slug}`,
          name: hardest.task.title,
          description: "is the hardest task solved by the team",
        });
      }

      for (const th of teamHighlights) {
        allHighlights.push(th);
      }
    }
  }

  // 6. /region/:regionId
  const regionSchoolStats: Stat<InstObj>[] = [
    numberStat("teams", 1.7, (i) => i.teamsCount),
    numberStat("points per team", 1.8, (i) =>
      i.teamsCount > 0 ? i.totalPoints / i.teamsCount : 0,
    ),
    numberStat("total points", 1.6, (i) => i.totalPoints),
    medalsStat("awards", 1.4, (i) => i.medals),
    numberStat("average rank", 1.5, (i) => i.bestavgrank),
  ];

  const regionTeamStats: Stat<TeamObj>[] = [
    numberStat("total points", 1.2, (t) => t.points),
    medalsStat("awards", 1.3, (t) => t.medals),
    numberStat("average rank", 1.1, (t) => t.avgrank),
    numberStat("rank", 1.0, (t) => -t.rankTot),
  ];

  for (const reg of regionsMap.values()) {
    const regPage = `/region/${reg.id}`;
    const regInstitutes = Array.from(reg.institutes).filter((i) => i.teamsCount > 0);
    const regTeams = reg.teams;

    const itemScores = new Map<
      string,
      {
        link: string;
        name: string;
        type: "school" | "team";
        score: number;
        achievements: { weight: number; text: string }[];
      }
    >();

    for (const inst of regInstitutes) {
      itemScores.set(`school:${inst.id}`, {
        type: "school",
        link: `/region/${reg.id}/${inst.id}`,
        name: inst.name,
        score: 0,
        achievements: [],
      });
    }
    for (const t of regTeams) {
      itemScores.set(`team:${t.id}`, {
        type: "team",
        link: `/edition/${t.editionId}/team/${t.slug}`,
        name: t.name,
        score: 0,
        achievements: [],
      });
    }

    for (const st of regionSchoolStats) {
      const winner = st.evaluate(regInstitutes);
      if (winner) {
        recordAchievement(itemScores, `school:${winner.item.id}`, winner);
      }
    }
    for (const st of regionTeamStats) {
      const winner = st.evaluate(regTeams);
      if (winner) {
        recordAchievement(itemScores, `team:${winner.item.id}`, winner);
      }
    }

    const topItems = take(
      orderBy(
        Array.from(itemScores.values()).filter((x) => x.score > 0),
        [(x) => x.score],
        ["desc"],
      ),
      3,
    );

    for (const item of topItems) {
      const sortedAchievements = orderBy(item.achievements, [(a) => a.weight], ["desc"]).map(
        (a) => a.text,
      );
      allHighlights.push({
        page: regPage,
        link: item.link,
        name: item.name,
        description: `is the ${item.type} with the ${joiner(sortedAchievements)}`,
      });
    }
  }

  // 7. /region/:regionId/:instituteId
  type InstEdObj = {
    id: string;
    year: string;
    teams: TeamObj[];
    points: number;
    medals: number[];
    avgrank: number;
  };

  const instEditionStats: Stat<InstEdObj>[] = [
    numberStat("teams", 1.1, (ed) => ed.teams.length),
    numberStat("total points", 1.2, (ed) => ed.points),
    medalsStat("awards", 1.0, (ed) => ed.medals),
    numberStat("points per team", 1.4, (ed) =>
      ed.teams.length > 0 ? ed.points / ed.teams.length : 0,
    ),
    numberStat("average rank", 1.3, (ed) => ed.avgrank),
  ];

  const instTeamStats: Stat<TeamObj>[] = [
    numberStat("total points", 1.5, (t) => t.points),
    medalsStat("awards", 1.9, (t) => t.medals),
    numberStat("average rank", 1.6, (t) => t.avgrank),
    numberStat("rank", 1.8, (t) => -t.rankTot),
    numberStat("regional rank", 1.7, (t) => -t.rankReg),
  ];

  for (const inst of institutesMap.values()) {
    if (inst.teamsCount === 0) continue;
    const instPage = `/region/${inst.region}/${inst.id}`;

    const instEditions: InstEdObj[] = [];
    for (const [edId, edTeams] of inst.editions.entries()) {
      const ed = editionsMap.get(edId);
      if (!ed) continue;
      instEditions.push({
        id: ed.id,
        year: ed.year,
        teams: edTeams,
        points: sumBy(edTeams, (t) => t.points),
        medals: [
          sumBy(edTeams, (t) => t.medals[0] ?? 0),
          sumBy(edTeams, (t) => t.medals[1] ?? 0),
          sumBy(edTeams, (t) => t.medals[2] ?? 0),
          sumBy(edTeams, (t) => t.medals[3] ?? 0),
        ],
        avgrank: edTeams.length > 0 ? meanBy(edTeams, (t) => t.avgrank) : 0,
      });
    }

    const instTeams = instEditions.flatMap((ed) => ed.teams);

    const instScores = new Map<
      string,
      {
        link: string;
        name: string;
        type: "edition" | "team";
        score: number;
        achievements: { weight: number; text: string }[];
      }
    >();

    for (const ed of instEditions) {
      instScores.set(`edition:${ed.id}`, {
        type: "edition",
        link: `/edition/${ed.id}`,
        name: `OIS ${ed.year.split(" ")[0]}`,
        score: 0,
        achievements: [],
      });
    }
    for (const t of instTeams) {
      instScores.set(`team:${t.id}`, {
        type: "team",
        link: `/edition/${t.editionId}/team/${t.slug}`,
        name: t.name,
        score: 0,
        achievements: [],
      });
    }

    for (const st of instEditionStats) {
      const winner = st.evaluate(instEditions);
      if (winner) {
        recordAchievement(instScores, `edition:${winner.item.id}`, winner);
      }
    }
    for (const st of instTeamStats) {
      const winner = st.evaluate(instTeams);
      if (winner) {
        recordAchievement(instScores, `team:${winner.item.id}`, winner);
      }
    }

    const topItems = take(
      orderBy(
        Array.from(instScores.values()).filter((x) => x.score > 0),
        [(x) => x.score],
        ["desc"],
      ),
      3,
    );

    for (const item of topItems) {
      const sortedAchievements = orderBy(item.achievements, [(a) => a.weight], ["desc"]).map(
        (a) => a.text,
      );
      allHighlights.push({
        page: instPage,
        link: item.link,
        name: item.name,
        description: `is the ${item.type} with the ${joiner(sortedAchievements)}`,
      });
    }
  }

  return allHighlights;
}

export async function refreshHighlights(): Promise<void> {
  const [editions, rounds, tasks, teams, institutes, regions, teamRounds, teamStats, scores] =
    await Promise.all([
      db
        .select({
          id: edition.id,
          title: edition.title,
          year: edition.year,
          public: edition.public,
        })
        .from(edition)
        .where(eq(edition.public, true))
        .orderBy(edition.id),

      db
        .select({
          id: round.id,
          slug: round.slug,
          editionId: round.editionId,
          title: round.title,
          fullscore: round.fullscore,
          public: round.public,
        })
        .from(round)
        .where(eq(round.public, true))
        .orderBy(round.id),

      db
        .select({
          id: task.id,
          slug: task.slug,
          roundId: task.roundId,
          title: task.title,
        })
        .from(task)
        .orderBy(task.id),

      db
        .select({
          id: team.id,
          slug: team.slug,
          editionId: team.editionId,
          name: team.name,
          instituteId: team.instituteId,
          coach: team.coach,
          finalist: team.finalist,
          junior: team.junior,
        })
        .from(team)
        .where(and(eq(team.junior, false), eq(team.hidden, false)))
        .orderBy(team.id),

      db
        .select({
          id: institute.id,
          name: institute.name,
          city: institute.city,
          region: institute.region,
        })
        .from(institute),

      db
        .select({
          id: region.id,
          name: region.name,
        })
        .from(region),

      db
        .select({
          id: teamRound.id,
          roundId: teamRound.roundId,
          teamId: teamRound.teamId,
          totalScores: v02b_teamRoundStats.totalScores,
          rankTot: v02b_teamRoundStats.rankTot,
          rankReg: v02b_teamRoundStats.rankReg,
          medal: v02b_teamRoundStats.medal,
        })
        .from(teamRound)
        .innerJoin(v02b_teamRoundStats, eq(v02b_teamRoundStats.teamRoundId, teamRound.id)),

      db
        .select({
          id: v04a_teamStats.teamId,
          totalScores: v04a_teamStats.totalScores,
          rankTot: v04a_teamStats.rankTot,
          rankReg: v04a_teamStats.rankReg,
          totalMedals: v04a_teamStats.totalMedals,
        })
        .from(v04a_teamStats),

      db
        .select({
          taskId: teamTaskScore.taskId,
          teamId: teamTaskScore.teamId,
          score: teamTaskScore.score,
        })
        .from(teamTaskScore),
    ]);

  const allHighlights = computeAllHighlights({
    editions,
    rounds,
    tasks,
    teams,
    institutes,
    regions,
    teamRounds,
    teamStats,
    scores,
  });

  await db.transaction(async (tx) => {
    await tx.delete(highlight);
    for (const batch of chunk(allHighlights, 2000)) {
      await tx.insert(highlight).values(batch);
    }
  });
}
