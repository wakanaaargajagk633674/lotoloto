import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildPopularityModel, combinationPayoutExpectation } from "../src/loto/popularity";
import { tripleCoverageRatio } from "../src/loto/mathCore";
import { createSeededRandom, shuffleWithRandom } from "../src/loto/random";
import type { Draw } from "../src/loto/types";

/**
 * MAGI 合議 (2026-09-15, 可決 2/3) の構成条件に従って第695回向け 5 口を生成する。
 * 骨格は「当せん時の分配 (期待受取係数) の最大化 + 5 口間の重複 ≤1」。
 * 利用者が観測した直近の偏り (35, 22) は口A の「観測可視化」にのみ使い、根拠ではなく説明の担当とする。
 */
const SEED = 695;
const domain = Array.from({ length: 37 }, (_, i) => i + 1);

function stats(ns: number[]) {
  const s = [...ns].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  const consecutive = s.filter((n, i) => i > 0 && n - s[i - 1] === 1).length;
  let dense = 0;
  for (let i = 0; i < s.length; i += 1) dense = Math.max(dense, s.filter((n) => n >= s[i] && n <= s[i] + 7).length);
  const le31 = s.filter((n) => n <= 31).length;
  const odd = s.filter((n) => n % 2).length;
  const arithmetic = s.every((n, i) => i === 0 || n - s[i - 1] === s[1] - s[0]);
  return { sum, consecutive, dense, le31, odd, arithmetic };
}
/** MELCHIOR-1 条件: 合計は理論分布の中央 50% (116-150)、≤31 が 6 個以上禁止、8 幅に 4 個以上禁止、等差列禁止、連番 ≤1。 */
function ok(ns: number[]): boolean {
  const t = stats(ns);
  return t.sum >= 116 && t.sum <= 150 && t.le31 <= 5 && t.dense <= 3 && !t.arithmetic && t.consecutive <= 1 && t.odd >= 2 && t.odd <= 5;
}
const overlap = (a: number[], b: number[]) => a.filter((n) => b.includes(n)).length;

async function main() {
  const draws = (JSON.parse(await readFile(path.join("data", "processed", "loto7_draws.json"), "utf8")) as Draw[]).sort(
    (a, b) => a.drawNumber - b.drawNumber
  );
  const latest = draws.at(-1)!;
  const model = buildPopularityModel("loto7", draws);
  const pf = (ns: number[]) => combinationPayoutExpectation("loto7", ns, model)!.payoutFactor;
  const random = createSeededRandom(SEED);
  const chosen: number[][] = [];
  const fits = (ns: number[]) => ok(ns) && chosen.every((c) => overlap(c, ns) <= 1);
  /** 既に使った数字の再利用に小さな罰則を掛け、5 口で 37 数字をできるだけ広く覆う。 */
  const reuse = (ns: number[]) => ns.filter((n) => chosen.some((c) => c.includes(n))).length;

  const best = (must: number[], iterations: number, score: (ns: number[]) => number) => {
    let top: number[] = [];
    let topScore = -Infinity;
    const rest = domain.filter((n) => !must.includes(n));
    for (let i = 0; i < iterations; i += 1) {
      const pick = [...must, ...shuffleWithRandom(rest, random).slice(0, 7 - must.length)].sort((a, b) => a - b);
      if (!fits(pick)) continue;
      const s = score(pick);
      if (s > topScore) {
        topScore = s;
        top = pick;
      }
    }
    if (top.length === 0) throw new Error(`no ticket for must=${must}`);
    chosen.push(top);
    return top;
  };

  const hot10 = new Map<number, number>();
  for (const d of draws.slice(-10)) for (const n of d.mainNumbers) hot10.set(n, (hot10.get(n) ?? 0) + 1);
  const cooc22 = new Map<number, number>();
  for (const d of draws) if (d.mainNumbers.includes(22)) for (const n of d.mainNumbers) if (n !== 22) cooc22.set(n, (cooc22.get(n) ?? 0) + 1);
  const partner22 = [...cooc22.entries()].sort((a, b) => b[1] - a[1])[0];

  // D: 主軸。期待受取係数の最大化のみ。
  const D = best([], 60000, pf);
  // B: 山分け回避 第2セット。D と重複 ≤1。
  const B = best([], 60000, (ns) => pf(ns) - 0.02 * reuse(ns));
  // A: 観測可視化。35 と 22 を必ず含み、残りは受取係数優先、直近10回の出現数は微小なタイブレーク。
  const A = best([35, 22], 60000, (ns) => pf(ns) - 0.02 * reuse(ns) + 0.005 * ns.reduce((s, n) => s + (hot10.get(n) ?? 0), 0));
  // C: 矛盾検証。22 と最も多く同時に出た数字のペアを含める (pair_affinity AUC 0.503 = 根拠ではない)。
  const C = best([22, partner22[0]], 60000, (ns) => pf(ns) - 0.02 * reuse(ns));
  // E: 均等ランダム制御群。構造制約は掛けず、重複 ≤1 だけ課す。
  let E: number[] = [];
  for (let i = 0; i < 100000; i += 1) {
    const pick = shuffleWithRandom(domain, random).slice(0, 7).sort((a, b) => a - b);
    if (chosen.every((c) => overlap(c, pick) <= 1)) {
      E = pick;
      break;
    }
  }
  chosen.push(E);

  const rows = [
    { id: "A", theme: "観測可視化 (35・22 を含む)", numbers: A, note: `特定数字が10回中4回以上はどれかの数字で 0.98 の確率で起きる。35/22 を含めたのは利用者の観測を可視化するためで、当せん確率は変わらない。残り5数字は受取係数優先。` },
    { id: "B", theme: "山分け回避 第2セット", numbers: B, note: "D と重複 ≤1 で受取係数を最大化。" },
    { id: "C", theme: `矛盾検証 (22 と最多共起の ${partner22[0]}: ${partner22[1]} 回)`, numbers: C, note: "ペア共起はラボ実測 pair_affinity AUC 0.503 (乱数と区別できない)。説明担当の 1 口。" },
    { id: "D", theme: "山分け回避 主軸", numbers: D, note: "数学的に期待値へ効く唯一の要素。1等当せん時の E[1/(1+同時当せん者数)] を最大化。" },
    { id: "E", theme: `均等ランダム制御群 (seed ${SEED})`, numbers: E, note: "構造制約なし。A/C との比較用の対照。" }
  ].map((r) => ({ ...r, payoutFactor: pf(r.numbers), ...stats(r.numbers) }));

  const coverage = tripleCoverageRatio(rows.map((r) => r.numbers));
  const covered = new Set(rows.flatMap((r) => r.numbers)).size;
  const out = { generatedAt: new Date().toISOString(), basedOnDraw: latest.drawNumber, targetDraw: latest.drawNumber + 1, seed: SEED, coverage, coveredNumbers: covered, tickets: rows };
  await mkdir(path.join("data", "backtest", "loto7-lab"), { recursive: true });
  await writeFile(path.join("data", "backtest", "loto7-lab", "magi-695-tickets.json"), JSON.stringify(out, null, 2) + "\n", "utf8");
  for (const r of rows) console.log(r.id, r.numbers.map((n) => String(n).padStart(2, "0")).join(" "), "pf", r.payoutFactor.toFixed(3), "sum", r.sum, "|", r.theme);
  console.log("covered", covered, "/37  tripleCoverage", coverage.toFixed(3));
}
main().catch((e) => { console.error(e); process.exit(1); });
