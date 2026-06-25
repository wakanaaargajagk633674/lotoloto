type Props = {
  ticketCount: number;
  randomStrength: number;
  patternFilterStrength: number;
  highReturnStrength: number;
  onTicketCountChange: (value: number) => void;
  onRandomStrengthChange: (value: number) => void;
  onPatternFilterStrengthChange: (value: number) => void;
  onHighReturnStrengthChange: (value: number) => void;
};

export default function AdvancedSettingsPanel({
  ticketCount,
  randomStrength,
  patternFilterStrength,
  highReturnStrength,
  onTicketCountChange,
  onRandomStrengthChange,
  onPatternFilterStrengthChange,
  onHighReturnStrengthChange
}: Props) {
  return (
    <details className="advanced-panel" open>
      <summary>詳細設定</summary>
      <div className="settings-grid">
        <label>
          <span>口数</span>
          <input
            type="number"
            min={1}
            max={20}
            value={ticketCount}
            onChange={(event) => onTicketCountChange(Math.max(1, Math.min(20, Number(event.target.value))))}
          />
        </label>
        <Slider label="ランダム性" value={randomStrength} onChange={onRandomStrengthChange} />
        <Slider label="パターンフィルター" value={patternFilterStrength} onChange={onPatternFilterStrengthChange} />
        <Slider label="ハイリターン寄せ" value={highReturnStrength} onChange={onHighReturnStrengthChange} />
      </div>
    </details>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input type="range" min={0} max={100} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
