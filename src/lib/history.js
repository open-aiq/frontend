// Turns the backend's bucketed history into a continuous chart series.
//
// The API returns only buckets that contain readings, each with an RFC 3339
// `timestamp` (the UTC start of the bucket, from Postgres date_trunc) and a
// server-formatted `label` in the server's time zone. buildSeries ignores that
// label: it lays out every expected bucket for the timeline, so hours or days
// without readings become explicit gaps (value null) instead of being skipped,
// and it formats times in the viewer's own time zone.

const HOUR_MS = 60 * 60 * 1000

// Mirrors the ranges in backend/internal/airquality/service.go (spec).
const TIMELINES = {
  daily: { unit: 'hour', start: (now) => new Date(now.getTime() - 24 * HOUR_MS) },
  weekly: { unit: 'day', start: (now) => addUTC(now, { days: -7 }) },
  monthly: { unit: 'day', start: (now) => addUTC(now, { days: -30 }) },
  yearly: { unit: 'month', start: (now) => addUTC(now, { months: -12 }) },
}

function addUTC(date, { days = 0, months = 0 }) {
  const d = new Date(date.getTime())
  if (months) d.setUTCMonth(d.getUTCMonth() + months)
  if (days) d.setUTCDate(d.getUTCDate() + days)
  return d
}

// floorUTC truncates a date to the start of its UTC hour, day or month.
function floorUTC(date, unit) {
  const d = new Date(date.getTime())
  if (unit === 'hour') {
    d.setUTCMinutes(0, 0, 0)
  } else if (unit === 'day') {
    d.setUTCHours(0, 0, 0, 0)
  } else {
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
  }
  return d
}

function step(date, unit) {
  if (unit === 'hour') return new Date(date.getTime() + HOUR_MS)
  if (unit === 'day') return addUTC(date, { days: 1 })
  return addUTC(date, { months: 1 })
}

// Formatters per bucket unit. Hourly buckets are shown in the viewer's local
// time. Day and month buckets are UTC calendar days/months, so they are named
// in UTC; converting them would shift the date for viewers west of UTC.
function formatters(unit, timeline, { locale, timeZone }) {
  const fmt = (options) => new Intl.DateTimeFormat(locale, options)
  if (unit === 'hour') {
    const axis = fmt({ hour: '2-digit', minute: '2-digit', timeZone })
    const full = fmt({
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    })
    return { axis: (d) => axis.format(d), full: (d) => full.format(d) }
  }
  if (unit === 'day') {
    const axis =
      timeline === 'weekly'
        ? fmt({ weekday: 'short', timeZone: 'UTC' })
        : fmt({ day: 'numeric', month: 'short', timeZone: 'UTC' })
    const full = fmt({
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    return { axis: (d) => axis.format(d), full: (d) => full.format(d) }
  }
  const axis = fmt({ month: 'short', timeZone: 'UTC' })
  const full = fmt({ month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { axis: (d) => axis.format(d), full: (d) => full.format(d) }
}

function toRow(time, point, metricKey, format) {
  const value = point?.metrics?.[metricKey]
  return {
    time: time.getTime(),
    axisLabel: format.axis(time),
    tooltipLabel: format.full(time),
    value: typeof value === 'number' && Number.isFinite(value) ? value : null,
    metrics: point?.metrics ?? null,
  }
}

// Marks rows whose value has no neighbour with a value: an area chart cannot
// draw a line through a single point, so the chart renders those as dots.
function markIsolated(rows) {
  return rows.map((row, i) => ({
    ...row,
    isolated: row.value !== null && rows[i - 1]?.value == null && rows[i + 1]?.value == null,
  }))
}

/**
 * buildSeries returns one row per expected bucket of the timeline:
 * { time, axisLabel, tooltipLabel, value, metrics, isolated }. Buckets without
 * data have value and metrics set to null. Unknown timelines keep only the
 * returned points, still labelled in local time.
 *
 * options.locale / options.timeZone override the viewer's defaults (tests).
 */
export function buildSeries(points, timeline, metricKey, now = new Date(), options = {}) {
  const config = TIMELINES[timeline]
  const parsed = (points ?? [])
    .map((p) => ({ point: p, t: Date.parse(p.timestamp) }))
    .filter(({ t }) => Number.isFinite(t))
    .sort((a, b) => a.t - b.t)

  if (!config) {
    const format = formatters('hour', timeline, options)
    return markIsolated(parsed.map(({ point, t }) => toRow(new Date(t), point, metricKey, format)))
  }

  const { unit } = config
  const format = formatters(unit, timeline, options)
  const slots = []
  const last = floorUTC(now, unit).getTime()
  for (let d = floorUTC(config.start(now), unit); d.getTime() <= last; d = step(d, unit)) {
    slots.push(d)
  }

  const byBucket = new Map()
  for (const { point, t } of parsed) {
    byBucket.set(floorUTC(new Date(t), unit).getTime(), point)
  }

  return markIsolated(
    slots.map((slot) => toRow(slot, byBucket.get(slot.getTime()), metricKey, format)),
  )
}
