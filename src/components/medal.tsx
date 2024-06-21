import clsx from "clsx";
import { Award } from "lucide-react";

const color = ["stroke-cyan-400", "stroke-amber-400", "stroke-gray-400", "stroke-amber-600"];

export function Medal({ rank, teams }: { rank: number; teams: number }) {
  const rankRel = ((rank - 1) / (teams - 1)) * 100;

  return (
    <div>
      {rank}
      {rankRel === 0 && <Award className={clsx("inline-block", color[0])} />}
      {rankRel > 0 && rankRel <= 5 && <Award className={clsx("inline-block", color[1])} />}
      {rankRel > 5 && rankRel <= 15 && <Award className={clsx("inline-block", color[2])} />}
      {rankRel > 15 && rankRel <= 30 && <Award className={clsx("inline-block", color[3])} />}
    </div>
  );
}

export function Medals({ medals }: { medals: number[] }) {
  return (
    <div className="flex justify-center gap-2">
      {medals.map(
        (medal, i) =>
          !!medal && (
            <div key={i}>
              <Award className={clsx("inline-block", color[i])} />
              {medal}
            </div>
          ),
      )}
    </div>
  );
}
