import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { withBom } from "../src/loto/csvExport";
import type { GameType } from "../src/loto/types";

type ManifestEntry = {
  fileName: string;
  bomFileName: string;
  game: string;
  title: string;
  description: string;
};

const targets = [
  { suffix: "draws_japanese", title: "全当せんデータ", description: "回号、抽せん日、本数字、ボーナス数字、キャリーオーバー、配当をまとめています。" },
  { suffix: "number_frequency", title: "数字別出現回数", description: "それぞれの数字が、過去に何回出ているかをまとめています。" },
  { suffix: "recent100", title: "直近100回分析", description: "最近100回でよく出ている数字や、前回からの間隔を見られます。" },
  { suffix: "carryover", title: "キャリーオーバー履歴", description: "キャリーオーバーや1等配当の流れを見られます。" },
  { suffix: "prize_tiers", title: "等級別配当履歴", description: "各等級の口数と当せん金額をまとめています。" }
];

async function main() {
  await mkdir(path.join("public", "downloads"), { recursive: true });
  const manifest: ManifestEntry[] = [];
  for (const game of ["loto6", "loto7"] as GameType[]) {
    for (const target of targets) {
      const sourcePath = path.join("data", "analysis", `${game}_${target.suffix}.csv`);
      const csv = await readFile(sourcePath, "utf8");
      const fileName = `${game}_${target.suffix}.csv`;
      const bomFileName = `${game}_${target.suffix}_bom.csv`;
      await writeFile(path.join("public", "downloads", fileName), csv, "utf8");
      await writeFile(path.join("public", "downloads", bomFileName), withBom(csv), "utf8");
      manifest.push({
        fileName,
        bomFileName,
        game,
        title: target.title,
        description: target.description
      });
    }
  }
  await writeFile(path.join("public", "downloads", "download-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`download manifest: ${manifest.length} files`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
