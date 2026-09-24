# 2026-09-25 08:30 予想の出し方 25人会議 (10ループ) と人気度モデルの較正

## データ更新
- ロト6 第2140回 (2026-09-24) を追加。本数字 4 10 11 19 21 33 / ボーナス 30。1等 該当なし、キャリーオーバー 191,016,277円。
- ロト7 は第695回のまま (第696回は 2026-09-25 抽せん)。
- ZIP SHA-256: loto6=fb5c77a0f11fdb305acd5106e58c500e6a8a6d9e2d41d2a3b5e63697720fddc4

## 実装
- `src/loto/popularityCalibration.ts` を新設 (等級別理論確率、等級換算係数 c_k、累積型 Ridge、ウォークフォワード、1等口数の Poisson 較正、入れ子検証、全等級の期待払戻)。
- `popularity.ts` / `scoring.ts` / `explanations.ts` / `types.ts` に較正モデルを接続。設定は `strategyWeights.ts` の `popularityCalibrationSettings`。
- `npm run validate:popularity` → `docs/backtest/popularity-calibration-report.md`, `data/analysis/popularity_calibration.json`。
- テスト `tests/popularityCalibration.test.ts` (7件)。

## 検証
- 入れ子の標本外検証 (1等口数の対数尤度改善): ロト6 旧 +72.4 → 新 +81.0、ロト7 旧 +1.5 → 新 +2.7。
- `npm run backtest` 再実行 (8分28秒)。平均一致数・3個以上一致率は戦略間・ランダムとの差とも偶然の範囲のまま。
- `npm test` 43件 pass、`npm run typecheck`、`npm run build` 成功。

## 記録
- レビュー: docs/reviews/2026-09-25_prediction-method-25-expert-10-loop-review.md
- 判断: docs/decisions/2026-09-25_decision-log.md
