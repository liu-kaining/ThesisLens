export function formatCurrency(value?: number | null, compact = true) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0
  }).format(value);
}

export function formatNumber(value?: number | null, compact = true) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value?: number | null, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatRatio(value?: number | null, suffix = "x") {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(1)}${suffix}`;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function scoreLabel(score: number): "strong" | "good" | "mixed" | "weak" {
  if (score >= 78) return "strong";
  if (score >= 62) return "good";
  if (score >= 45) return "mixed";
  return "weak";
}

export function dateShort(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
