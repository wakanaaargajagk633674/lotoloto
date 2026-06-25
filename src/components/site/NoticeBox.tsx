type Props = {
  title?: string;
  children: React.ReactNode;
  tone?: "info" | "warning";
};

export default function NoticeBox({ title = "ご注意", children, tone = "info" }: Props) {
  return (
    <aside className={`notice-box ${tone}`}>
      <strong>{title}</strong>
      <p>{children}</p>
    </aside>
  );
}
