import { createReadStream } from "node:fs";
import readline from "node:readline";

const LOGIN_REGEX = /Successful login attempt from IP address .*, as user '([^']+)', on contest/;

export async function parseCmsLog(cmsLogPath: string): Promise<Set<string>> {
  const fileStream = createReadStream(cmsLogPath, { encoding: "utf8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  const loggedUsers = new Set<string>();

  for await (const line of rl) {
    const match = LOGIN_REGEX.exec(line);
    if (match?.[1]) {
      loggedUsers.add(match[1]);
    }
  }

  return loggedUsers;
}
