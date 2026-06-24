# Decision Log 2026-06-25

## D1: 空ディレクトリをGit初期化して作業する

- 肯定意見: 指定ディレクトリには `md/` しかなく、リモートも参照が返らなかったため、ここを作業ツリー化するのが最短。
- 否定意見: リモートが空でない可能性や別ブランチの可能性を完全には排除できない。
- 斜め上の代替案: 親ディレクトリに clone し、`md/` を移植する。
- 最終判断: `F:\LP\lotoloto` で `git init` し、origin を設定し、作業ブランチを作成。
- 採用理由: 既存 DeepSearch 結果を保持でき、空リモートに対して自然。
- 不採用理由: clone 先を別にすると指定作業対象から外れる。
- 次に検証すべきこと: push 前に remote の権限と既定ブランチを確認する。

## D2: sougakuはHTTP directを正規取得手段にする

- 肯定意見: HTTP direct + User-Agent でページとZIPが200 OK取得できた。
- 否定意見: ブラウザ経由ではHTTPS側で502が出たため、環境差がありうる。
- 斜め上の代替案: みずほ公式やPayPay銀行CSVを一次取得元にする。
- 最終判断: sougaku URLを downloader に残し、fallback ログと処理を用意。
- 採用理由: ユーザー指定の常時取得元から実データを取得できた。
- 不採用理由: 公式以外に完全依存するのは危険なため、今後は照合を追加する。
- 次に検証すべきこと: みずほ公式最新回との一致検査。

## D3: 削除数字はsoft penaltyを既定にする

- 肯定意見: 削除数字の厳密算式が未公開で、未来の本数字を含まない保証がない。
- 否定意見: hard exclude の方が sougaku の思想に近く、差が見えやすい。
- 斜め上の代替案: 削除数字をユーザー参加型の反証ゲームとして可視化する。
- 最終判断: `none/weak/strong/hard` を設計し、既定は weak/strong penalty。
- 採用理由: 疑似科学化を避けながら比較検証できる。
- 不採用理由: hard exclude 既定は誤認リスクが高い。
- 次に検証すべきこと: hard/soft/none の期間別バックテスト。

## D4: Next.js + TypeScriptで最小プロダクトまで作る

- 肯定意見: Vercel運用前提に合い、UIとロジックを同一型で扱える。
- 否定意見: 仕様書だけ先に固めるより作業範囲が広がる。
- 斜め上の代替案: CLI分析ツールだけ先に作り、UIは後回しにする。
- 最終判断: データパイプライン、生成、バックテスト、初期UIまで実装。
- 採用理由: 完了条件に「実装する場合はテストビルド」とあり、検証可能性が高まる。
- 不採用理由: CLIのみではユーザー体験と注意文の検証ができない。
- 次に検証すべきこと: PlaywrightでUI表示の視覚確認。

## D5: npm auditはoverridesで推移依存を固定する

- 肯定意見: `next` 配下の `postcss` と `vite` 配下の `esbuild` を安全版へ寄せられる。
- 否定意見: overrides は上流パッケージの想定依存から外れる可能性がある。
- 斜め上の代替案: Next 16へ上げる、またはテストランナーを変更する。
- 最終判断: `postcss` と `esbuild` の overrides を追加。
- 採用理由: 破壊的な `npm audit fix --force` の Next ダウングレードを避けつつ audit 0 件を達成した。
- 不採用理由: Next 16 への移行は今回の目的外で、UI/ビルド差分が増える。
- 次に検証すべきこと: Next/Vitest更新時に overrides が不要になったか確認する。

## Commit Message Candidates

- `chore: initialize lotoloto next app and project rules`
- `feat: add loto data pipeline and explainable ticket generator`
- `feat: add walk-forward backtest outputs and safety docs`
