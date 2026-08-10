import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BASE_DISCLAIMER, GAME_SPECS, STRATEGY_LABELS } from "../src/loto/constants";
import { generateTickets } from "../src/loto/generator";
import { formatYen, padNumber } from "../src/loto/format";
import type { Draw, GameType, PredictionTicket } from "../src/loto/types";

const BUDGET_YEN = 10_000;

// 予想対象はロト7のみ。予算配分: 33口 x 300円 = 9,900円（残り100円は1口に満たないため未使用）
const TARGET_GAMES: GameType[] = ["loto7"];

const PLAN: Partial<Record<GameType, { ticketCount: number; seed: number }>> = {
  loto7: { ticketCount: 33, seed: 20260814 }
};

// ロト6は月・木、ロト7は金に抽せんされる。
const DRAW_WEEKDAYS: Record<GameType, number[]> = {
  loto6: [1, 4],
  loto7: [5]
};

async function readDraws(game: GameType): Promise<Draw[]> {
  const raw = await readFile(path.join("data", "processed", `${game}_draws.json`), "utf8");
  return JSON.parse(raw) as Draw[];
}

function nextDrawDate(game: GameType, latestDrawDate: string): string {
  const weekdays = DRAW_WEEKDAYS[game];
  const cursor = new Date(`${latestDrawDate}T00:00:00Z`);
  for (let step = 1; step <= 14; step += 1) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (weekdays.includes(cursor.getUTCDay())) {
      return cursor.toISOString().slice(0, 10);
    }
  }
  return latestDrawDate;
}

function weekdayLabel(isoDate: string): string {
  return ["日", "月", "火", "水", "木", "金", "土"][new Date(`${isoDate}T00:00:00Z`).getUTCDay()] ?? "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function numbersHtml(ticket: PredictionTicket): string {
  return ticket.numbers.map((number) => `<span class="ball">${padNumber(number)}</span>`).join("");
}

function coverageRows(tickets: PredictionTicket[], game: GameType): string {
  const counts = new Map<number, number>();
  for (const ticket of tickets) {
    for (const number of ticket.numbers) {
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }
  }
  const used = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const total = GAME_SPECS[game].maxNumber;
  return `
    <p class="note">使用数字 ${used.length} / ${total} 個（同じ数字が複数口に入る場合があります）</p>
    <div class="coverage">
      ${used.map(([number, count]) => `<span class="chip">${padNumber(number)}<em>${count}口</em></span>`).join("")}
    </div>`;
}

function gameSection(
  game: GameType,
  tickets: PredictionTicket[],
  nextDrawNumber: number,
  nextDate: string
): string {
  const spec = GAME_SPECS[game];
  const cost = spec.ticketPriceYen * tickets.length;
  const strategyCounts = new Map<string, number>();
  for (const ticket of tickets) {
    const label = STRATEGY_LABELS[ticket.strategy];
    strategyCounts.set(label, (strategyCounts.get(label) ?? 0) + 1);
  }

  return `
  <section class="game" id="${game}">
    <header class="game-head">
      <h2>${spec.label}　第${nextDrawNumber}回</h2>
      <p class="meta">抽せん日 ${nextDate}（${weekdayLabel(nextDate)}）／ ${tickets.length}口 × ${formatYen(spec.ticketPriceYen)} = <strong>${formatYen(cost)}</strong></p>
      <p class="meta">戦略の内訳：${[...strategyCounts.entries()].map(([label, count]) => `${escapeHtml(label)} ${count}口`).join(" ／ ")}</p>
    </header>
    <table>
      <thead>
        <tr><th>No.</th><th>買い目</th><th>戦略</th><th>スコア</th><th>着眼点</th></tr>
      </thead>
      <tbody>
        ${tickets
          .map(
            (ticket, index) => `
        <tr>
          <td class="idx">${index + 1}</td>
          <td class="nums">${numbersHtml(ticket)}</td>
          <td>${escapeHtml(STRATEGY_LABELS[ticket.strategy])}</td>
          <td class="score">${ticket.totalScore.toFixed(1)}</td>
          <td class="why">${escapeHtml(ticket.explanations.slice(0, 2).join(" / "))}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
    ${coverageRows(tickets, game)}
  </section>`;
}

function buildHtml(sections: string[], generatedAt: string, dataVersions: string[]): string {
  const totalTickets = TARGET_GAMES.reduce((sum, game) => sum + (PLAN[game]?.ticketCount ?? 0), 0);
  const totalCost = TARGET_GAMES.reduce(
    (sum, game) => sum + GAME_SPECS[game].ticketPriceYen * (PLAN[game]?.ticketCount ?? 0),
    0
  );
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>ロト7 10,000円分 参考買い目プラン</title>
<style>
  :root { color-scheme: light dark; --bg:#f6f7f9; --fg:#16181d; --card:#fff; --line:#dfe3ea; --muted:#5b6472; --accent:#1d4ed8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#111318; --fg:#e9ecf2; --card:#1a1d24; --line:#2c313b; --muted:#9aa4b4; --accent:#7aa2ff; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px 64px; background:var(--bg); color:var(--fg);
         font-family:"Hiragino Kaku Gothic ProN","Yu Gothic UI","Meiryo",system-ui,sans-serif; line-height:1.6; }
  main { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 1.6rem; margin: 0 0 4px; }
  h2 { font-size: 1.2rem; margin: 0 0 4px; }
  .lede { color: var(--muted); margin: 0 0 20px; font-size: .92rem; }
  .summary, .game, .disclaimer { background: var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; margin-bottom:18px; }
  .summary table { margin-top: 8px; }
  table { width:100%; border-collapse: collapse; font-size:.92rem; }
  th, td { border-bottom:1px solid var(--line); padding:8px 6px; text-align:left; vertical-align: middle; }
  th { color: var(--muted); font-weight:600; white-space:nowrap; }
  .idx { width:2.4rem; color:var(--muted); }
  .score { width:4rem; text-align:right; font-variant-numeric: tabular-nums; }
  .why { color: var(--muted); font-size:.85rem; }
  .nums { white-space: nowrap; }
  .ball { display:inline-block; min-width:2rem; margin-right:4px; padding:3px 0; text-align:center;
          border-radius:999px; background:var(--accent); color:#fff; font-variant-numeric: tabular-nums; font-size:.85rem; }
  .meta { margin:2px 0; color:var(--muted); font-size:.88rem; }
  .note { color:var(--muted); font-size:.85rem; margin:14px 0 6px; }
  .coverage { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { border:1px solid var(--line); border-radius:8px; padding:2px 8px; font-size:.8rem; font-variant-numeric: tabular-nums; }
  .chip em { color:var(--muted); font-style:normal; margin-left:4px; font-size:.72rem; }
  .disclaimer { font-size:.85rem; color:var(--muted); }
  .table-wrap { overflow-x:auto; }
  strong { font-weight:700; }
</style>
</head>
<body>
<main>
  <h1>ロト7 10,000円分 参考買い目プラン</h1>
  <p class="lede">過去の抽せんデータをもとに作成した参考買い目です。当選を保証するものではありません。作成日時: ${generatedAt}</p>

  <section class="summary">
    <h2>予算配分</h2>
    <div class="table-wrap">
    <table>
      <thead><tr><th>くじ</th><th>口数</th><th>単価</th><th>金額</th></tr></thead>
      <tbody>
        ${TARGET_GAMES.map((game) => {
          const count = PLAN[game]?.ticketCount ?? 0;
          const price = GAME_SPECS[game].ticketPriceYen;
          return `<tr><td>${GAME_SPECS[game].label}</td><td>${count}口</td><td>${formatYen(price)}</td><td>${formatYen(price * count)}</td></tr>`;
        }).join("\n        ")}
        <tr><td><strong>合計</strong></td><td>${totalTickets}口</td><td>-</td><td><strong>${formatYen(totalCost)}</strong></td></tr>
      </tbody>
    </table>
    </div>
    <p class="note">予算 ${formatYen(BUDGET_YEN)} のうち ${formatYen(totalCost)} を使用${
      BUDGET_YEN - totalCost > 0 ? `（残り ${formatYen(BUDGET_YEN - totalCost)} は1口の金額に満たないため未使用）` : ""
    }。</p>
    <p class="note">使用データ: ${dataVersions.join(" / ")}</p>
  </section>

  ${sections.join("\n")}

  <section class="disclaimer">
    <p>${BASE_DISCLAIMER}</p>
    <p>ロト7は毎回独立したランダム抽せんです。過去データから未来の当せん番号を当てることはできず、この買い目によって当せん確率が上がることもありません。購入は必ず無理のない金額の範囲で行ってください。</p>
  </section>
</main>
</body>
</html>
`;
}

async function main() {
  const sections: string[] = [];
  const dataVersions: string[] = [];

  for (const game of TARGET_GAMES) {
    const draws = await readDraws(game);
    const latest = draws.at(-1);
    if (!latest) {
      throw new Error(`No draws for ${game}`);
    }
    const plan = PLAN[game];
    if (!plan) {
      throw new Error(`No plan configured for ${game}`);
    }
    const { ticketCount, seed } = plan;
    const tickets = generateTickets(draws, {
      game,
      strategy: "smart_mix",
      ticketCount,
      seed,
      candidateTuningMode: "light",
      randomStrength: 50,
      highReturnStrength: 50
    });
    sections.push(gameSection(game, tickets, latest.drawNumber + 1, nextDrawDate(game, latest.drawDate)));
    dataVersions.push(`${GAME_SPECS[game].label} 第${latest.drawNumber}回まで（${latest.drawDate}）`);
  }

  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const html = buildHtml(sections, generatedAt, dataVersions);
  const outDir = path.join("artifacts", "reports");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "purchase-plan-10000yen.html");
  await writeFile(outPath, html, "utf8");
  console.log(`purchase plan written: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
