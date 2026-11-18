/**
 * I file delle submission prodotti dal CMS non sono testo con un solo
 * encoding: l'header (`user`/`task`/`score`/`date`) è scritto in UTF-8,
 * mentre l'output del compilatore viene rediretto da Windows in UTF-16LE
 * (tipico di `powershell` con `>` o di `cmd /u`). Un unico decoder non può
 * gestire entrambe le parti, quindi le separiamo e riconosciamo l'encoding
 * del corpo con regole deterministiche: BOM, posizione dei byte NUL,
 * validità UTF-8.
 *
 * Se l'encoding non viene riconosciuto il file viene ignorato: un sorgente
 * che ha compilato è testo valido, quindi ciò che non si decodifica è
 * quasi sempre un file sbagliato (eseguibile, archivio, immagine) oppure un
 * sorgente che non compilava e ha preso 0 punti. Meglio non salvarlo che
 * salvare testo corrotto o con NUL rimossi a caso (Postgres li rifiuta:
 * `invalid byte sequence for encoding "UTF8": 0x00`).
 */

const NUL = "\u0000";

// Il CMS incapsula i metadati nel primo blocco di commento del file, usando
// la sintassi del linguaggio: `/** */` per i linguaggi C-like, `(** *)` per
// Pascal, `"""` per Python. Per un nuovo linguaggio basta aggiungere qui il
// delimitatore.
const HEADER_DELIMITERS: [open: string, close: string][] = [
  ["/**", "*/"],
  ["(**", "*)"],
  ['"""', '"""'],
];

export type SubmissionMetadata = {
  user: string;
  task: string;
  score: string;
  date: string;
};

export type DecodedSubmission =
  | { ok: true; metadata: SubmissionMetadata; code: string; encoding: string }
  | { ok: false; reason: string };

export function decodeSubmissionFile(raw: Buffer, fileName: string): DecodedSubmission {
  const split = splitCmsHeader(raw);
  if (!split) return { ok: false, reason: "header CMS mancante" };

  const decoded = decodeBody(split.body);
  if (!decoded) return { ok: false, reason: "encoding non riconosciuto" };

  const code = decoded.text.normalize("NFC");
  if (code.includes(NUL)) return { ok: false, reason: "byte NUL nel testo" };

  // I metadati mancanti restano un errore: se cambia il formato dell'header
  // l'import va sistemato, non ignorato in silenzio.
  return {
    ok: true,
    metadata: parseSubmissionHeader(split.header, fileName),
    code,
    encoding: decoded.encoding,
  };
}

function splitCmsHeader(raw: Buffer): { header: string; body: Buffer } | null {
  // latin1 mappa un carattere per byte: serve solo a individuare l'offset in
  // byte della fine dell'header (che è UTF-8 e può contenere accenti).
  const bytes = raw.toString("latin1");

  for (const [open, close] of HEADER_DELIMITERS) {
    if (!bytes.startsWith(open)) continue;

    const closeAt = bytes.indexOf(close, open.length);
    const end = closeAt === -1 ? -1 : bytes.indexOf("\n", closeAt);
    if (end === -1) continue;

    const header = raw.subarray(0, end + 1).toString("utf8");
    // Il blocco deve contenere i metadati: così non scambiamo per header una
    // docstring o un commento di licenza del sorgente.
    if (!/(?:^|\n)\s*\*?\s*user:/u.test(header)) continue;

    return { header, body: raw.subarray(end + 1) };
  }

  return null;
}

function decodeBody(body: Buffer): { text: string; encoding: string } | null {
  if (body.length === 0) return { text: "", encoding: "ascii" };

  // 1. BOM esplicito: nessuna ambiguità sull'encoding né sull'endianness.
  if (body[0] === 0xff && body[1] === 0xfe) {
    return { text: new TextDecoder("utf-16le").decode(body), encoding: "utf-16le" };
  }
  if (body[0] === 0xfe && body[1] === 0xff) {
    return { text: new TextDecoder("utf-16be").decode(body), encoding: "utf-16be" };
  }
  if (body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) {
    return { text: new TextDecoder("utf-8").decode(body), encoding: "utf-8" };
  }

  // 2. UTF-16 senza BOM: ogni carattere ASCII produce un byte NUL, sempre
  //    sulla stessa parità (dispari per LE, pari per BE). È l'unico segnale
  //    affidabile, e va controllato prima di provare l'UTF-8 perché il testo
  //    UTF-16LE composto da soli caratteri ASCII è a sua volta UTF-8 valido.
  const nulls = countNulBytes(body);
  const minNulBytes = Math.max(2, Math.floor(body.length / 16));
  if (nulls.odd >= minNulBytes && nulls.even === 0) {
    return { text: new TextDecoder("utf-16le").decode(body), encoding: "utf-16le" };
  }
  if (nulls.even >= minNulBytes && nulls.odd === 0) {
    return { text: new TextDecoder("utf-16be").decode(body), encoding: "utf-16be" };
  }

  // 3. Caso normale: sorgente UTF-8 valida.
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(body), encoding: "utf-8" };
  } catch {
    // Corpo binario o in un encoding legacy: non lo indoviniamo.
    return null;
  }
}

function countNulBytes(buffer: Buffer): { even: number; odd: number } {
  let even = 0;
  let odd = 0;
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== 0) continue;
    if (i % 2 === 0) even++;
    else odd++;
  }

  return { even, odd };
}

function parseSubmissionHeader(header: string, fileName: string): SubmissionMetadata {
  return {
    user: getMetadataValue(header, "user", fileName),
    task: getMetadataValue(header, "task", fileName),
    score: getMetadataValue(header, "score", fileName),
    date: getMetadataValue(header, "date", fileName),
  };
}

function getMetadataValue(source: string, key: string, fileName: string): string {
  const match = new RegExp(String.raw`(?:^|\n)\s*\*?\s*${key}:\s*(.+?)\s*$`, "mu").exec(source);
  if (!match?.[1]) {
    throw new Error(`Metadato "${key}" mancante nella submission: ${fileName}`);
  }

  return match[1].trim();
}
