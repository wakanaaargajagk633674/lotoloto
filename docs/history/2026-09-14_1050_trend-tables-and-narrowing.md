# Trend Tables (sougaku 式) と絞り込み参考の追加

Date: 2026-09-14 10:50 JST

## データ更新

- loto6 第2136回 (2026-09-10: 06 07 33 37 41 43 / B 42) と loto7 第694回 (2026-09-11: 03 13 24 26 30 31 36 / B 23 34) を反映。
- `data:download` → `data:official` → `data:parse` → `data:compare` → `data:analysis` → `data:downloads` → `backtest` → `backtest:portfolio` を実行。

## 追加機能 (`/loto6/patterns`, `/loto7/patterns`)

- `src/loto/trends.ts` 新設。sougaku の list2〜list5 に相当する表データと絞り込み候補を生成し、`data/analysis/{game}_trends.json` に出力。
  - 全数字出目表 (●本数字 ○ボーナス) + 下段に出現回数・ボーナス回数・未出現回数、行ごとに奇数個数と合計。
  - 6分割傾向表 (本数字＋ボーナス): 組記号の並び (例 ABBDEFF)、●◎★☆◆、当せんパターン名 (フルハウス等)。
  - 細分割傾向表 (ロト7=9分割 / ロト6=11分割、本数字のみ) と空組。
  - 集計表 (全回 / 最新50回 / 最新10回) と出現回数グラフ。
- 絞り込み参考 (25数字以内): `smart_mix` の数理スコアを土台に、直近50回ホット度・未出現・組不足・空組回数を soft signal として加点、前回本数字を減点。6分割各組の最低人数と細分割各組1個以上を確保し、奇数偶数比を 40〜60% に収める。残らなかった数字を「削除数字」として理由付きで表示。絞り込んだ数字だけで組んだ参考5口も掲載。
- `TrendTables.tsx` (client, タブ・表示範囲切替) / `NarrowingSection.tsx` (server)。CSS は `globals.css` 末尾。
- `tests/trends.test.ts` 4件追加。

## 表示上の注意

- すべて「参考」「soft signal」として表記し、除外や当せん保証を主張しない (AGENTS.md)。

## 検証

- `npm test` (29 passed), `npm run typecheck`, `npm run build` 成功。Playwright で PC/スマホ幅の表示を確認。
