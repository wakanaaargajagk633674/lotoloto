import type { StrategyInfo } from "@/loto/strategies";

type Props = {
  strategy: StrategyInfo;
  selected: boolean;
  onSelect: () => void;
};

export default function FriendlyStrategyCard({ strategy, selected, onSelect }: Props) {
  return (
    <button className={`friendly-strategy-card ${selected ? "selected" : ""}`} type="button" onClick={onSelect}>
      <span className="strategy-kana">{strategy.englishName}</span>
      <strong>{strategy.label}</strong>
      <p>{strategy.description}</p>
      <small>
        <b>向いている人：</b>
        {strategy.suitableFor}
      </small>
      <small>
        <b>注意：</b>
        {strategy.caution}
      </small>
    </button>
  );
}
