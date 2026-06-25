type Props = {
  title: string;
  value: string;
  detail: string;
  accent: "cyan" | "emerald" | "violet" | "gold";
};

export default function InsightCard({ title, value, detail, accent }: Props) {
  return (
    <article className={`insight-card ${accent}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
