import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LotoLoto 参考買い目ジェネレーター",
  description: "ロト6・ロト7の過去傾向を説明可能な参考買い目として表示するWebアプリ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
