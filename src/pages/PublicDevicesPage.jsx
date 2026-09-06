import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Inbox, Loader2, ServerCrash } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listPublicDevices } from '@/lib/api'

export function PublicDevicesPage() {
  const [state, setState] = useState('loading'); const [devices, setDevices] = useState([])
  useEffect(() => { listPublicDevices().then((d) => { setDevices(d); setState('ready') }).catch(() => setState('error')) }, [])
  return <div className="min-h-screen bg-muted/30"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <PageHeader title="Public devices" description="Explore air quality shared by the community." />
    <main className="mt-8">
      {state === 'loading' && <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin" /></div>}
      {state === 'error' && <div className="flex justify-center gap-2 py-24"><ServerCrash /> Couldn’t load public devices.</div>}
      {state === 'ready' && !devices.length && <div className="flex justify-center gap-2 py-24"><Inbox /> No public devices yet.</div>}
      {state === 'ready' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{devices.map((d) => <Link key={d.id} to={`/public/devices/${d.id}`}><Card className="h-full transition-shadow hover:shadow-md"><CardHeader><CardTitle>{d.name}</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="size-4" /> {d.is_outdoor ? 'Outdoor' : 'Indoor'} sensor</CardContent></Card></Link>)}</div>}
    </main>
  </div></div>
}
