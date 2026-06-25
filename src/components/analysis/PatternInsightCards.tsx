import type { GameType } from "@/loto/types";

export default function PatternInsightCards({ game }: { game: GameType }) {
  const ranges = game === "loto6" ? "1〜10、11〜20、21〜30、31〜43" : "1〜10、11〜20、21〜30、31〜37";
  return (
    <div className="card-grid">
      <article className="analysis-card">
        <h3>パターン参考</h3>
        <p>
          過去の数字の並び、間隔、数字帯、末尾、前回重複などをもとに、今回の組み合わせで優先度を下げる候補を参考表示します。
          数字を除外するものではなく、当せんを保証するものでもありません。
        </p>
      </article>
      <article className="analysis-card">
        <h3>数字帯</h3>
        <p>{ranges} のどの帯に数字が集まりやすいかを確認します。偏りを見るための情報で、未来予測ではありません。</p>
      </article>
      <article className="analysis-card">
        <h3>末尾</h3>
        <p>数字の一の位がどの程度重なるかを見ます。同じ末尾の重複は珍しく見えても、過去には一定数あります。</p>
      </article>
      <article className="analysis-card">
        <h3>前回重複</h3>
        <p>前回本数字と今回本数字が何個重なったかを確認します。重複があること自体は異常ではありません。</p>
      </article>
    </div>
  );
}
