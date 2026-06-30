# Lotoloto Agent Rules

このリポジトリで作業する Codex/AI エージェントは、以下を必ず守る。

## Product Safety

- ロト6・ロト7はランダム抽せんであり、過去データから未来の当せん番号を確実に予測できない。
- 「当選保証」「的中率が上がる保証」「必ず当せんする」「この候補なら当せんする」と断定しない。
- 予想結果は「過去データに基づく参考買い目」「戦略テーマ別の説明可能な組み合わせ」として扱う。
- 高配当狙いは当たりやすさではなく、当選時の山分けリスク低下の可能性として説明する。
- ギャンブル依存や買い過ぎを煽る UI/文言を入れない。

## Data And Backtest

- 予想・特徴量・バックテストで未来データを使わない。
- バックテストはウォークフォワード方式を基本とする。
- 参考サイト由来の候補選別や分割方法は仮説として扱い、候補優先度を調整する soft signal を既定にする。
- データ取得失敗時は URL、試行方法、失敗理由、fallback を `docs/research/` に記録する。
- ZIP、ハッシュ、ダウンロード日時、processed JSON/CSV を保存する。

## Work Logging

- 重要な作業では `docs/history/YYYY-MM-DD_HHMM_task-log.md` を更新する。
- 重要判断は `docs/decisions/YYYY-MM-DD_decision-log.md` に残す。
- 各フェーズで10人専門家レビューを `docs/reviews/` に残す。
- ユーザーに PowerShell、Git、Node、Python、npm、curl 実行を依頼しない。必要な操作は Codex が行う。

## Engineering

- 既存変更を勝手に戻さない。
- 手動編集は `apply_patch` を使う。
- 型安全な TypeScript を優先し、スコア重みは `src/config/strategyWeights.ts` で管理する。
- `npm test`、`npm run typecheck`、`npm run build` を通してから完了報告する。
- 作業完了時は必ず変更をコミットする。push はユーザーが依頼した場合に実行する。
