type SeriesPoint = { label: string; value: number };

/**
 * Lightweight accessible bar chart rendered as pure SVG (no chart library).
 */
export function BarChart({
  data,
  height = 160,
  format = (v) => String(v),
}: {
  data: SeriesPoint[];
  height?: number;
  format?: (value: number) => string;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-600">No data yet.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barGap = 8;
  const labelHeight = 20;
  const chartHeight = height - labelHeight;
  const barWidth = 24;

  return (
    <div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${data.length * (barWidth + barGap)} ${height}`}
        role="img"
        aria-label="Chart"
      >
        <line
          x1={0}
          y1={chartHeight}
          x2={data.length * (barWidth + barGap)}
          y2={chartHeight}
          stroke="#3f3f46"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / max) * (chartHeight - 4));
          const x = i * (barWidth + barGap);
          const y = chartHeight - barHeight;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={d.value > 0 ? "var(--color-gold-400)" : "#3f3f46"}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#71717a"
              >
                {d.label}
              </text>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}