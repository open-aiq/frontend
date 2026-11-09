import { describe, expect, it } from 'vitest'

import { formatNumber, shortAgo } from './format'

describe('shortAgo', () => {
  const now = Date.parse('2026-11-09T12:00:00Z')
  it('describes recent times briefly', () => {
    expect(shortAgo('2026-11-09T11:59:50Z', now)).toBe('just now')
    expect(shortAgo('2026-11-09T11:55:00Z', now)).toBe('5m ago')
    expect(shortAgo('2026-11-09T09:00:00Z', now)).toBe('3h ago')
    expect(shortAgo('2026-11-07T12:00:00Z', now)).toBe('2d ago')
  })
  it('shows a placeholder when the time is unknown', () => {
    expect(shortAgo(null, now)).toBe('--m ago')
  })
})

describe('formatNumber', () => {
  it('shows "--" for unknown values', () => {
    expect(formatNumber(undefined)).toBe('--')
    expect(formatNumber(22.44)).toBe('22.4')
    expect(formatNumber(46, 0)).toBe('46')
  })
})
