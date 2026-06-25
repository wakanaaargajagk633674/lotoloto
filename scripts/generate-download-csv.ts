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
  rows: number;
  lastUpdated: string;
  source: string;
  verificationStatus: string;
};

const targets = [
  { suffix: "draws_japanese", title: "全当せんデータ", description: "回号、抽せん日、本数字、ボーナス数字、販売実績額、キャリーオーバー、等級別配当を含む共通スキーマCSVです。" },
  { suffix: "number_frequency", title: "数字別出現回数", description: "全期間、直近30回、50回、100回、300回の出現回数と未出現期間です。" },
  { suffix: "recent100", title: "直近100回分析", description: "直近100回の出現回数、前回からの間隔、過去出現回数です。" },
  { suffix: "carryover", title: "キャリーオーバー履歴", description: "販売実績額、キャリーオーバー、1等口数、1等当せん金額の履歴です。" },
  { suffix: "prize_tiers", title: "等級別配当履歴", description: "等級ごとの当せん口数と当せん金額の履歴です。" }
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
        description: target.description,
        rows: Math.max(0, csv.trim().split(/\r\n|\n|\r/).length - 1),
        lastUpdated: new Date().toISOString(),
        source: "履歴: sougaku公開ZIP / 直近: みずほ銀行CSV",
        verificationStatus: "品質レポートで照合状況を確認"
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
