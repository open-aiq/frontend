import { MonitorCard } from '@/components/MonitorCard'
import { MonitorIllustration } from '@/components/MonitorIllustration'
import { AqiBlock, AqiTile, MetricGroups } from '@/components/readings'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { ThemeToggle } from '@/components/ThemeToggle'
import { makeCurrent, makeDevices } from './fixtures.js'

// The web side of the visual playground. It shows the same sections, in the
// same order, as the docs page (Contribute > Visual playground) and the app's
// `make gallery`, so you can compare them side by side. Review mode only.

const ROLES = [
  'background',
  'card',
  'muted',
  'accent',
  'secondary',
  'primary',
  'foreground',
  'muted-foreground',
  'border',
  'sage',
  'sand',
  'wood',
  'highlight',
]

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="eyebrow">{title}</h2>
      {children}
    </section>
  )
}

export function Playground() {
  const devices = makeDevices()
  const byId = Object.fromEntries(devices.map((device) => [device.id, device]))
  const garden = makeCurrent('dev-garden')
  const kitchen = makeCurrent('dev-kitchen')
  const ridge = makeCurrent('dev-bushfire')

  return (
    <div className="min-h-screen bg-background surface-glow">
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Visual playground</h1>
            <p className="text-sm text-muted-foreground">
              The shared components with mock data. Compare with the docs page and the app’s
              gallery.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Design tokens">
          <div className="flex flex-wrap gap-3">
            {ROLES.map((role) => (
              <div
                key={role}
                className="grid justify-items-center gap-1 text-xs"
              >
                <span
                  className="size-12 rounded-xl border"
                  style={{ background: `var(--${role})` }}
                />
                <code>{role}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Monitor card">
          <div className="grid gap-5 sm:grid-cols-2">
            <MonitorCard
              device={byId['dev-garden']}
              current={garden}
            />
            <MonitorCard
              device={byId['dev-kitchen']}
              loading
            />
            <MonitorCard device={{ ...byId['dev-new'], ota: { status: 'update_available' } }} />
            <MonitorCard
              device={byId['dev-bushfire']}
              current={ridge}
            />
          </div>
        </Section>

        <Section title="Inside the monitor">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid content-start gap-3">
              <AqiTile
                aqi={kitchen.aqi}
                caption="Averages over the last hour"
              />
              <MetricGroups current={kitchen} />
            </div>
            <div className="grid content-start gap-3">
              <AqiTile loading />
              <MetricGroups loading />
            </div>
          </div>
        </Section>

        <Section title="AQI bands">
          <div className="grid gap-2 sm:grid-cols-4">
            {[32, 78, 128, 172, 240, 340, null].map((aqi) => (
              <AqiBlock
                key={aqi ?? 'none'}
                aqi={aqi}
              />
            ))}
          </div>
        </Section>

        <Section title="States">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="surface-raised">
              <EmptyState title="No readings yet">
                Once your monitor is online and sending data, its readings show up here.
              </EmptyState>
            </div>
            <div className="p-5 surface-raised">
              <LoadingState />
            </div>
            <div className="surface-raised">
              <ErrorState
                title="We couldn’t load your monitors"
                onRetry={() => {}}
              />
            </div>
            <div className="grid place-items-center p-5 surface-raised">
              <MonitorIllustration label="The Open AIQ monitor" />
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
