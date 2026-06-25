export function padNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatYen(value: number | null | undefined): string {
  return typeof value === "number" ? `${value.toLocaleString("ja-JP")}円` : "未取得";
}

export function formatCount(value: number | null | undefined, unit = "件"): string {
  return typeof value === "number" ? `${value.toLocaleString("ja-JP")}${unit}` : "未取得";
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
