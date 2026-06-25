type Props = {
  help: string;
};

export default function MetricHelpTooltip({ help }: Props) {
  return (
    <span className="metric-help" tabIndex={0} aria-label={help}>
      ?
      <span role="tooltip">{help}</span>
    </span>
  );
}
