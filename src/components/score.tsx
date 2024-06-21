import clsx from "clsx";

export function Score({
  score,
  maxScore,
  className,
}: {
  score: number;
  maxScore: number;
  className?: string;
}) {
  const percent = Math.floor((score / maxScore) * 100);

  return (
    <span
      className={clsx("block rounded-box", className, {
        "font-bold": percent === 100,
        "bg-success/90 text-success-content": percent > 80,
        "bg-warning/90 text-warning-content": percent > 40 && percent <= 80,
        "bg-error/90 text-error-content": percent <= 40,
      })}>
      {score}
    </span>
  );
}
