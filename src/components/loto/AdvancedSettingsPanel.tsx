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
    <details className="advanced-panel">
      <summary>
        <span>細かく調整する</span>
        <small>慣れてきた方向け</small>
      </summary>
      <div className="settings-grid">
        <label>
          <span>
            口数
            <small>1から20口</small>
          </span>
          <input
            type="number"
            min={1}
            max={20}
            value={ticketCount}
            onChange={(event) => onTicketCountChange(Math.max(1, Math.min(20, Number(event.target.value))))}
          />
        </label>
        <Slider label="ランダム性を残す強さ" value={randomStrength} help="分析スコアに寄せすぎず、ランダム性を残す度合いです。" onChange={onRandomStrengthChange} />
        <Slider label="パターン参考の強さ" value={patternFilterStrength} help="過去の並びや間隔を、候補調整にどのくらい使うかを示します。" onChange={onPatternFilterStrengthChange} />
        <Slider label="分配リスク意識の強さ" value={highReturnStrength} help="誕生日などで選ばれやすい数字に偏りすぎないようにする度合いです。" onChange={onHighReturnStrengthChange} />
      </div>
    </details>
  );
}

function Slider({ label, value, help, onChange }: { label: string; value: number; help: string; onChange: (value: number) => void }) {
  return (
    <label>
      <span>
        {label}
        <strong>{value} / 100</strong>
      </span>
      <input type="range" min={0} max={100} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <small>{help}</small>
    </label>
  );
}
