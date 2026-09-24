import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { popularityCalibrationSettings } from "../src/config/strategyWeights";
import { GAME_SPECS } from "../src/loto/constants";
import { fitPopularityRegression, shrinkFrequencies } from "../src/loto/mathCore";
import { buildPopularityModel, scoreCombinationPopularity } from "../src/loto/popularity";
import {
  calibrateJackpot,
  fitCalibratedPopularity,
  nestedJackpotValidation,
  PATTERN_FEATURE_NAMES,
  walkForwardPopularity
} from "../src/loto/popularityCalibration";
import type { Draw, GameType } from "../src/loto/types";

/**
 * 人気度モデルの標本外検証レポート。
 * 当せん確率は組み合わせで変わらないため、ここで検証するのは
 * 「当せんした場合の山分け人数の見積もり」が未来の回の当せん口数を説明できるかだけである。
 */

const PATTERN_LABELS: Record<(typeof PATTERN_FEATURE_NAMES)[number], string> = {
  all_le31: "全部31以下",
  month_heavy: "1-12が半分以上",
  same_last_digit3: "下1桁が3個以上そろう",
  consecutive: "連番の組数 (最大2)",
  over31_2plus: "32以上が2個以上"
};

async function readDraws(game: GameType): Promise<Draw[]> {
  const raw = await readFile(path.join("data", "processed", `${game}_draws.json`), "utf8");
  return (JSON.parse(raw) as Draw[]).sort((a, b) => a.drawNumber - b.drawNumber);
}

/** 変更前の本番方式 (5等のみの Ridge 回帰 β × mainCount/matches) をウォークフォワードで再現する。 */
function legacyPredictions(game: GameType, draws: Draw[], warmup: number): Map<number, number> {
  const scale = GAME_SPECS[game].mainCount / (game === "loto6" ? 3 : 4);
  const result = new Map<number, number>();
  let beta: Map<number, number> | null = null;
  for (let index = warmup; index < draws.length; index += 1) {
    if ((index - warmup) % 10 === 0) {
      beta = fitPopularityRegression(game, draws.slice(0, index))?.beta ?? null;
    }
    if (beta) {
      const current = beta;
      result.set(draws[index].drawNumber, draws[index].mainNumbers.reduce((sum, number) => sum + (current.get(number) ?? 0), 0) * scale);
    }
  }
  return result;
}

const f = (value: number, digits = 3) => (Number.isFinite(value) ? value.toFixed(digits) : "-");

async function main() {
  const lines: string[] = [
    "# 人気度モデル 標本外検証レポート",
    "",
    `生成: \`npm run validate:popularity\` / データ: ${new Date().toISOString().slice(0, 10)} 時点の processed JSON`,
    "",
    "当せん確率はどの組み合わせでも同じで、過去データから当せん番号は予測できない。",
    "このレポートが検証するのは、ロト6・ロト7が山分け (パリミュチュエル) 方式であることを使った",
    "「当せんした場合に何人と山分けになるか」の見積もりだけである。",
    "",
    "すべての予測は、その回より前の回だけで学習したモデルで行っている (ウォークフォワード)。"
  ];
  const json: Record<string, unknown> = {};

  for (const game of ["loto6", "loto7"] as GameType[]) {
    const draws = await readDraws(game);
    const settings = popularityCalibrationSettings[game];
    const counts = new Map<number, number>();
    for (const draw of draws) {
      for (const number of draw.mainNumbers) counts.set(number, (counts.get(number) ?? 0) + 1);
    }
    const uniformity = shrinkFrequencies(counts, game, draws.length);

    // 1. 学習等級と Ridge の比較 (低位等級の標本外 R² と、1等口数の尤度比)
    const tierOptions = game === "loto6" ? [[5], [4, 5], [3, 4, 5], [2, 3, 4, 5]] : [[5], [4, 5], [4, 5, 6], [3, 4, 5, 6]];
    const grid: Array<Record<string, number | string>> = [];
    for (const tiers of tierOptions) {
      for (const ridge of [1, 4, 16, 64]) {
        const walk = walkForwardPopularity(game, draws, { trainTiers: tiers, evalTier: 5, ridge, patterns: false, warmup: settings.warmup, refitEvery: settings.refitEvery });
        const jackpot = calibrateJackpot(game, draws, walk.predictedLogPopularity);
        grid.push({
          tiers: tiers.join("+"),
          ridge,
          oosR2: walk.oosR2,
          slope: jackpot.slope,
          slopeStdError: jackpot.slopeStdError,
          likelihoodRatio: jackpot.likelihoodRatio,
          pValue: jackpot.pValue
        });
      }
    }

    // 2. 入れ子の標本外検証 (較正も過去だけで決める)
    const nested = nestedJackpotValidation(game, draws, settings, {
      evalStart: settings.warmup * 2,
      refitEvery: 25,
      extraPredictors: { "変更前の本番方式": legacyPredictions(game, draws, settings.warmup) }
    });

    // 3. 最終モデル
    const calibrated = fitCalibratedPopularity(game, draws, settings);
    const model = buildPopularityModel(game, draws);
    const examples = (game === "loto6"
      ? [[1, 2, 3, 4, 5, 6], [3, 7, 8, 11, 12, 22], draws.at(-1)!.mainNumbers, [13, 24, 32, 36, 40, 43]]
      : [[1, 2, 3, 4, 5, 6, 7], [3, 7, 8, 9, 11, 12, 22], draws.at(-1)!.mainNumbers, [16, 19, 21, 26, 32, 34, 37]]
    ).map((numbers) => {
      const result = scoreCombinationPopularity(game, numbers, model);
      return {
        numbers,
        relativePopularity: result.expectedReturn?.relativePopularity ?? null,
        expectedCoWinners: result.expectedReturn?.expectedCoWinners ?? null,
        payoutFactor: result.expectedReturn?.payoutFactor ?? null,
        relativeReturnIndex:
          result.expectedReturn && model.returnBand ? (100 * result.expectedReturn.returnRatio) / model.returnBand.median : null
      };
    });

    json[game] = {
      draws: draws.length,
      latestDraw: draws.at(-1)?.drawNumber,
      uniformity: { chiSquare: uniformity.test.statistic, pValue: uniformity.test.pValue, lambda: uniformity.lambda },
      grid,
      nested,
      settings,
      calibrated: calibrated && {
        intercept: calibrated.intercept,
        slope: calibrated.slope,
        slopeStdError: calibrated.slopeStdError,
        patterns: Object.fromEntries(PATTERN_FEATURE_NAMES.map((name, index) => [name, { coefficient: calibrated.patternCoefficients[index], stdError: calibrated.patternStdErrors[index] }])),
        gamma: Object.fromEntries(calibrated.gamma),
        calibrationDraws: calibrated.calibrationDraws,
        calibrationWinners: calibrated.calibrationWinners
      },
      returnBand: model.returnBand,
      examples
    };

    lines.push(
      "",
      `## ${GAME_SPECS[game].label} (${draws.length} 回, 最新 第${draws.at(-1)?.drawNumber}回)`,
      "",
      `- 出現頻度の一様性: χ² = ${f(uniformity.test.statistic, 2)}, p = ${f(uniformity.test.pValue, 3)}。偶然の範囲で、「出やすい数字」は検出されない (縮小係数 λ = ${f(uniformity.lambda)})。`,
      "",
      "### 1. 学習に使う等級と Ridge 罰則",
      "",
      "低位等級の口数の標本外 R² と、その予測で 1等口数を説明したときの尤度比 (人気差なし比)。傾き s は理論上 1。",
      "",
      "| 学習等級 | Ridge | 標本外 R² (5等) | 1等 傾き s | 尤度比 | p 値 |",
      "|---|---:|---:|---:|---:|---:|",
      ...grid.map(
        (row) =>
          `| ${row.tiers} | ${row.ridge} | ${f(row.oosR2 as number, 4)} | ${f(row.slope as number)} ± ${f(row.slopeStdError as number)} | ${f(row.likelihoodRatio as number, 2)} | ${(row.pValue as number).toExponential(2)} |`
      ),
      "",
      `採用: 学習等級 ${settings.trainTiers.join("+")} / Ridge ${settings.ridge}`,
      "",
      "### 2. 入れ子の標本外検証 (1等口数)",
      "",
      `評価 ${nested.evaluatedDraws} 回 / 1等 ${nested.evaluatedWinners} 口。人気差なしモデルに対する対数尤度の改善 (大きいほど良い)。`,
      "",
      "| モデル | 対数尤度の改善 | 1回あたり |",
      "|---|---:|---:|",
      ...nested.rows.map((row) => `| ${row.label} | ${f(row.deltaLogLikelihood, 2)} | ${f(row.perDraw, 4)} |`),
      "",
      "### 3. 採用モデル (全履歴で学習)",
      ""
    );
    if (calibrated) {
      lines.push(
        `- 傾き s = ${f(calibrated.slope)} ± ${f(calibrated.slopeStdError)} (理論値 1)、切片 a = ${f(calibrated.intercept)}`,
        `- 1等の較正に使った回: ${calibrated.calibrationDraws} 回 / ${calibrated.calibrationWinners} 口`,
        "",
        "| 並びのクセ | 係数 δ (対数) | 標準誤差 |",
        "|---|---:|---:|",
        ...PATTERN_FEATURE_NAMES.map(
          (name, index) => `| ${PATTERN_LABELS[name]} | ${f(calibrated.patternCoefficients[index])} | ${f(calibrated.patternStdErrors[index])} |`
        ),
        "",
        `- 最も買われやすい数字: ${[...calibrated.gamma.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, v]) => `${n} (${f(v, 2)})`).join(", ")}`,
        `- 最も買われにくい数字: ${[...calibrated.gamma.entries()].sort((a, b) => a[1] - b[1]).slice(0, 8).map(([n, v]) => `${n} (${f(v, 2)})`).join(", ")}`,
        "",
        "| 組み合わせ | 相対人気 | 1等の同時当せん期待 | 期待受取係数 | 払戻見込み (ランダム=100) |",
        "|---|---:|---:|---:|---:|",
        ...examples.map(
          (example) =>
            `| ${example.numbers.join(" ")} | ${f(example.relativePopularity ?? Number.NaN, 2)} | ${f(example.expectedCoWinners ?? Number.NaN, 2)} 人 | ${f(example.payoutFactor ?? Number.NaN)} | ${f(example.relativeReturnIndex ?? Number.NaN, 0)} |`
        )
      );
    }
  }

  lines.push(
    "",
    "## 読み方と限界",
    "",
    "- ここでの改善は「当せんした場合の受取額の見込み」だけで、当せん確率は変わらない。",
    "- 当せん金の総額は法律で発売額の5割以下と決められており、どの組み合わせでも平均すると購入額を下回る。",
    "- 数字ごとの人気の足し算 (一次近似) なので、1-2-3-4-5-6 のような特定の並びへの集中は過小評価しうる。",
    "- 販売口数は固定賞金等級から復元した推定値で、販売額データは使っていない。",
    "- ロト7は回数が少なく、改善は統計的に弱い。較正は理論値 s = 1 付近に縮小される。"
  );

  await mkdir(path.join("data", "analysis"), { recursive: true });
  await writeFile(path.join("data", "analysis", "popularity_calibration.json"), `${JSON.stringify(json, null, 2)}\n`, "utf8");
  await writeFile(path.join("docs", "backtest", "popularity-calibration-report.md"), `${lines.join("\n")}\n`, "utf8");
  console.log("wrote docs/backtest/popularity-calibration-report.md and data/analysis/popularity_calibration.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
