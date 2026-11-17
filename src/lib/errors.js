// The backend answers failures as RFC 9457 problems, each with a `type` URL
// from its catalog (backend/internal/platform/problem/problem.go). The pages
// only need to know three things: is the reading missing, is the device
// missing, or did the request fail in a way worth retrying?

const DOCS_BASE = 'https://docs.air-iq.net/reference/errors/#'

export const PROBLEM = {
  notFound: `${DOCS_BASE}not-found`,
  noReadings: `${DOCS_BASE}no-readings`,
  validation: `${DOCS_BASE}validation-error`,
  internal: `${DOCS_BASE}internal-error`,
}

// errorKind sorts a failed request into:
// - 'no-readings': the device exists but hasn't reported yet.
// - 'not-found': the device isn't there (or its ID isn't a valid one).
// - 'unavailable': anything else, such as a dropped connection or a server
//   error. A network failure has no status at all. These are worth a retry.
export function errorKind(err) {
  if (err?.type === PROBLEM.noReadings) return 'no-readings'
  if (err?.type === PROBLEM.notFound) return 'not-found'
  // A malformed ID in the URL can never match a device.
  if (err?.type === PROBLEM.validation && err.errors?.some((item) => item.in === 'path')) {
    return 'not-found'
  }
  // A 404 without a problem type we know, such as one from a proxy.
  if (err?.status === 404 && !Object.values(PROBLEM).includes(err.type)) return 'not-found'
  return 'unavailable'
}
