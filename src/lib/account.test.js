import { describe, expect, it } from 'vitest'

import {
  DELETE_ACCOUNT_CONFIRMATION,
  clerkErrorMessage,
  isReverificationCancelled,
  signInMethodCount,
} from './account'

const verified = { verification: { status: 'verified' } }
const unverified = { verification: { status: 'unverified' } }

describe('signInMethodCount', () => {
  it('counts verified emails, verified connections, a password and passkeys', () => {
    expect(
      signInMethodCount({
        emailAddresses: [verified, unverified],
        externalAccounts: [verified, unverified],
        passwordEnabled: true,
        passkeys: [{ id: 'pk' }],
      }),
    ).toBe(4)
  })

  it('handles a missing user or missing lists', () => {
    expect(signInMethodCount(null)).toBe(0)
    expect(signInMethodCount({ passwordEnabled: false })).toBe(0)
    expect(signInMethodCount({ emailAddresses: [verified] })).toBe(1)
  })
})

describe('clerkErrorMessage', () => {
  it('prefers the first long message from a Clerk API error', () => {
    const error = Object.assign(new Error('Unprocessable'), {
      errors: [{ message: 'is taken', longMessage: 'That username is taken. Try another.' }],
    })
    expect(clerkErrorMessage(error)).toBe('That username is taken. Try another.')
  })

  it('falls back to the short message, then the error, then the fallback', () => {
    expect(clerkErrorMessage({ errors: [{ message: 'is taken' }] })).toBe('is taken')
    expect(clerkErrorMessage(new Error('Network down'))).toBe('Network down')
    expect(clerkErrorMessage(null, 'Fallback')).toBe('Fallback')
  })
})

describe('isReverificationCancelled', () => {
  it('spots a cancelled reverification prompt', () => {
    expect(isReverificationCancelled({ code: 'reverification_cancelled' })).toBe(true)
    expect(isReverificationCancelled(new Error('nope'))).toBe(false)
  })
})

describe('DELETE_ACCOUNT_CONFIRMATION', () => {
  it('is the lowercase word farewell', () => {
    expect(DELETE_ACCOUNT_CONFIRMATION).toBe('farewell')
  })
})
