type Props = {
  label: string;
  value: string;
};

export default function DataSourceBadge({ label, value }: Props) {
  return (
    <span className="data-source-badge">
      <b>{label}</b>
      {value}
    </span>
  );
}
