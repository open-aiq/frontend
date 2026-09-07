import { ArrowRight, BookOpen, Database, Map, RadioTower, Share2, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PublicHeader } from '@/components/PublicHeader'
import { PublicMap } from '@/components/PublicMap'
import { GitHubIcon } from '@/components/GitHubIcon'
import { buttonVariants } from '@/components/ui/button'
import { aqiInfo } from '@/lib/aqi'
import { cn } from '@/lib/utils'
import { usePublicMapDevices } from '@/hooks/usePublicMapDevices'

const STEPS = [
  { icon: RadioTower, title: 'Sense', text: 'Open hardware measures particles, temperature, and humidity.' },
  { icon: Database, title: 'Connect', text: 'Readings flow securely into the Open AIQ backend.' },
  { icon: Share2, title: 'Open data', text: 'Owners choose which readings and locations to publish.' },
  { icon: Map, title: 'See together', text: 'Communities turn local measurements into shared awareness.' },
]

const AQI_VALUES = [25, 75, 125, 175, 250, 350]

export function LandingPage() {
  const map = usePublicMapDevices()
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.2),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,.16),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-8">
            <div>
              <p className="mb-4 text-sm font-medium tracking-[.18em] text-emerald-300 uppercase">Open-source air quality network</p>
              <h1 className="max-w-xl text-5xl leading-[.95] font-semibold tracking-[-.05em] sm:text-6xl">See the air your community breathes.</h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Open AIQ connects community-built sensors to a shared, live view of the air around us—transparent from device to data.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className={buttonVariants({ size: 'lg' })} to="/map">Explore the live map <ArrowRight /></Link>
                <Link className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white')} to="/app">Register a device</Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-2 shadow-2xl shadow-emerald-950/30">
              <PublicMap {...map} compact className="h-[390px] rounded-[1.15rem]" />
              <Link className={cn(buttonVariants({ variant: 'secondary' }), 'absolute right-5 bottom-5 z-10 shadow-lg')} to="/map" aria-label="Open the full community air map">Open full map <ArrowRight /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-emerald-600">From sensor to street</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Air-quality data you can inspect and improve.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => <article key={title} className="relative rounded-2xl border bg-card p-6"><span className="text-xs text-muted-foreground">0{index + 1}</span><Icon className="mt-6 size-6 text-emerald-600" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}
          </div>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div><p className="text-sm font-medium text-emerald-600">Understanding AQI</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">One scale, clear context.</h2><p className="mt-4 max-w-xl leading-7 text-muted-foreground">Open AIQ reports US AQI alongside particulate readings. Every color is paired with a label, so the meaning never depends on color alone.</p><a className={cn(buttonVariants({ variant: 'link' }), 'mt-4 px-0')} href="https://docs.openaiq.org/aqi-methodology">Read the AQI methodology <ArrowRight /></a></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{AQI_VALUES.map((value) => { const info = aqiInfo(value); return <div key={value} className="rounded-2xl p-4" style={{ backgroundColor: info.bg, color: info.fg }}><strong className="text-2xl">{value}</strong><p className="mt-1 text-xs font-medium">{info.label}</p></div> })}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-emerald-950 px-6 py-12 text-white sm:px-10 lg:flex lg:items-center lg:justify-between">
            <div><Wind className="size-8 text-emerald-300" /><h2 className="mt-5 text-3xl font-semibold">Built in the open, for the air we share.</h2><p className="mt-3 max-w-2xl text-emerald-100/75">Build a sensor, self-host the stack, improve the software, or publish a station. Every layer of Open AIQ is open to the community.</p></div>
            <div className="mt-8 flex flex-wrap gap-3 lg:mt-0 lg:ml-8"><a className={buttonVariants({ variant: 'secondary' })} href="https://docs.openaiq.org" title="Read the Open AIQ documentation"><BookOpen /> Documentation</a><a className={cn(buttonVariants({ variant: 'outline' }), 'border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white')} href="https://github.com/open-aiq" target="_blank" rel="noreferrer" title="See the code on GitHub"><GitHubIcon /> View code on GitHub</a></div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">Open AIQ · Open hardware, open software, community data.</footer>
    </div>
  )
}
