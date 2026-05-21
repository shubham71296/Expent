/** Compact numbers for chart Y-axis (e.g. 12500 → "12.5k"). */
export function formatChartAxisValue(value: number): string {
  const n = Math.abs(Math.round(value));
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}M`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}k`;
  }
  return String(n);
}

export function chartMaxValue(values: number[]): number {
  const peak = Math.max(...values, 0);
  if (peak <= 0) return 10;
  const padded = peak * 1.12;
  if (padded < 10) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  return Math.ceil(padded / magnitude) * magnitude;
}

/** Show at most `maxVisible` x-axis labels to avoid overlap. */
export function thinAxisLabels<T extends { label: string }>(
  points: T[],
  maxVisible = 6
): T[] {
  if (points.length <= maxVisible) return points;
  const step = Math.ceil(points.length / maxVisible);
  return points.map((point, index) => ({
    ...point,
    label: index % step === 0 || index === points.length - 1 ? point.label : '',
  }));
}

export function fitBarLayout(
  containerWidth: number,
  count: number,
  preset: 'monthly' | 'yearly' = 'monthly'
): { barWidth: number; spacing: number; labelWidth: number } {
  if (count <= 0 || containerWidth <= 0) {
    return { barWidth: 28, spacing: 12, labelWidth: 40 };
  }

  const minSpacing = preset === 'yearly' ? 4 : 10;
  const minBarWidth = preset === 'yearly' ? 14 : 20;
  const preferredBarWidth = preset === 'yearly' ? 18 : 32;

  let barWidth = preferredBarWidth;
  let spacing = (containerWidth - count * barWidth) / (count + 1);

  if (spacing < minSpacing) {
    barWidth = Math.max(
      minBarWidth,
      Math.floor((containerWidth - minSpacing * (count + 1)) / count)
    );
    spacing = (containerWidth - count * barWidth) / (count + 1);
  }

  const labelWidth = Math.max(barWidth + spacing, preset === 'yearly' ? 22 : 36);

  return {
    barWidth,
    spacing: Math.max(minSpacing, spacing),
    labelWidth,
  };
}

export function fitLineSpacing(
  containerWidth: number,
  count: number,
  preset: 'monthly' | 'yearly' = 'monthly'
): number {
  if (count <= 1) return 0;
  const padding = preset === 'yearly' ? 24 : 28;
  const minGap = preset === 'yearly' ? 12 : 16;
  return Math.max(minGap, (containerWidth - padding) / (count - 1));
}
