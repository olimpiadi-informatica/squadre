import { sample, shuffle } from "lodash";

const vowels = "a e i o u".split(" ");
const consonants = "b c d f g l m n p r s t v z".split(" ");
const clusters = "bl br cl cr dr fl fr gn gr gl pl pr qu sc sp st tr".split(" ");

type SyllableType = "CV" | "CCV" | "C2V";

function buildSyllable(type: SyllableType): string {
  const v = sample(vowels)!;
  const c = sample(consonants)!;
  const cl = sample(clusters)!;

  switch (type) {
    case "CV":
      return c + v;
    case "CCV":
      return cl + v;
    case "C2V":
      return c + c + v;
  }
}

const denylist = /cazz|culo|caga|figa|putta|vaffa|negr|nazi|duce|sega|stupr|froci/;

export function generateWord(): string {
  const lengths = shuffle([2, 2, 3, 3]);

  const word = lengths
    .map((len, i) => {
      if (len === 2) {
        return buildSyllable("CV");
      }
      if (i === 0) {
        return buildSyllable("CCV");
      }
      return buildSyllable(sample(["CCV", "C2V"]));
    })
    .join("");

  if (denylist.test(word)) {
    return generateWord();
  }
  return word;
}
