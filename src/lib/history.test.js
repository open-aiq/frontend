import { describe, expect, it } from 'vitest'

import { buildSeries } from './history'

const metrics = (aqi) => ({
  aqi,
  pm1_0: 1,
  pm2_5: 2,
  pm10_0: 3,
  temperature: 20,
  humidity: 50,
  heat_index: 20,
})
const options = { locale: 'en-GB', timeZone: 'Australia/Sydney' }

describe('buildSeries', () => {
  it('lays out every hour of the daily range and leaves missing hours empty', () => {
    const now = new Date('2026-11-04T10:30:00Z')
    const points = [
      { timestamp: '2026-11-04T08:00:00Z', label: '08:00', metrics: metrics(40) },
      { timestamp: '2026-11-04T10:00:00Z', label: '10:00', metrics: metrics(60) },
    ]

    const rows = buildSeries(points, 'daily', 'aqi', now, options)

    // 2026-11-03T10:00Z .. 2026-11-04T10:00Z inclusive, like the backend's range.
    expect(rows).toHaveLength(25)
    expect(rows[0].time).toBe(Date.parse('2026-11-03T10:00:00Z'))
    expect(rows.at(-1).time).toBe(Date.parse('2026-11-04T10:00:00Z'))

    const byTime = Object.fromEntries(rows.map((r) => [new Date(r.time).toISOString(), r]))
    expect(byTime['2026-11-04T08:00:00.000Z'].value).toBe(40)
    expect(byTime['2026-11-04T09:00:00.000Z'].value).toBeNull()
    expect(byTime['2026-11-04T09:00:00.000Z'].metrics).toBeNull()
    expect(byTime['2026-11-04T10:00:00.000Z'].value).toBe(60)
    expect(rows.filter((r) => r.value !== null)).toHaveLength(2)
  })

  it('labels hourly buckets in the viewer time zone, not UTC', () => {
    const now = new Date('2026-11-04T10:30:00Z')
    const points = [{ timestamp: '2026-11-04T08:00:00Z', label: '08:00', metrics: metrics(40) }]

    const row = buildSeries(points, 'daily', 'aqi', now, options).find((r) => r.value === 40)

    // Sydney is UTC+11 in November.
    expect(row.axisLabel).toBe('19:00')
    expect(row.tooltipLabel).toContain('19:00')
    expect(row.tooltipLabel).toContain('4 Nov')
  })

  it('keeps day buckets on their UTC calendar date', () => {
    const now = new Date('2026-11-04T10:30:00Z')
    const points = [
      { timestamp: '2026-11-02T00:00:00Z', label: '2026-11-02', metrics: metrics(30) },
    ]
    const westOfUTC = { locale: 'en-GB', timeZone: 'America/Los_Angeles' }

    const rows = buildSeries(points, 'monthly', 'aqi', now, westOfUTC)

    expect(rows).toHaveLength(31)
    const row = rows.find((r) => r.value === 30)
    expect(row.axisLabel).toBe('2 Nov')
    expect(row.tooltipLabel).toBe('Mon, 2 Nov 2026')
  })

  it('uses short weekday names for the weekly range and month names for yearly', () => {
    const now = new Date('2026-11-04T10:30:00Z')

    const weekly = buildSeries([], 'weekly', 'aqi', now, options)
    expect(weekly).toHaveLength(8)
    expect(weekly.at(-1).axisLabel).toBe('Wed')

    const yearly = buildSeries([], 'yearly', 'aqi', now, options)
    expect(yearly).toHaveLength(13)
    expect(yearly.at(-1).axisLabel).toBe('Nov')
    expect(yearly.at(-1).tooltipLabel).toBe('November 2026')
  })

  it('returns an all-empty series when there is no data', () => {
    const rows = buildSeries([], 'daily', 'aqi', new Date('2026-11-04T10:30:00Z'), options)

    expect(rows).toHaveLength(25)
    expect(rows.every((r) => r.value === null && r.metrics === null)).toBe(true)
  })

  it('flags points that have no neighbouring values so they can be drawn as dots', () => {
    const now = new Date('2026-11-04T10:30:00Z')
    const points = [
      { timestamp: '2026-11-04T05:00:00Z', metrics: metrics(10) },
      { timestamp: '2026-11-04T08:00:00Z', metrics: metrics(20) },
      { timestamp: '2026-11-04T09:00:00Z', metrics: metrics(30) },
    ]

    const withValues = buildSeries(points, 'daily', 'aqi', now, options).filter(
      (r) => r.value !== null,
    )

    expect(withValues.map((r) => r.isolated)).toEqual([true, false, false])
  })

  it('keeps a real zero reading as zero', () => {
    const now = new Date('2026-11-04T10:30:00Z')
    const points = [{ timestamp: '2026-11-04T08:00:00Z', metrics: metrics(0) }]

    const row = buildSeries(points, 'daily', 'aqi', now, options).find(
      (r) => r.time === Date.parse('2026-11-04T08:00:00Z'),
    )

    expect(row.value).toBe(0)
  })
})
