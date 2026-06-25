import type { CSSProperties } from "react";

type Props = {
  value: number;
  label: string;
};

export default function ScoreRing({ value, label }: Props) {
  return (
    <div className="score-ring" style={{ "--value": `${value}%` } as CSSProperties & Record<string, string>}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
