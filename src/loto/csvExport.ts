import type { Draw } from "./types";
import type { NumberAnalysis } from "./analysis";

export function withBom(csv: string): string {
  return `\uFEFF${csv}`;
}

export function serializeJapaneseDrawsCsv(draws: Draw[]): string {
  const headers = [
    "回号",
    "抽せん日",
    "本数字1",
    "本数字2",
    "本数字3",
    "本数字4",
    "本数字5",
    "本数字6",
    "本数字7",
    "ボーナス数字1",
    "ボーナス数字2",
    "販売実績額",
    "キャリーオーバー",
    "1等口数",
    "1等当せん金額",
    "2等口数",
    "2等当せん金額",
    "3等口数",
    "3等当せん金額",
    "4等口数",
    "4等当せん金額",
    "5等口数",
    "5等当せん金額",
    "6等口数",
    "6等当せん金額"
  ];
  return tableToCsv(
    headers,
    draws.map((draw) => {
      const main = Array.from({ length: 7 }, (_, index) => draw.mainNumbers[index] ?? "");
      const bonus = Array.from({ length: 2 }, (_, index) => draw.bonusNumbers[index] ?? "");
      const tiers = Array.from({ length: 6 }, (_, index) => {
        const tier = draw.prizeTiers.find((item) => item.tier === index + 1);
        return [tier?.winners ?? "", tier?.prizeYen ?? ""];
      }).flat();
      return [
        draw.drawNumber,
        draw.drawDate,
        ...main,
        ...bonus,
        draw.salesAmount ?? "",
        draw.carryoverAmount ?? "",
        ...tiers
      ];
    })
  );
}

export function serializeNumberFrequencyCsv(rows: NumberAnalysis[]): string {
  return tableToCsv(
    [
      "数字",
      "全期間の出現回数",
      "直近30回の出現回数",
      "直近50回の出現回数",
      "直近100回の出現回数",
      "直近300回の出現回数",
      "最後に出た回号",
      "前回からの間隔",
      "平均出現間隔",
      "最大未出現間隔"
    ],
    rows.map((row) => [
      row.number,
      row.totalFrequency,
      row.recent30Frequency,
      row.recent50Frequency,
      row.recent100Frequency,
      row.recent300Frequency,
      row.lastSeenDraw ?? "",
      row.lastSeenGap,
      row.averageGap?.toFixed(2) ?? "",
      row.maxGap ?? ""
    ])
  );
}

export function serializeRecent100Csv(rows: NumberAnalysis[]): string {
  return tableToCsv(
    ["数字", "直近100回の出現回数", "前回からの間隔", "過去出現回数"],
    rows.map((row) => [row.number, row.recent100Frequency, row.lastSeenGap, row.totalFrequency])
  );
}

export function serializeObjectsCsv<T extends Record<string, unknown>>(headers: string[], rows: T[], accessors: Array<(row: T) => unknown>): string {
  return tableToCsv(headers, rows.map((row) => accessors.map((accessor) => accessor(row))));
}

export function tableToCsv(headers: string[], rows: unknown[][]): string {
  return `${headers.map(csvCell).join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}
