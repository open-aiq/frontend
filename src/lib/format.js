// shortAgo turns a timestamp into "just now", "5m ago", "3h ago" or "2d ago",
// the same wording as the mobile app's status line.
export function shortAgo(value, now = Date.now()) {
  if (!value) return '--m ago'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return '--m ago'
  const minutes = Math.max(0, Math.round((now - time) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

// formatNumber shows a reading with fixed digits, or "--" when it's unknown.
export function formatNumber(value, digits = 1) {
  return value == null || Number.isNaN(Number(value)) ? '--' : Number(value).toFixed(digits)
}
