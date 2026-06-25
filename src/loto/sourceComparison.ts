import type { Draw, GameType } from "./types";

export type SourceComparisonRow = {
  game: GameType;
  drawNumber: number;
  officialDate: string | null;
  historyDate: string | null;
  status: "ok" | "missing_official" | "missing_history" | "different";
  differentFields: string[];
  officialSource: string | null;
  historySource: string | null;
};

export function compareDrawSources(game: GameType, officialDraws: Draw[], historyDraws: Draw[]): SourceComparisonRow[] {
  const officialByDraw = new Map(officialDraws.map((draw) => [draw.drawNumber, draw]));
  const historyByDraw = new Map(historyDraws.map((draw) => [draw.drawNumber, draw]));
  const allDrawNumbers = [...new Set([...officialByDraw.keys(), ...historyByDraw.keys()])].sort((a, b) => a - b);
  return allDrawNumbers.map((drawNumber) => {
    const official = officialByDraw.get(drawNumber);
    const history = historyByDraw.get(drawNumber);
    if (!official) {
      return {
        game,
        drawNumber,
        officialDate: null,
        historyDate: history?.drawDate ?? null,
        status: "missing_official",
        differentFields: [],
        officialSource: null,
        historySource: history?.source ?? null
      };
    }
    if (!history) {
      return {
        game,
        drawNumber,
        officialDate: official.drawDate,
        historyDate: null,
        status: "missing_history",
        differentFields: [],
        officialSource: official.source,
        historySource: null
      };
    }
    const differentFields = diffDraw(official, history);
    return {
      game,
      drawNumber,
      officialDate: official.drawDate,
      historyDate: history.drawDate,
      status: differentFields.length ? "different" : "ok",
      differentFields,
      officialSource: official.source,
      historySource: history.source
    };
  });
}

export function serializeSourceComparisonCsv(rows: SourceComparisonRow[]): string {
  const headers = ["game", "drawNumber", "officialDate", "historyDate", "status", "differentFields", "officialSource", "historySource"];
  return `${headers.join(",")}\n${rows
    .map((row) =>
      [
        row.game,
        row.drawNumber,
        row.officialDate ?? "",
        row.historyDate ?? "",
        row.status,
        row.differentFields.join("|"),
        row.officialSource ?? "",
        row.historySource ?? ""
      ]
        .map(csvCell)
        .join(",")
    )
    .join("\n")}\n`;
}

export function summarizeComparison(rows: SourceComparisonRow[]) {
  const officialRows = rows.filter((row) => row.status !== "missing_official");
  return {
    totalRows: rows.length,
    officialRows: officialRows.length,
    overlapRows: rows.filter((row) => row.status === "ok" || row.status === "different").length,
    okRows: rows.filter((row) => row.status === "ok").length,
    differentRows: rows.filter((row) => row.status === "different").length,
    missingOfficialRows: rows.filter((row) => row.status === "missing_official").length,
    missingHistoryRows: rows.filter((row) => row.status === "missing_history").length,
    firstOfficialDraw: officialRows.at(0)?.drawNumber ?? null,
    latestOfficialDraw: officialRows.at(-1)?.drawNumber ?? null
  };
}

function diffDraw(official: Draw, history: Draw): string[] {
  const diffs: string[] = [];
  if (official.drawDate !== history.drawDate) diffs.push("drawDate");
  if (official.mainNumbers.join(" ") !== history.mainNumbers.join(" ")) diffs.push("mainNumbers");
  if (official.bonusNumbers.join(" ") !== history.bonusNumbers.join(" ")) diffs.push("bonusNumbers");
  if (!sameNullableNumber(official.salesAmount, history.salesAmount)) diffs.push("salesAmount");
  if (!sameNullableNumber(official.carryoverAmount, history.carryoverAmount)) diffs.push("carryoverAmount");
  for (const tier of official.prizeTiers) {
    const historyTier = history.prizeTiers.find((item) => item.tier === tier.tier);
    if (!historyTier) {
      diffs.push(`tier${tier.tier}`);
      continue;
    }
    if (!sameNullableNumber(tier.winners, historyTier.winners)) diffs.push(`tier${tier.tier}Winners`);
    if (!sameNullableNumber(tier.prizeYen, historyTier.prizeYen)) diffs.push(`tier${tier.tier}Prize`);
  }
  return diffs;
}

function sameNullableNumber(a: number | null, b: number | null): boolean {
  if ((a === null && b === 0) || (a === 0 && b === null)) {
    return true;
  }
  return (a ?? null) === (b ?? null);
}

function csvCell(value: unknown): string {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}
