import StrategyCard from "@/components/loto/StrategyCard";
import type { StrategyType } from "@/loto/types";

type StrategyItem = {
  value: StrategyType;
  label: string;
  description: string;
};

type Props = {
  selected: StrategyType;
  strategies: StrategyItem[];
  onChange: (strategy: StrategyType) => void;
};

export default function StrategySelector({ selected, strategies, onChange }: Props) {
  return (
    <div className="strategy-selector" aria-label="予想タイプ">
      {strategies.map((strategy) => (
        <StrategyCard
          key={strategy.value}
          strategy={strategy}
          selected={selected === strategy.value}
          onSelect={() => onChange(strategy.value)}
        />
      ))}
    </div>
  );
}
