import { describe, expect, it } from 'vitest'

import { apiErrorFromBody } from './api'
import { PROBLEM, errorKind } from './errors'

describe('errorKind', () => {
  it('reads a no-readings problem as no readings yet', () => {
    const err = apiErrorFromBody(404, {
      type: PROBLEM.noReadings,
      title: 'No readings available',
      status: 404,
      detail: 'No readings received yet.',
    })
    expect(errorKind(err)).toBe('no-readings')
  })

  it('reads a not-found problem as a missing device', () => {
    const err = apiErrorFromBody(404, {
      type: PROBLEM.notFound,
      title: 'Resource not found',
      status: 404,
      detail: 'Device not found.',
    })
    expect(errorKind(err)).toBe('not-found')
  })

  it('treats a 404 without a known problem type as a missing device', () => {
    expect(errorKind(apiErrorFromBody(404, null))).toBe('not-found')
    expect(errorKind(apiErrorFromBody(404, { type: 'about:blank' }))).toBe('not-found')
  })

  it('treats an ID that is not a UUID as a missing device', () => {
    const err = apiErrorFromBody(422, {
      type: PROBLEM.validation,
      title: 'Request validation failed',
      status: 422,
      detail: 'One or more path parameters are invalid.',
      errors: [{ in: 'path', name: 'id', code: 'format', detail: 'id must be a UUIDv4' }],
    })
    expect(errorKind(err)).toBe('not-found')
  })

  it('keeps other validation failures retryable', () => {
    const err = apiErrorFromBody(422, {
      type: PROBLEM.validation,
      status: 422,
      errors: [{ in: 'query', name: 'timeline', code: 'enum', detail: 'timeline is invalid' }],
    })
    expect(errorKind(err)).toBe('unavailable')
  })

  it('treats server errors and rate limits as retryable', () => {
    expect(errorKind(apiErrorFromBody(500, { type: PROBLEM.internal, status: 500 }))).toBe(
      'unavailable',
    )
    expect(errorKind(apiErrorFromBody(502, 'html'))).toBe('unavailable')
    expect(errorKind(apiErrorFromBody(429, null))).toBe('unavailable')
    expect(errorKind(apiErrorFromBody(401, null))).toBe('unavailable')
  })

  it('treats a network failure, which has no status, as retryable', () => {
    expect(errorKind(new TypeError('Failed to fetch'))).toBe('unavailable')
    expect(errorKind(undefined)).toBe('unavailable')
  })
})
