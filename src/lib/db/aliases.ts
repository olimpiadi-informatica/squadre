import { alias } from "drizzle-orm/pg-core";

import { round, teamRound } from "./schema";

export const penalizedTeamRound = alias(teamRound, "penalized_team_round");
export const penalizedRound = alias(round, "penalized_round");
