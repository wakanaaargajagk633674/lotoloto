import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";
import type { Draw, GameType, PrizeTier } from "./types";
import { GAME_SPECS } from "./constants";

type ParseMeta = {
  source: string;
  sourceDownloadedAt?: string | null;
  sourceHash?: string | null;
};

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const normalized = String(value).replaceAll(",", "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRequiredNumber(value: unknown, column: string): number {
  const parsed = toNumber(value);
  if (parsed === null) {
    throw new Error(`Missing numeric value for ${column}`);
  }
  return parsed;
}

export function decodeLotoCsv(buffer: Buffer): string {
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("�") && utf8.includes("抽せん回")) {
    return utf8;
  }
  return iconv.decode(buffer, "Shift_JIS");
}

export function parseLotoCsvBuffer(game: GameType, buffer: Buffer, meta: ParseMeta): Draw[] {
  return parseLotoCsvText(game, decodeLotoCsv(buffer), meta);
}

export function parseLotoCsvText(game: GameType, text: string, meta: ParseMeta): Draw[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  }) as Record<string, string>[];
  const spec = GAME_SPECS[game];

  return records
    .map((record): Draw => {
      const mainNumbers = Array.from({ length: spec.mainCount }, (_, index) =>
        toRequiredNumber(record[`本数字${index + 1}`], `本数字${index + 1}`)
      );
      const bonusNumbers = Array.from({ length: spec.bonusCount }, (_, index) => {
        const column = spec.bonusCount === 1 ? "ボーナス数字" : `ボーナス数字${index + 1}`;
        return toRequiredNumber(record[column], column);
      });
      const prizeTiers: PrizeTier[] = Array.from(
        { length: game === "loto6" ? 5 : 6 },
        (_, index) => {
          const tier = index + 1;
          return {
            tier,
            winners: toNumber(record[`${tier}等口数`]),
            prizeYen: toNumber(record[`${tier}等賞金`])
          };
        }
      );

      return {
        game,
        drawNumber: toRequiredNumber(record["抽せん回"], "抽せん回"),
        drawDate: normalizeDate(record["抽せん日"]),
        dayOfWeek: record["曜日"] || null,
        mainNumbers: mainNumbers.sort((a, b) => a - b),
        bonusNumbers: bonusNumbers.sort((a, b) => a - b),
        salesAmount: toNumber(record["販売実績額"] ?? record["販売実績"]),
        carryoverAmount: toNumber(record["キャリーオーバー"]),
        prizeTiers,
        source: meta.source,
        sourceDownloadedAt: meta.sourceDownloadedAt ?? null,
        sourceHash: meta.sourceHash ?? null
      };
    })
    .sort((a, b) => a.drawNumber - b.drawNumber);
}

function normalizeDate(value: string | undefined): string {
  if (!value) {
    throw new Error("Missing draw date");
  }
  const [year, month, day] = value.split("/").map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error(`Invalid draw date: ${value}`);
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

export function serializeDrawsCsv(draws: Draw[]): string {
  const headers = [
    "game",
    "drawNumber",
    "drawDate",
    "mainNumbers",
    "bonusNumbers",
    "salesAmount",
    "carryoverAmount",
    "prizeTiers"
  ];
  const lines = draws.map((draw) =>
    [
      draw.game,
      draw.drawNumber,
      draw.drawDate,
      draw.mainNumbers.join(" "),
      draw.bonusNumbers.join(" "),
      draw.salesAmount ?? "",
      draw.carryoverAmount ?? "",
      JSON.stringify(draw.prizeTiers).replaceAll("\"", "\"\"")
    ]
      .map((value) => `"${String(value)}"`)
      .join(",")
  );
  return `${headers.join(",")}\n${lines.join("\n")}\n`;
}
