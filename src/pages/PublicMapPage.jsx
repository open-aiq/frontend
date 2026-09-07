import { useMemo, useState } from 'react'
import { ChevronDown, MapPin, Search, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { PublicHeader } from '@/components/PublicHeader'
import { PublicMap } from '@/components/PublicMap'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePublicMapDevices } from '@/hooks/usePublicMapDevices'
import { aqiInfo } from '@/lib/aqi'
import { filterMapDevices } from '@/lib/map'
import { cn } from '@/lib/utils'

export function PublicMapPage() {
  const map = usePublicMapDevices()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [placement, setPlacement] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(searchParams.get('device'))
  const [panelOpen, setPanelOpen] = useState(false)
  const filtered = useMemo(() => filterMapDevices(map.devices, { query, placement, status }), [map.devices, placement, query, status])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <PublicHeader />
      <main className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden md:grid-cols-[360px_1fr]">
        <aside className={cn('z-10 flex min-h-0 flex-col border-r bg-background max-md:absolute max-md:inset-x-3 max-md:bottom-3 max-md:max-h-[70%] max-md:rounded-2xl max-md:border max-md:shadow-2xl', !panelOpen && 'max-md:max-h-14 max-md:overflow-hidden')}>
          <button className="flex h-14 shrink-0 items-center justify-between px-4 text-left md:hidden" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen}><span className="font-medium">{filtered.length} public sensors</span>{panelOpen ? <X /> : <ChevronDown />}</button>
          <div className="border-b p-4">
            <h1 className="text-xl font-semibold tracking-tight">Community air map</h1>
            <p className="mt-1 text-sm text-muted-foreground">Live readings shared by sensor owners.</p>
            <div className="relative mt-4"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search sensors" aria-label="Search public sensors" /></div>
            <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Map filters">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <Select value={placement} onValueChange={setPlacement}>
                  <SelectTrigger className="w-full" aria-label="Filter by device location"><SelectValue>{placement === 'all' ? 'All locations' : placement[0].toUpperCase() + placement.slice(1)}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="all">All locations</SelectItem><SelectItem value="indoor">Indoor</SelectItem><SelectItem value="outdoor">Outdoor</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full" aria-label="Filter by device status"><SelectValue>{status === 'all' ? 'All statuses' : status[0].toUpperCase() + status.slice(1)}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {map.state === 'ready' && filtered.length === 0 && <p className="px-3 py-10 text-center text-sm text-muted-foreground">No sensors match these filters.</p>}
            <div className="space-y-2">{filtered.map((device) => { const info = aqiInfo(device.aqi); return <button key={device.id} onClick={() => { setSelectedId(device.id); setPanelOpen(false) }} className={cn('w-full rounded-xl border p-3 text-left transition hover:bg-muted/60', selectedId === device.id && 'border-emerald-500 ring-2 ring-emerald-500/15')}><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full font-semibold" style={{ backgroundColor: info.bg, color: info.fg }}>{device.aqi}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{device.name}</span><span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3" />{device.is_outdoor ? 'Outdoor' : 'Indoor'}<Badge variant="outline" className="ml-auto capitalize">{device.status}</Badge></span></span></div></button> })}</div>
          </div>
          {selectedId && <div className="border-t p-3"><Link className={cn('w-full', buttonVariants())} to={`/devices/${selectedId}`}>View selected device</Link></div>}
        </aside>
        <PublicMap devices={filtered} state={map.state} error={map.error} retry={map.retry} selectedId={selectedId} onSelect={setSelectedId} className="min-h-0 h-full" />
      </main>
    </div>
  )
}
