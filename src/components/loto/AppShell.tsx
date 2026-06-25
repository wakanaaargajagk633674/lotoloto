export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="top-nav">
        <div className="nav-inner">
          <div className="brand-lockup">
            <span className="brand-mark">LL</span>
            <div>
              <strong>LOTOLOTO</strong>
              <span>Intelligence</span>
            </div>
          </div>
          <span className="nav-note">Reference analytics, not a guarantee.</span>
        </div>
      </header>
      <main className="main-shell">{children}</main>
    </div>
  );
}
