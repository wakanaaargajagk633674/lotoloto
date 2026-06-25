import Link from "next/link";

const navItems = [
  { href: "/", label: "トップ" },
  { href: "/loto6", label: "ロト6分析" },
  { href: "/loto7", label: "ロト7分析" },
  { href: "/downloads", label: "CSV保存" },
  { href: "/prediction", label: "参考買い目" }
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/">
          <span>L</span>
          <div>
            <strong>lotoloto</strong>
            <small>ロト6ロト7 過去データ分析</small>
          </div>
        </Link>
        <nav className="site-nav" aria-label="主要ナビゲーション">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
