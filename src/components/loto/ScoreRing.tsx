import type { CSSProperties } from "react";

type Props = {
  value: number;
  label: string;
};

export default function ScoreRing({ value, label }: Props) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="score-ring" style={{ "--value": `${percent}%` } as CSSProperties & Record<string, string>}>
      <strong>{percent}</strong>
      <span>{label} / 100</span>
    </div>
  );
}
