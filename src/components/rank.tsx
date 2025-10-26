const pr = new Intl.PluralRules("en", { type: "ordinal" });

const suffixMap: Record<string, string> = {
  one: "st",
  two: "nd",
  few: "rd",
  other: "th",
};

export function Rank({ position }: { position: number }) {
  const rule = pr.select(position);
  return `${position}${suffixMap[rule]}`;
}
