export default function LightAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="light-app-shell">
      <main className="light-main">{children}</main>
    </div>
  );
}
