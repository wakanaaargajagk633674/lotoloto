type Props = {
  label: string;
  value: number;
  tone: "cyan" | "emerald" | "violet" | "gold";
};

export default function ScoreBar({ label, value, tone }: Props) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`score-bar ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{percent}</strong>
      </div>
      <i>
        <b style={{ width: `${percent}%` }} />
      </i>
    </div>
  );
}
