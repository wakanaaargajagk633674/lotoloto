import { readFile } from "node:fs/promises";
import path from "node:path";
import LotoApp from "@/components/LotoApp";
import type { Draw, GameType } from "@/loto/types";

async function loadDraws(game: GameType): Promise<Draw[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "processed", `${game}_draws.json`), "utf8");
    return JSON.parse(raw) as Draw[];
  } catch {
    return [];
  }
}

export default async function Page() {
  const [loto6Draws, loto7Draws] = await Promise.all([loadDraws("loto6"), loadDraws("loto7")]);
  return <LotoApp initialDraws={{ loto6: loto6Draws, loto7: loto7Draws }} />;
}
