// The active review scenario comes from `?scenario=` and sticks for the tab
// (sessionStorage), so it survives navigation between pages.

export const SCENARIOS = [
  { value: 'default', label: 'Mixed data' },
  { value: 'empty', label: 'No devices' },
  { value: 'offline', label: 'All offline' },
  { value: 'no-data', label: 'No readings yet' },
  { value: 'error', label: 'Server error' },
  { value: 'loading', label: 'Always loading' },
  { value: 'signed-out', label: 'Signed out' },
]

const KEY = 'aiq-review-scenario'

function stored() {
  try {
    return window.sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function getScenario() {
  const fromUrl = new URLSearchParams(window.location.search).get('scenario')
  const value = fromUrl ?? stored() ?? 'default'
  if (!SCENARIOS.some((item) => item.value === value)) return 'default'
  if (fromUrl) {
    try {
      window.sessionStorage.setItem(KEY, value)
    } catch {
      /* private mode: keep it for this page only */
    }
  }
  return value
}

export function setScenario(value) {
  try {
    window.sessionStorage.setItem(KEY, value)
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href)
  url.searchParams.set('scenario', value)
  window.location.assign(url)
}
