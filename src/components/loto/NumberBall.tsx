import type { CSSProperties } from "react";

type Props = {
  number: number;
  index: number;
  tone: "standard" | "trend" | "gap" | "return";
  tuned: boolean;
  reasonLabel?: string;
  onClick: () => void;
};

export default function NumberBall({ number, index, tone, tuned, reasonLabel, onClick }: Props) {
  return (
    <button
      className={`number-ball ${tone} ${tuned ? "tuned" : ""}`}
      style={{ "--delay": `${index * 42}ms` } as CSSProperties & Record<string, string>}
      type="button"
      onClick={onClick}
      aria-label={`${number} の理由を見る`}
    >
      <strong>{number.toString().padStart(2, "0")}</strong>
      {reasonLabel ? <span>{reasonLabel}</span> : null}
    </button>
  );
}
