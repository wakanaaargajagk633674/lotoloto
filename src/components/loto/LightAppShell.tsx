export default function LightAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="light-app-shell">
      <header className="light-topbar">
        <div className="light-topbar-inner">
          <div className="light-brand">
            <span className="light-brand-mark">L</span>
            <div>
              <strong>LOTOLOTO Light Insight</strong>
              <span>数字を、やさしく読み解く。</span>
            </div>
          </div>
          <span className="light-nav-note">過去データにもとづく参考分析</span>
        </div>
      </header>
      <main className="light-main">{children}</main>
    </div>
  );
}
