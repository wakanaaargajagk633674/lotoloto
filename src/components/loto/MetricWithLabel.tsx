import MetricHelpTooltip from "@/components/loto/MetricHelpTooltip";

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  help: string;
  detail?: string;
};

export default function MetricWithLabel({ label, value, unit, help, detail }: Props) {
  return (
    <div className="metric-with-label">
      <div className="metric-label-row">
        <span>{label}</span>
        <MetricHelpTooltip help={help} />
      </div>
      <strong>
        {value}
        {unit ? <small>{unit}</small> : null}
      </strong>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}
