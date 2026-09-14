import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GAME_SPECS } from "../src/loto/constants";
import { runLab, runStructureChecks, type AngleResult, type LabRun, type StructureCheck } from "../src/loto/lab";
import { tripleCoverageRatio } from "../src/loto/mathCore";
import { buildPopularityModel, combinationPayoutExpectation } from "../src/loto/popularity";
import { createSeededRandom, shuffleWithRandom } from "../src/loto/random";
import type { Draw } from "../src/loto/types";

/**
 * ロト7 実験ラボの実行スクリプト。
 *
 * 1. 数十の角度をウォークフォワードで採点し、多重比較補正と並べ替え検定で根拠を判定する。
 * 2. 合計・奇偶・連番などの構造が組合せ論の理論分布と一致するかを検定する。
 * 3. 上記の結果を踏まえ、テーマの異なる 3 口を決める。
 *
 * 出力: data/backtest/loto7-lab/*.json, docs/backtest/loto7-lab-report.md
 */

const GAME = "loto7" as const;
const OUT_DIR = path.join("data", "backtest", "loto7-lab");
const REPORT = path.join("docs", "backtest", "loto7-lab-report.md");
const PERMUTATIONS = Number(process.env.LAB_PERMUTATIONS ?? 200);

type Ticket = {
  label: string;
  theme: string;
  numbers: number[];
  ensembleScore: number;
  payoutFactor: number | null;
  relativePopularity: number | null;
  expectedCoWinners: number | null;
  sum: number;
  oddCount: number;
  reasons: string[];
};

async function main() {
  const raw = await readFile(path.join("data", "processed", `${GAME}_draws.json`), "utf8");
  const draws = (JSON.parse(raw) as Draw[]).filter((d) => d.game === GAME).sort((a, b) => a.drawNumber - b.drawNumber);
  const latest = draws.at(-1)!;

  console.log(`[lab] loto7 draws=${draws.length} latest=#${latest.drawNumber} (${latest.drawDate}) permutations=${PERMUTATIONS}`);
  const started = Date.now();
  const lab = runLab(draws, GAME, { minTrainingDraws: 100, permutations: PERMUTATIONS });
  console.log(`[lab] angles evaluated: ${lab.angles.length}, trials=${lab.trials}, ${((Date.now() - started) / 1000).toFixed(1)}s`);
  const structure = runStructureChecks(draws, GAME);

  const tickets = buildTickets(draws, lab);

  await mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString();
  await writeFile(path.join(OUT_DIR, "angles.json"), JSON.stringify({ generatedAt: stamp, ...lab }, null, 2) + "\n", "utf8");
  await writeFile(path.join(OUT_DIR, "structure-checks.json"), JSON.stringify({ generatedAt: stamp, checks: structure }, null, 2) + "\n", "utf8");
  await writeFile(
    path.join(OUT_DIR, "tickets.json"),
    JSON.stringify({ generatedAt: stamp, targetDraw: latest.drawNumber + 1, basedOnDraw: latest.drawNumber, tickets }, null, 2) + "\n",
    "utf8"
  );
  await writeFile(REPORT, renderReport(lab, structure, tickets, latest, stamp), "utf8");

  console.log("");
  for (const t of tickets) {
    console.log(`${t.label} [${t.theme}] ${t.numbers.map((n) => String(n).padStart(2, "0")).join(" ")}  payoutFactor=${t.payoutFactor?.toFixed(3) ?? "-"}`);
  }
  console.log(`\nreport: ${REPORT}`);
}

// ---------------------------------------------------------------------------
// 3 口の決定
// ---------------------------------------------------------------------------

function buildTickets(draws: Draw[], lab: LabRun): Ticket[] {
  const spec = GAME_SPECS[GAME];
  const max = spec.maxNumber;
  const model = buildPopularityModel(GAME, draws);
  const random = createSeededRandom(draws.length * 31 + 7);

  const nonControl = lab.angles.filter((a) => a.family !== "control");
  const significant = nonControl.filter((a) => a.aucQ < 0.1 && a.consistent);
  // 有意な角度が無ければ、標本外 z が正で上位の 5 角度を「参考アンサンブル」として使う (根拠は弱い)。
  const ensembleSource = significant.length > 0 ? significant : [...nonControl].sort((a, b) => b.aucZ - a.aucZ).slice(0, 5);
  const ensemble = rankAverage(ensembleSource, max);

  const constraints = (ns: number[]) => {
    const sum = ns.reduce((a, b) => a + b, 0);
    const odd = ns.filter((n) => n % 2).length;
    const sorted = [...ns].sort((a, b) => a - b);
    const consecutive = sorted.filter((n, i) => i > 0 && n - sorted[i - 1] === 1).length;
    return sum >= 100 && sum <= 166 && odd >= 2 && odd <= 5 && consecutive <= 2;
  };
  const payout = (ns: number[]) => combinationPayoutExpectation(GAME, ns, model);
  const overlap = (a: number[], b: number[]) => a.filter((n) => b.includes(n)).length;
  const ensembleScore = (ns: number[]) => ns.reduce((s, n) => s + ensemble[n], 0) / ns.length;

  // A: アンサンブル上位から制約を満たす 7 個を貪欲に選ぶ。
  const ranked = Array.from({ length: max }, (_, i) => i + 1).sort((a, b) => ensemble[b] - ensemble[a]);
  let ticketA: number[] = [];
  outer: for (let skip = 0; skip < 8; skip += 1) {
    const pool = ranked.slice(skip, skip + 14);
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const pick = [...pool.slice(0, 5), ...shuffleWithRandom(pool.slice(5), random).slice(0, 2)].sort((a, b) => a - b);
      if (constraints(pick)) {
        ticketA = pick;
        break outer;
      }
    }
  }
  if (ticketA.length === 0) ticketA = ranked.slice(0, 7).sort((a, b) => a - b);

  // B: 制約を満たすランダム候補から期待受取係数が最大のもの (A との重なり ≤ 2)。
  const domain = Array.from({ length: max }, (_, i) => i + 1);
  let ticketB: number[] = [];
  let bestB = -1;
  for (let i = 0; i < 30000; i += 1) {
    const pick = shuffleWithRandom(domain, random).slice(0, spec.mainCount).sort((a, b) => a - b);
    if (!constraints(pick) || overlap(pick, ticketA) > 2) continue;
    const pf = payout(pick)?.payoutFactor ?? 0;
    if (pf > bestB) {
      bestB = pf;
      ticketB = pick;
    }
  }

  // C: アンサンブル上位 16 個から作る候補で、順位スコアと期待受取係数の合成を最大化 (A, B との重なり ≤ 3)。
  const poolC = ranked.slice(0, 16);
  let ticketC: number[] = [];
  let bestC = -Infinity;
  for (let i = 0; i < 30000; i += 1) {
    const pick = shuffleWithRandom(poolC, random).slice(0, spec.mainCount).sort((a, b) => a - b);
    if (!constraints(pick) || overlap(pick, ticketA) > 3 || overlap(pick, ticketB) > 3) continue;
    const pf = payout(pick)?.payoutFactor ?? 0;
    const score = ensembleScore(pick) + pf * 0.6;
    if (score > bestC) {
      bestC = score;
      ticketC = pick;
    }
  }

  const evidenceNote =
    significant.length > 0
      ? `BH 補正後 q<0.10 かつ前後半で符号一致の角度 ${significant.map((a) => a.id).join(", ")} を合成`
      : `統計的に有意な角度は無し。標本外 AUC 上位 5 角度 (${ensembleSource.map((a) => a.id).join(", ")}) の順位平均を参考値として使用`;

  const make = (label: string, theme: string, numbers: number[], reasons: string[]): Ticket => {
    const p = payout(numbers);
    return {
      label,
      theme,
      numbers,
      ensembleScore: ensembleScore(numbers),
      payoutFactor: p?.payoutFactor ?? null,
      relativePopularity: p?.relativePopularity ?? null,
      expectedCoWinners: p?.expectedCoWinners ?? null,
      sum: numbers.reduce((a, b) => a + b, 0),
      oddCount: numbers.filter((n) => n % 2).length,
      reasons
    };
  };

  const tickets = [
    make("口1", "傾向アンサンブル", ticketA, [evidenceNote, "合計 100-166、奇数 2-5 個、連番ペア ≤2 の構造制約を満たす"]),
    make("口2", "期待受取最大 (山分け回避)", ticketB, [
      "販売口数の復元と人気度回帰から、1等当せん時の E[1/(1+同時当せん者数)] が最大となる組み合わせ",
      "当せん確率は口1と同一。差が出るのは当せんした場合の受取額だけ",
      `口1 との重なり ${overlap(ticketB, ticketA)} 個`
    ]),
    make("口3", "ハイブリッド", ticketC, [
      "アンサンブル上位 16 数字の中から、順位スコアと期待受取係数の合成が最大の組み合わせ",
      `口1 と ${overlap(ticketC, ticketA)} 個、口2 と ${overlap(ticketC, ticketB)} 個重なる`
    ])
  ];
  tickets[0].reasons.push(`3 口の 3個組被覆率 ${tripleCoverageRatio(tickets.map((t) => t.numbers)).toFixed(3)}`);
  return tickets;
}

function rankAverage(angles: AngleResult[], max: number): number[] {
  const total = new Array<number>(max + 1).fill(0);
  for (const angle of angles) {
    const order = Array.from({ length: max }, (_, i) => i + 1).sort((a, b) => angle.latestScores[b] - angle.latestScores[a]);
    order.forEach((n, rank) => {
      total[n] += (max - rank) / max;
    });
  }
  return total.map((v) => (angles.length ? v / angles.length : 0));
}

// ---------------------------------------------------------------------------
// レポート
// ---------------------------------------------------------------------------

function renderReport(lab: LabRun, structure: StructureCheck[], tickets: Ticket[], latest: Draw, stamp: string): string {
  const f = (v: number, d = 3) => v.toFixed(d);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const nonControl = lab.angles.filter((a) => a.family !== "control").sort((a, b) => b.aucZ - a.aucZ);
  const controls = lab.angles.filter((a) => a.family === "control");
  const significant = nonControl.filter((a) => a.aucQ < 0.1);
  const lines: string[] = [];

  lines.push(
    "# ロト7 実験ラボ レポート",
    "",
    `生成: ${stamp}  |  データ: 第1回〜第${latest.drawNumber}回 (${lab.drawsUsed} 回)  |  予想対象: 第${latest.drawNumber + 1}回`,
    "",
    "## 検証の設計",
    "",
    `- ${nonControl.length} 個の「角度」(頻度・間隔・直前回・遷移・構造バランス) と ${controls.length} 個の乱数対照を、同一条件のウォークフォワードで採点。`,
    `- 学習最小 ${lab.minTrainingDraws} 回 → 標本外 ${lab.trials} 回。各回の予想はその時点までの履歴だけを使う。`,
    "- 主指標 AUC: 角度のスコア順位で本数字 7 個が非本数字 30 個より上に来る割合 (帰無 0.500)。順位統計の解析的分散から z / p を算出。",
    `- 補助指標 top7: スコア上位 7 個を買った場合の平均一致数 (帰無 ${f(lab.nullTop7Mean)})。`,
    `- 多重比較: 全 ${lab.angles.length} 角度の p を Benjamini–Hochberg 補正 (q)。`,
    `- 並べ替え検定: 抽せん順序を ${lab.permutations} 回シャッフルして再評価し、時間的構造だけの p を算出 (perm p)。`,
    "- 前後半一致: 標本外期間を二分し、AUC の 0.5 からの符号が一致するか。",
    ""
  );

  lines.push(
    "## 結論 (先に要点)",
    "",
    significant.length > 0
      ? `- BH 補正後 q<0.10 の角度: ${significant.map((a) => `${a.id} (AUC ${f(a.meanAuc)}, z ${f(a.aucZ, 2)}, q ${f(a.aucQ)})`).join(", ")}`
      : "- **BH 補正後に有意 (q<0.10) な角度はゼロ。** どの角度も乱数対照と区別できない。",
    `- 乱数対照 ${controls.length} 本の AUC z: 平均 ${f(lab.controlAucZ.mean, 2)}, 標準偏差 ${f(lab.controlAucZ.std, 2)}, 範囲 [${f(lab.controlAucZ.min, 2)}, ${f(lab.controlAucZ.max, 2)}]。実角度の z がこの範囲に収まるなら偶然の範囲。`,
    `- 最良角度 ${nonControl[0].id}: AUC ${f(nonControl[0].meanAuc)} (z ${f(nonControl[0].aucZ, 2)}, 生 p ${f(nonControl[0].aucP)}, q ${f(nonControl[0].aucQ)}, perm p ${nonControl[0].permutationP === null ? "-" : f(nonControl[0].permutationP)}), top7 平均一致 ${f(nonControl[0].meanTop7)} (帰無 ${f(lab.nullTop7Mean)})。`,
    "- したがって 3 口は「当たりやすさ」ではなく、(1) 弱いながら標本外で最良だった角度の合成、(2) 当せん時の山分けを最小化、(3) その折衷、というテーマで決めた。",
    ""
  );

  lines.push("## 3 口の決定", "");
  for (const t of tickets) {
    lines.push(
      `### ${t.label}: ${t.numbers.map((n) => String(n).padStart(2, "0")).join(" ")}  —  ${t.theme}`,
      "",
      `- 合計 ${t.sum} / 奇数 ${t.oddCount} 個 / アンサンブル順位スコア ${f(t.ensembleScore)} / 期待受取係数 ${t.payoutFactor === null ? "-" : f(t.payoutFactor)} (相対人気 ${t.relativePopularity === null ? "-" : f(t.relativePopularity, 2)}, 期待同時当せん ${t.expectedCoWinners === null ? "-" : f(t.expectedCoWinners, 2)} 人)`,
      ...t.reasons.map((r) => `- ${r}`),
      ""
    );
  }
  lines.push(
    "> どの口も 1 等の理論確率は 1/10,295,472 で同一です。上の数字は「過去データから説明可能な選び方」であり、当せんを保証・示唆するものではありません。",
    ""
  );

  lines.push(
    "## 角度別の標本外成績 (AUC z 降順)",
    "",
    "| 角度 | 系統 | 説明 | AUC | z | 生p | q(BH) | perm p | top7一致 | top7 z | top20被覆 | 前半AUC | 後半AUC | 一致 |",
    "|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|"
  );
  for (const a of nonControl) {
    lines.push(
      `| ${a.id} | ${a.family} | ${a.description} | ${f(a.meanAuc)} | ${f(a.aucZ, 2)} | ${f(a.aucP)} | ${f(a.aucQ)} | ${a.permutationP === null ? "-" : f(a.permutationP)} | ${f(a.meanTop7)} | ${f(a.top7Z, 2)} | ${pct(a.top20Hit / 7)} | ${f(a.firstHalfAuc)} | ${f(a.secondHalfAuc)} | ${a.consistent ? "○" : "×"} |`
    );
  }
  lines.push(
    "",
    "### 乱数対照",
    "",
    "| 対照 | AUC | z | top7一致 |",
    "|---|---:|---:|---:|",
    ...controls.map((a) => `| ${a.id} | ${f(a.meanAuc)} | ${f(a.aucZ, 2)} | ${f(a.meanTop7)} |`),
    ""
  );

  lines.push(
    "## 組み合わせ構造の検定 (全履歴 vs 一様抽せんの理論分布)",
    "",
    "「合計は 100〜150 に集まる」「奇数偶数は 3:4 が多い」等はすべて組合せ論から自動的に出る性質で、抽せんの偏りではない。以下はそれを確認する検定。",
    "",
    "| 構造 | 観測平均 | 理論平均 | χ² | 自由度 | p |",
    "|---|---:|---:|---:|---:|---:|",
    ...structure.map((s) => `| ${s.description} | ${f(s.observedMean, 2)} | ${f(s.theoreticalMean, 2)} | ${f(s.chiSquare, 2)} | ${s.degreesOfFreedom} | ${f(s.pValue)} |`),
    "",
    structure.every((s) => s.pValue >= 0.05)
      ? "すべて p ≥ 0.05。過去の構造分布は一様抽せんの理論値と矛盾しない。構造制約は「理論的にありふれた形」を選ぶフィルタとしてのみ使う。"
      : `p < 0.05 の構造: ${structure.filter((s) => s.pValue < 0.05).map((s) => s.id).join(", ")}。ただし 6 検定の多重比較なので個別 p は割り引いて読む。`,
    ""
  );

  lines.push(
    "## 読み方の注意",
    "",
    "- AUC 0.5 前後 ±0.01 は、この試行回数では偶然で普通に出る幅。",
    "- 角度を増やせば「最良角度」は必ず存在するが、それは選択効果。q 値と乱数対照の範囲を基準に読む。",
    "- 口2 の期待受取係数は当せん確率を変えない。パリミュチュエル方式の分配人数期待値だけを扱う。",
    "- 再現: `npm run lab:loto7` (環境変数 LAB_PERMUTATIONS で並べ替え回数を変更可)。",
    ""
  );
  return lines.join("\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
