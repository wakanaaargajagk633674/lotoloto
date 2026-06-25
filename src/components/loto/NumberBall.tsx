import type { CSSProperties } from "react";

type Props = {
  number: number;
  index: number;
  tone: "standard" | "trend" | "gap" | "return";
  tuned: boolean;
  onClick: () => void;
};

export default function NumberBall({ number, index, tone, tuned, onClick }: Props) {
  return (
    <button
      className={`number-ball ${tone} ${tuned ? "tuned" : ""}`}
      style={{ "--delay": `${index * 42}ms` } as CSSProperties & Record<string, string>}
      type="button"
      onClick={onClick}
      aria-label={`${number} の理由を見る`}
    >
      {number.toString().padStart(2, "0")}
    </button>
  );
}
