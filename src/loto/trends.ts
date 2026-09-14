import { GAME_SPECS, numbersForGame } from "./constants";
import { computeNumberFeatures } from "./features";
import { scoreNumbers } from "./scoring";
import type { Draw, GameType } from "./types";

/**
 * sougaku 式の傾向表 (list2〜list5) と、その表＋数理コアを使った「絞り込み候補」を作る。
 * すべて soft signal であり、数字を本当に除外する根拠にはならない (AGENTS.md)。
 */

export type GroupDef = { key: string; from: number; to: number };

export type TrendRow = {
  drawNumber: number;
  drawDate: string;
  main: number[];
  bonus: number[];
  sum: number;
  oddCount: number;
  consecutivePairs: number;
  carriedFromPrevious: number;
  /** 6分割: 本数字＋ボーナスを並び順に組記号へ (例 ABBDEF) */
  group6Code: string;
  /** 6分割の組ごとの個数 (本数字＋ボーナス) */
  group6Counts: Record<string, number>;
  /** 6分割の当せんパターン名 (ポーカー風) */
  group6Pattern: string;
  /** 細分割 (ロト7: 9分割 / ロト6: 11分割) 本数字のみ */
  groupFineCode: string;
  groupFineCounts: Record<string, number>;
};

export type RangeStats = {
  range: "all" | "50" | "10";
  drawCount: number;
  mainCounts: number[]; // index = number
  bonusCounts: number[];
  currentGaps: number[];
  expectedPerNumber: number;
  group6Totals: Record<string, number>;
  group6Expected: Record<string, number>;
  group6Empty: Record<string, number>;
  groupFineTotals: Record<string, number>;
  groupFineExpected: Record<string, number>;
  groupFineEmpty: Record<string, number>;
  /** list5 集計表: 出現回数の多い順 */
  frequencyRanking: Array<{ count: number; numbers: number[] }>;
  patternDistribution: Array<{ label: string; count: number; ratio: number }>;
  oddCountDistribution: Array<{ label: string; count: number; ratio: number }>;
};

export type NarrowingEntry = {
  number: number;
  score: number;
  group6: string;
  groupFine: string;
  recent50: number;
  gap: number;
  inPreviousDraw: boolean;
  tags: string[];
};

export type Narrowing = {
  targetDrawNumber: number;
  limit: number;
  selected: NarrowingEntry[];
  removed: NarrowingEntry[];
  selectedOddCount: number;
  selectedByGroup6: Record<string, number>;
  selectedByGroupFine: Record<string, number>;
  steps: string[];
  sampleTickets: Array<{ numbers: number[]; group6Code: string; sum: number; oddCount: number; note: string }>;
};

export type TrendData = {
  game: GameType;
  latestDrawNumber: number;
  group6: GroupDef[];
  groupFine: GroupDef[];
  groupFineLabel: string;
  rows: TrendRow[]; // 最新100回、新しい順
  stats: RangeStats[];
  narrowing: Narrowing;
};

export const PATTERN_NAMES: Array<{ code: number; label: string; shape: string }> = [
  { code: 1, label: "ファイブカード", shape: "5" },
  { code: 2, label: "フォーカード", shape: "4" },
  { code: 3, label: "フルハウス", shape: "3-2" },
  { code: 4, label: "スリーカード", shape: "3" },
  { code: 5, label: "スリーカード×2", shape: "3-3" },
  { code: 6, label: "スリーペア", shape: "2-2-2" },
  { code: 7, label: "ツーペア", shape: "2-2" },
  { code: 8, label: "ワンペア", shape: "2" },
  { code: 9, label: "ペア無し", shape: "1..." }
];

export function group6Defs(game: GameType): GroupDef[] {
  return game === "loto6"
    ? [
        { key: "A", from: 1, to: 7 },
        { key: "B", from: 8, to: 14 },
        { key: "C", from: 15, to: 21 },
        { key: "D", from: 22, to: 28 },
        { key: "E", from: 29, to: 35 },
        { key: "F", from: 36, to: 43 }
      ]
    : [
        { key: "A", from: 1, to: 6 },
        { key: "B", from: 7, to: 12 },
        { key: "C", from: 13, to: 18 },
        { key: "D", from: 19, to: 24 },
        { key: "E", from: 25, to: 30 },
        { key: "F", from: 31, to: 37 }
      ];
}

export function groupFineDefs(game: GameType): GroupDef[] {
  const max = GAME_SPECS[game].maxNumber;
  const count = game === "loto6" ? 11 : 9;
  const defs: GroupDef[] = [];
  for (let index = 0; index < count; index += 1) {
    const from = index * 4 + 1;
    const to = index === count - 1 ? max : from + 3;
    defs.push({ key: String(index + 1), from, to });
  }
  return defs;
}

function groupOf(defs: GroupDef[], number: number): string {
  return defs.find((def) => number >= def.from && number <= def.to)?.key ?? "?";
}

function countBy(defs: GroupDef[], numbers: number[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(defs.map((def) => [def.key, 0]));
  for (const number of numbers) {
    counts[groupOf(defs, number)] += 1;
  }
  return counts;
}

export function patternName(counts: Record<string, number>): string {
  const shape = Object.values(counts)
    .filter((value) => value > 0)
    .sort((a, b) => b - a);
  const [first = 0, second = 0, third = 0] = shape;
  if (first >= 5) return "ファイブカード";
  if (first === 4) return "フォーカード";
  if (first === 3 && second === 3) return "スリーカード×2";
  if (first === 3 && second === 2) return "フルハウス";
  if (first === 3) return "スリーカード";
  if (first === 2 && second === 2 && third === 2) return "スリーペア";
  if (first === 2 && second === 2) return "ツーペア";
  if (first === 2) return "ワンペア";
  return "ペア無し";
}

function buildRow(draw: Draw, previous: Draw | undefined, g6: GroupDef[], gf: GroupDef[]): TrendRow {
  const main = [...draw.mainNumbers].sort((a, b) => a - b);
  const bonus = [...draw.bonusNumbers].sort((a, b) => a - b);
  const withBonus = [...main, ...bonus];
  const group6Counts = countBy(g6, withBonus);
  const groupFineCounts = countBy(gf, main);
  const previousSet = new Set(previous?.mainNumbers ?? []);
  return {
    drawNumber: draw.drawNumber,
    drawDate: draw.drawDate,
    main,
    bonus,
    sum: main.reduce((total, value) => total + value, 0),
    oddCount: main.filter((value) => value % 2 === 1).length,
    consecutivePairs: main.filter((value, index) => main[index + 1] === value + 1).length,
    carriedFromPrevious: main.filter((value) => previousSet.has(value)).length,
    group6Code: withBonus.map((value) => groupOf(g6, value)).join(""),
    group6Counts,
    group6Pattern: patternName(group6Counts),
    groupFineCode: main.map((value) => groupOf(gf, value)).join(","),
    groupFineCounts
  };
}

function buildRangeStats(game: GameType, rows: TrendRow[], allRows: TrendRow[], range: RangeStats["range"], g6: GroupDef[], gf: GroupDef[]): RangeStats {
  const spec = GAME_SPECS[game];
  const domain = numbersForGame(game);
  const mainCounts = Array(spec.maxNumber + 1).fill(0) as number[];
  const bonusCounts = Array(spec.maxNumber + 1).fill(0) as number[];
  const currentGaps = Array(spec.maxNumber + 1).fill(0) as number[];
  for (const row of rows) {
    for (const number of row.main) mainCounts[number] += 1;
    for (const number of row.bonus) bonusCounts[number] += 1;
  }
  // 未出現回数は表示範囲に関係なく最新回から数える (allRows は新しい順)
  for (const number of domain) {
    const index = allRows.findIndex((row) => row.main.includes(number));
    currentGaps[number] = index < 0 ? allRows.length : index;
  }
  const group6Totals: Record<string, number> = Object.fromEntries(g6.map((def) => [def.key, 0]));
  const group6Empty: Record<string, number> = Object.fromEntries(g6.map((def) => [def.key, 0]));
  const groupFineTotals: Record<string, number> = Object.fromEntries(gf.map((def) => [def.key, 0]));
  const groupFineEmpty: Record<string, number> = Object.fromEntries(gf.map((def) => [def.key, 0]));
  const patternCount = new Map<string, number>();
  const oddCount = new Map<number, number>();
  for (const row of rows) {
    const main6 = countBy(g6, row.main);
    for (const def of g6) {
      group6Totals[def.key] += main6[def.key];
      if (main6[def.key] === 0) group6Empty[def.key] += 1;
    }
    for (const def of gf) {
      groupFineTotals[def.key] += row.groupFineCounts[def.key];
      if (row.groupFineCounts[def.key] === 0) groupFineEmpty[def.key] += 1;
    }
    patternCount.set(row.group6Pattern, (patternCount.get(row.group6Pattern) ?? 0) + 1);
    oddCount.set(row.oddCount, (oddCount.get(row.oddCount) ?? 0) + 1);
  }
  const perNumber = (rows.length * spec.mainCount) / spec.maxNumber;
  const expected = (defs: GroupDef[]) => Object.fromEntries(defs.map((def) => [def.key, Number((perNumber * (def.to - def.from + 1)).toFixed(1))]));
  const byCount = new Map<number, number[]>();
  for (const number of domain) {
    const list = byCount.get(mainCounts[number]) ?? [];
    list.push(number);
    byCount.set(mainCounts[number], list);
  }
  return {
    range,
    drawCount: rows.length,
    mainCounts,
    bonusCounts,
    currentGaps,
    expectedPerNumber: Number(perNumber.toFixed(1)),
    group6Totals,
    group6Expected: expected(g6),
    group6Empty,
    groupFineTotals,
    groupFineExpected: expected(gf),
    groupFineEmpty,
    frequencyRanking: [...byCount.entries()].sort((a, b) => b[0] - a[0]).map(([count, numbers]) => ({ count, numbers })),
    patternDistribution: PATTERN_NAMES.map((pattern) => pattern.label)
      .map((label) => ({ label, count: patternCount.get(label) ?? 0, ratio: rows.length ? (patternCount.get(label) ?? 0) / rows.length : 0 }))
      .filter((entry) => entry.count > 0),
    oddCountDistribution: Array.from({ length: spec.mainCount + 1 }, (_, count) => ({
      label: `奇数${count}個`,
      count: oddCount.get(count) ?? 0,
      ratio: rows.length ? (oddCount.get(count) ?? 0) / rows.length : 0
    }))
  };
}

function zScores(values: number[]): number[] {
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance) || 1;
  return values.map((value) => (value - mean) / std);
}

/**
 * 絞り込み: 数理コアのスコア (smart_mix) を土台に、傾向表から読める偏りを soft signal として加え、
 * 組ごとの最低人数を守りながら上位 limit 個を残す。残らなかった数字が「削除数字」。
 */
export function buildNarrowing(game: GameType, history: Draw[], rows: TrendRow[], stats50: RangeStats, statsAll: RangeStats, g6: GroupDef[], gf: GroupDef[], limit = 25): Narrowing {
  const spec = GAME_SPECS[game];
  const domain = numbersForGame(game);
  const latest = history.at(-1);
  const previousSet = new Set(latest?.mainNumbers ?? []);
  const features = computeNumberFeatures(game, history, 20260914);
  const base = scoreNumbers("smart_mix", features);
  const baseZ = zScores(domain.map((number) => base.find((score) => score.number === number)?.total ?? 0));
  const hotZ = zScores(domain.map((number) => stats50.mainCounts[number]));
  const gapZ = zScores(domain.map((number) => statsAll.currentGaps[number]));
  const g6Deficit = Object.fromEntries(g6.map((def) => [def.key, (stats50.group6Expected[def.key] - stats50.group6Totals[def.key]) / Math.sqrt(stats50.group6Expected[def.key])]));
  const gfDeficit = Object.fromEntries(gf.map((def) => [def.key, (stats50.groupFineExpected[def.key] - stats50.groupFineTotals[def.key]) / Math.sqrt(stats50.groupFineExpected[def.key])]));
  const recent12 = rows.slice(0, 12);

  const entries: NarrowingEntry[] = domain.map((number, index) => {
    const group6 = groupOf(g6, number);
    const groupFine = groupOf(gf, number);
    const gap = statsAll.currentGaps[number];
    const recent50 = stats50.mainCounts[number];
    const tags: string[] = [];
    let score = baseZ[index];
    // 傾向表シグナル (すべて soft)
    score += 0.35 * hotZ[index];
    if (hotZ[index] >= 1) tags.push("直近50回ホット");
    if (gap >= 10) {
      score += Math.min(0.6, 0.25 + 0.03 * (gap - 10));
      tags.push(`未出現${gap}回`);
    } else if (gapZ[index] >= 0.8) {
      score += 0.1;
    }
    score += 0.3 * (g6Deficit[group6] ?? 0);
    if ((g6Deficit[group6] ?? 0) >= 0.8) tags.push(`${group6}組不足`);
    score += 0.2 * (gfDeficit[groupFine] ?? 0);
    const emptyStreak = recent12.filter((row) => !row.main.some((value) => groupOf(g6, value) === group6)).length;
    if (emptyStreak >= 4) {
      score += 0.15;
      tags.push(`${group6}組が直近12回で${emptyStreak}回空`);
    }
    if (previousSet.has(number)) {
      score -= 0.6;
      tags.push("前回本数字");
    }
    return { number, score: Number(score.toFixed(3)), group6, groupFine, recent50, gap, inPreviousDraw: previousSet.has(number), tags };
  });

  const ranked = [...entries].sort((a, b) => b.score - a.score);
  const selected = new Set<number>();
  const steps: string[] = [];
  const minPerGroup6 = game === "loto6" ? 3 : 2;

  // 1. 各6分割グループから最低人数を確保 (空組を作らない)
  for (const def of g6) {
    ranked.filter((entry) => entry.group6 === def.key).slice(0, minPerGroup6).forEach((entry) => selected.add(entry.number));
  }
  steps.push(`6分割の各組から上位${minPerGroup6}個ずつ確保 (${g6.length * minPerGroup6}個)。組が空になる形は過去${statsAll.drawCount}回で稀なため。`);
  // 2. 細分割の各組から最低1個
  for (const def of gf) {
    if (!ranked.some((entry) => entry.groupFine === def.key && selected.has(entry.number))) {
      const top = ranked.find((entry) => entry.groupFine === def.key);
      if (top) selected.add(top.number);
    }
  }
  steps.push(`${gf.length}分割の各組にも最低1個を確保 (${selected.size}個)。`);
  // 3. 前回本数字は最大2個まで (持ち越し平均 ≈ 理論値 mainCount²/maxNumber)
  const carryLimit = 2;
  const carried = ranked.filter((entry) => entry.inPreviousDraw && selected.has(entry.number));
  for (const entry of carried.slice(carryLimit)) selected.delete(entry.number);
  // 4. 残りをスコア順に埋める。奇数偶数は 40〜60% の範囲に寄せる。
  const oddTarget = { min: Math.floor(limit * 0.4), max: Math.ceil(limit * 0.6) };
  for (const entry of ranked) {
    if (selected.size >= limit) break;
    if (selected.has(entry.number)) continue;
    if (entry.inPreviousDraw && [...selected].filter((value) => previousSet.has(value)).length >= carryLimit) continue;
    const oddNow = [...selected].filter((value) => value % 2 === 1).length;
    const evenNow = selected.size - oddNow;
    if (entry.number % 2 === 1 && oddNow >= oddTarget.max) continue;
    if (entry.number % 2 === 0 && evenNow >= limit - oddTarget.min) continue;
    selected.add(entry.number);
  }
  for (const entry of ranked) {
    if (selected.size >= limit) break;
    selected.add(entry.number);
  }
  steps.push(`残りはスコア順に補充。前回本数字は${carryLimit}個まで、奇数は${oddTarget.min}〜${oddTarget.max}個に収める (計${selected.size}個)。`);

  const selectedEntries = entries.filter((entry) => selected.has(entry.number));
  const removedEntries = entries.filter((entry) => !selected.has(entry.number));
  const sampleTickets = buildSampleTickets(game, selectedEntries, g6, spec.mainCount, previousSet);

  return {
    targetDrawNumber: (latest?.drawNumber ?? 0) + 1,
    limit,
    selected: selectedEntries,
    removed: removedEntries,
    selectedOddCount: selectedEntries.filter((entry) => entry.number % 2 === 1).length,
    selectedByGroup6: countBy(g6, selectedEntries.map((entry) => entry.number)),
    selectedByGroupFine: countBy(gf, selectedEntries.map((entry) => entry.number)),
    steps,
    sampleTickets
  };
}

/** 絞り込んだ数字だけで組んだ参考口。組の形を 2-2-1-1 / 2-1-1-1-1 系に揃え、口同士の重なりを抑える。 */
function buildSampleTickets(game: GameType, pool: NarrowingEntry[], g6: GroupDef[], mainCount: number, previousSet: Set<number>) {
  const tickets: Array<{ numbers: number[]; group6Code: string; sum: number; oddCount: number; note: string }> = [];
  const usage = new Map<number, number>();
  const sorted = [...pool].sort((a, b) => b.score - a.score);
  const notes = ["上位スコア中心", "組不足を厚めに", "未出現を回収", "ホット継続", "分散重視"];
  for (let ticketIndex = 0; ticketIndex < 5; ticketIndex += 1) {
    const chosen: NarrowingEntry[] = [];
    const perGroup = new Map<string, number>();
    const order = [...sorted].sort((a, b) => {
      const penalty = (entry: NarrowingEntry) => (usage.get(entry.number) ?? 0) * 0.9 + (ticketIndex === 2 && entry.gap >= 10 ? -0.8 : 0) + (ticketIndex === 1 && entry.tags.some((tag) => tag.includes("不足")) ? -0.8 : 0) + (ticketIndex === 3 && entry.recent50 > 0 ? -0.05 * entry.recent50 : 0);
      return b.score - penalty(b) - (a.score - penalty(a)) + (ticketIndex * 0.013 * ((a.number * 7919) % 13 - (b.number * 7919) % 13));
    });
    for (const entry of order) {
      if (chosen.length >= mainCount) break;
      const g = entry.group6;
      if ((perGroup.get(g) ?? 0) >= 2) continue;
      if (entry.inPreviousDraw && chosen.some((value) => value.inPreviousDraw)) continue;
      const oddNow = chosen.filter((value) => value.number % 2 === 1).length;
      const parityCap = Math.floor(mainCount / 2) + 1;
      if (entry.number % 2 === 1 && oddNow >= parityCap) continue;
      if (entry.number % 2 === 0 && chosen.length - oddNow >= parityCap) continue;
      chosen.push(entry);
      perGroup.set(g, (perGroup.get(g) ?? 0) + 1);
    }
    for (const entry of order) {
      if (chosen.length >= mainCount) break;
      if (!chosen.includes(entry)) chosen.push(entry);
    }
    const numbers = chosen.map((entry) => entry.number).sort((a, b) => a - b);
    for (const number of numbers) usage.set(number, (usage.get(number) ?? 0) + 1);
    tickets.push({
      numbers,
      group6Code: numbers.map((value) => groupOf(g6, value)).join(""),
      sum: numbers.reduce((total, value) => total + value, 0),
      oddCount: numbers.filter((value) => value % 2 === 1).length,
      note: `${notes[ticketIndex]}${numbers.some((value) => previousSet.has(value)) ? "・前回数字1個" : ""}`
    });
  }
  return tickets;
}

export function buildTrendData(game: GameType, draws: Draw[]): TrendData {
  const history = draws.filter((draw) => draw.game === game).sort((a, b) => a.drawNumber - b.drawNumber);
  const g6 = group6Defs(game);
  const gf = groupFineDefs(game);
  const allRows = history.map((draw, index) => buildRow(draw, history[index - 1], g6, gf)).reverse();
  const statsAll = buildRangeStats(game, allRows, allRows, "all", g6, gf);
  const stats50 = buildRangeStats(game, allRows.slice(0, 50), allRows, "50", g6, gf);
  const stats10 = buildRangeStats(game, allRows.slice(0, 10), allRows, "10", g6, gf);
  return {
    game,
    latestDrawNumber: history.at(-1)?.drawNumber ?? 0,
    group6: g6,
    groupFine: gf,
    groupFineLabel: `${gf.length}分割`,
    rows: allRows.slice(0, 100),
    stats: [statsAll, stats50, stats10],
    narrowing: buildNarrowing(game, history, allRows, stats50, statsAll, g6, gf)
  };
}
