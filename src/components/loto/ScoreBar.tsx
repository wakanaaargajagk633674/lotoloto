type Props = {
  label: string;
  value: number;
  tone: "cyan" | "emerald" | "violet" | "gold";
  help?: string;
};

export default function ScoreBar({ label, value, tone, help }: Props) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`score-bar ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{percent}</strong>
        <small>/ 100</small>
      </div>
      <i>
        <b style={{ width: `${percent}%` }} />
      </i>
      {help ? <p>{help}</p> : null}
    </div>
  );
}
