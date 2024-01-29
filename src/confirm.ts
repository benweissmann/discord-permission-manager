import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "process";

export default async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`${prompt} [y/N] `);
  rl.close();

  if (answer.toLowerCase() === "y") {
    return true;
  }

  return false;
}
