import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { buildSeries } from '@/lib/history'

// Rows shown in the hover tooltip for every bucket, regardless of the plotted metric.
const TOOLTIP_ROWS = [
  { key: 'aqi', label: 'AQI', format: (v) => Math.round(v) },
  { key: 'pm1_0', label: 'PM1.0', format: (v) => `${v.toFixed(1)} µg/m³` },
  { key: 'pm2_5', label: 'PM2.5', format: (v) => `${v.toFixed(1)} µg/m³` },
  { key: 'pm10_0', label: 'PM10', format: (v) => `${v.toFixed(1)} µg/m³` },
  { key: 'temperature', label: 'Temperature', format: (v) => `${v.toFixed(1)} °C` },
  { key: 'humidity', label: 'Humidity', format: (v) => `${v.toFixed(0)} %` },
  { key: 'heat_index', label: 'Heat index', format: (v) => `${v.toFixed(1)} °C` },
]

const formatMetric = (format, value) =>
  typeof value === 'number' && Number.isFinite(value) ? format(value) : '—'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { metrics, tooltipLabel } = payload[0].payload

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{tooltipLabel}</p>
      {!metrics && <p className="text-muted-foreground">No data</p>}
      {metrics && (
        <dl className="space-y-0.5">
          {TOOLTIP_ROWS.map(({ key, label: rowLabel, format }) => (
            <div
              key={key}
              className="flex justify-between gap-4"
            >
              <dt className="text-muted-foreground">{rowLabel}</dt>
              <dd className="font-medium tabular-nums text-popover-foreground">
                {formatMetric(format, metrics[key])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

// HistoryChart plots ONE metric over time (single hue, no legend — the active
// metric toggle names the series); the tooltip carries the full reading.
// points: [{ timestamp, label, metrics }]; metricKey: e.g. "aqi";
// timeline: the API range ("daily", "weekly", "monthly", "yearly"). Every
// bucket of the range is plotted; buckets without readings are gaps, and times
// are shown in the viewer's local time zone.
export function HistoryChart({ points, metricKey, timeline }) {
  const data = useMemo(
    () => buildSeries(points, timeline, metricKey),
    [points, timeline, metricKey],
  )

  return (
    <ResponsiveContainer
      width="100%"
      height={280}
    >
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient
            id="history-fill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--chart-1)"
              stopOpacity={0.25}
            />
            <stop
              offset="100%"
              stopColor="var(--chart-1)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="axisLabel"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          minTickGap={24}
        />
        <YAxis
          width={40}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: 'var(--border)' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#history-fill)"
          connectNulls={false}
          dot={renderIsolatedDot}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// An area cannot draw a lone value between two gaps, so show it as a dot.
function renderIsolatedDot({ cx, cy, index, payload }) {
  if (!payload?.isolated || cx == null || cy == null) {
    return <g key={index} />
  }
  return (
    <circle
      key={index}
      cx={cx}
      cy={cy}
      r={3}
      fill="var(--chart-1)"
    />
  )
}
