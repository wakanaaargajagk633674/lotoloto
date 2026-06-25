import type { StrategyType } from "@/loto/types";

type Props = {
  strategy: {
    value: StrategyType;
    label: string;
    description: string;
  };
  selected: boolean;
  onSelect: () => void;
};

export default function StrategyCard({ strategy, selected, onSelect }: Props) {
  return (
    <button className={`strategy-card ${selected ? "selected" : ""}`} type="button" onClick={onSelect}>
      <span>{strategy.label}</span>
      <small>{strategy.description}</small>
    </button>
  );
}
