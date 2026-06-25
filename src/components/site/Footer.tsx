import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>lotoloto</strong>
        <p>本サイトは、ロト6ロト7の公開データを整理分析する情報サイトです。当せん番号の予測や当せんを保証するものではありません。</p>
      </div>
      <div className="footer-links">
        <Link href="/methodology">分析方法</Link>
        <Link href="/downloads">CSVダウンロード</Link>
        <Link href="/about">サイトについて</Link>
      </div>
    </footer>
  );
}
