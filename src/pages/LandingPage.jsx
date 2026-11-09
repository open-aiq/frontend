import { ArrowRight, BookOpen, Database, Map, RadioTower, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PublicHeader } from '@/components/PublicHeader'
import { PublicMap } from '@/components/PublicMap'
import { GitHubIcon } from '@/components/GitHubIcon'
import { MonitorIllustration } from '@/components/MonitorIllustration'
import { buttonVariants } from '@/components/ui/button'
import { DOCUMENTATION_URL, ORGANIZATION_URL } from '@/config'
import { cn } from '@/lib/utils'
import { usePublicMapDevices } from '@/hooks/usePublicMapDevices'

const STEPS = [
  {
    icon: RadioTower,
    title: 'Sense',
    text: 'Open hardware measures particles, temperature and humidity.',
  },
  { icon: Database, title: 'Connect', text: 'Readings travel securely to our backend.' },
  {
    icon: Share2,
    title: 'Open data',
    text: 'You choose which readings and locations to share.',
  },
  {
    icon: Map,
    title: 'See together',
    text: 'Neighbours see the same picture of the air they share.',
  },
]

export function LandingPage() {
  const map = usePublicMapDevices()
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b surface-glow">
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-8">
            <div>
              <p className="mb-4 eyebrow">Open-source air quality network</p>
              <h1 className="max-w-xl text-5xl leading-[1] font-semibold tracking-[-.04em] sm:text-6xl">
                See the air our community breathes.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
                Open AIQ connects community-built sensors to a live, shared view of the air around
                us. Every step, from device to data, is open for you to see.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className={buttonVariants({ size: 'lg' })}
                  to="/map"
                >
                  Explore the live map <ArrowRight />
                </Link>
                <Link
                  className={buttonVariants({ size: 'lg', variant: 'outline' })}
                  to="/app"
                >
                  Open your dashboard
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden p-2 surface-raised">
              <PublicMap
                {...map}
                compact
                className="h-[390px] rounded-[1.1rem]"
              />
              <Link
                className={cn(
                  buttonVariants({ variant: 'secondary' }),
                  'absolute right-5 bottom-5 z-10 shadow-lg',
                )}
                to="/map"
                aria-label="Open the full community air map"
              >
                Open full map <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="eyebrow">From sensor to street</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Air-quality data you can inspect and improve
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="relative p-6 surface-raised surface-lift"
              >
                <span className="text-xs text-muted-foreground">0{index + 1}</span>
                <span className="mt-6 grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="px-6 py-12 surface-raised surface-glow sm:px-10 lg:flex lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <MonitorIllustration className="w-28 shrink-0 max-sm:hidden" />
              <div>
                <h2 className="text-3xl font-semibold">Built in the open, for the air we share</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Build a sensor, host the stack yourself, improve the software or share a station.
                  Every layer of Open AIQ is open, and we’d love your help.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 lg:mt-0 lg:ml-8">
              <a
                className={buttonVariants({ variant: 'outline' })}
                href={DOCUMENTATION_URL}
                target="_blank"
                rel="noreferrer"
                title="Read the Open AIQ documentation"
              >
                <BookOpen />
                Documentation
              </a>
              <a
                className={buttonVariants({ variant: 'outline' })}
                href={ORGANIZATION_URL}
                target="_blank"
                rel="noreferrer"
                title="See the code on GitHub"
              >
                <GitHubIcon />
                View code on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Open AIQ · Open hardware, open software, community data
      </footer>
    </div>
  )
}
