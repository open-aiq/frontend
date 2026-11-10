import { useState } from 'react'
import { Eye, X } from 'lucide-react'

import { appPath } from '@/lib/paths'

import { SCENARIOS, getScenario, setScenario } from './scenario.js'

// Every route, with a device that exercises the most states.
const ROUTES = [
  ['/playground', 'Playground'],
  ['/', 'Landing'],
  ['/map', 'Map'],
  ['/devices/dev-balcony', 'Public device'],
  ['/devices/dev-missing', 'Public device (missing)'],
  ['/app', 'Dashboard'],
  ['/app/devices/dev-garden', 'Device'],
  ['/app/devices/dev-new', 'Device (no readings)'],
  ['/app/devices/dev-garden/settings', 'Settings'],
  ['/app/account', 'Account'],
  ['/sign-in', 'Sign in'],
]

// ReviewBar floats in the corner during `make review` so you can switch
// scenarios and jump between pages. It renders outside the router, so it uses
// plain links.
export function ReviewBar() {
  const [open, setOpen] = useState(false)
  const scenario = getScenario()
  const query = `?scenario=${scenario}`

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[100] inline-flex items-center gap-2 rounded-full border bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lift"
      >
        <Eye className="size-4 text-primary" />
        Review · {SCENARIOS.find((item) => item.value === scenario)?.label}
      </button>
    )
  }

  return (
    <aside
      aria-label="Review controls"
      className="fixed bottom-4 left-4 z-[100] w-72 rounded-3xl border bg-popover p-4 text-sm text-popover-foreground shadow-lift"
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow">Review mode</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close review controls"
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Mock data, no backend or sign-in. Pick a scenario, then visit a page.
      </p>
      <label
        className="mt-3 block text-xs font-medium text-muted-foreground"
        htmlFor="review-scenario"
      >
        Scenario
      </label>
      <select
        id="review-scenario"
        value={scenario}
        onChange={(event) => setScenario(event.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-2 py-1.5"
      >
        {SCENARIOS.map(({ value, label }) => (
          <option
            key={value}
            value={value}
          >
            {label}
          </option>
        ))}
      </select>
      <nav
        aria-label="Review pages"
        className="mt-3 grid gap-0.5"
      >
        {ROUTES.map(([path, label]) => (
          <a
            key={path}
            href={appPath(`${path}${query}`)}
            className="rounded-lg px-2 py-1 hover:bg-accent"
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  )
}
