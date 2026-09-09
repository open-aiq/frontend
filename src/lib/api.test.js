import { describe, expect, it } from 'vitest'

import { apiErrorFromBody } from './api'

describe('apiErrorFromBody', () => {
  it('parses RFC 9457 problems and field violations', () => {
    const error = apiErrorFromBody(422, {
      type: 'https://docs.air-iq.net/reference/errors/#validation-error',
      title: 'Request validation failed',
      status: 422,
      detail: 'One or more request values are invalid.',
      instance: '/api/v1/devices',
      errors: [{ in: 'body', name: 'name', code: 'required', detail: 'name is required' }],
    })

    expect(error.message).toBe('One or more request values are invalid.')
    expect(error.status).toBe(422)
    expect(error.fieldError('body', 'name')?.code).toBe('required')
  })

  it('supports the legacy error envelope during rollout', () => {
    expect(apiErrorFromBody(400, { details: 'name is required' }).message).toBe('name is required')
    expect(apiErrorFromBody(401, { error: 'Unauthorized' }).message).toBe('Unauthorized')
  })

  it('falls back safely for missing or non-object bodies', () => {
    expect(apiErrorFromBody(500, null).message).toBe('Request failed (500)')
    expect(apiErrorFromBody(502, 'html').message).toBe('Request failed (502)')
  })
})
