import clsx from "clsx";
import { Award } from "lucide-react";

const color = ["stroke-cyan-400", "stroke-amber-400", "stroke-gray-400", "stroke-amber-600"];

export function Medal({ rank, medal }: { rank: number; medal: number | null }) {
  return (
    <div>
      {rank}
      {medal != null && <Award className={clsx("inline-block", color[medal])} />}
    </div>
  );
}

export function Medals({ medals }: { medals: Record<number, number> }) {
  return (
    <div className="flex justify-center gap-2">
      {Object.entries(medals).map(([medal, count]) => (
        <div key={medal}>
          <Award className={clsx("inline-block", color[medal as keyof typeof color])} />
          {count}
        </div>
      ))}
    </div>
  );
}
