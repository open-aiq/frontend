import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AccountMenu } from '@/components/AccountMenu'
import { MonitorGlyph } from '@/components/MonitorIllustration'

// The one top bar for signed-in pages, matching the app's AiqAppBar: a round
// back link (or the monitor mark on the first page), a title with an optional
// subtitle, an optional status chip, and the avatar menu at the far right.
// Nothing else goes in the bar; links and the theme live in the avatar menu.
export function AppShell({ title, subtitle, backTo, backLabel = 'Back', chip, children }) {
  return (
    <div className="min-h-screen bg-background surface-glow">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          {backTo ? (
            <Link
              to={backTo}
              aria-label={backLabel}
              title={backLabel}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors outline-none hover:bg-secondary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : (
            <Link
              to="/app"
              aria-label="Open AIQ, my monitors"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <MonitorGlyph />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg leading-tight font-semibold tracking-tight">{title}</h1>
            {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {chip && <div className="shrink-0">{chip}</div>}
          <AccountMenu />
        </div>
      </header>
      {children}
    </div>
  )
}
