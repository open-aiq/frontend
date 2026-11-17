// The current-reading endpoint averages the last hour. Once a monitor has been
// quiet for longer than that, the API still answers 200, with every metric at
// zero and `sample_count: 0`. That's "nothing to show", not a real 0 AQI.

// hasRecentReadings tells a real current reading from an empty one. A missing
// `sample_count` counts as data, so payloads without the field keep working.
export function hasRecentReadings(current) {
  return current != null && current.sample_count !== 0
}

// recentReadings returns the reading when it holds data, and null otherwise,
// so components can show "--" and the unknown band instead of zeros.
export function recentReadings(current) {
  return hasRecentReadings(current) ? current : null
}
