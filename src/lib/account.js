// Helpers for the account page (src/pages/AccountPage.jsx), kept free of React
// and Clerk so they're easy to test.

// The word you type to delete your account, GitHub style.
export const DELETE_ACCOUNT_CONFIRMATION = 'farewell'

const isVerified = (resource) => resource?.verification?.status === 'verified'

// signInMethodCount counts the ways you can still sign in: verified email
// addresses, verified connected accounts, a password and passkeys. We never
// let you remove the last one.
export function signInMethodCount(user) {
  if (!user) return 0
  return (
    (user.emailAddresses ?? []).filter(isVerified).length +
    (user.externalAccounts ?? []).filter(isVerified).length +
    (user.passwordEnabled ? 1 : 0) +
    (user.passkeys ?? []).length
  )
}

// clerkErrorMessage turns a Clerk error (or any error) into one readable
// sentence. Clerk's API errors carry a list; the first long message is the
// most helpful one.
export function clerkErrorMessage(
  error,
  fallback = 'Something went wrong. Try again in a moment.',
) {
  const first = error?.errors?.[0]
  return first?.longMessage || first?.message || error?.message || fallback
}

// isReverificationCancelled is true when you closed Clerk's "confirm it's you"
// prompt. That's a choice, not an error, so we don't show a message for it.
export function isReverificationCancelled(error) {
  return error?.code === 'reverification_cancelled'
}
