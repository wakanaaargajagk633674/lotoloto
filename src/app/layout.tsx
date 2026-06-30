import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ロト6ロト7 過去データ分析 | lotoloto",
    template: "%s | lotoloto"
  },
  description:
    "ロト6ロト7の当せん番号、出現回数、未出現期間、奇数偶数、合計値、キャリーオーバー、配当履歴を見やすく分析。CSVダウンロードにも対応。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
