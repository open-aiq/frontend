import { useEffect, useMemo, useRef } from 'react'
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

import { Loader2, RadioTower, ServerCrash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { aqiInfo } from '@/lib/aqi'
import { devicesToGeoJSON } from '@/lib/map'
import { cn } from '@/lib/utils'

const WORLD_CENTER = [20, 20]
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

// Vite must bundle MapLibre's module worker as a self-contained asset. Without
// this explicit URL, dependency optimization can point the browser at a worker
// file that was never copied into node_modules/.vite/deps.
setWorkerUrl(maplibreWorkerUrl)

function styleUrl() {
  return import.meta.env.VITE_MAP_STYLE_URL || OPENFREEMAP_STYLE
}

function colorExpression(property) {
  return [
    'step',
    ['get', property],
    '#A8E05F',
    51,
    '#FDD64B',
    101,
    '#FF9B57',
    151,
    '#FE6A69',
    201,
    '#A97ABC',
    301,
    '#A87383',
  ]
}

function relativeTime(value) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function popupContent(device) {
  const root = document.createElement('article')
  root.className = 'space-y-2 p-1 text-slate-950'
  const title = document.createElement('h3')
  title.className = 'font-semibold'
  title.textContent = device.name
  const reading = document.createElement('p')
  reading.className = 'text-sm'
  reading.textContent = `${device.aqi} US AQI · ${aqiInfo(device.aqi).label}`
  const metrics = document.createElement('p')
  metrics.className = 'text-xs text-slate-600'
  metrics.textContent = `PM2.5 ${Number(device.pm2_5).toFixed(1)} µg/m³ · ${Number(device.temperature).toFixed(1)}°C`
  const meta = document.createElement('p')
  meta.className = 'text-xs text-slate-600'
  meta.textContent = `${device.is_outdoor ? 'Outdoor' : 'Indoor'} · ${device.status} · ${relativeTime(device.measured_at)}`
  const link = document.createElement('a')
  link.className =
    'inline-block text-sm font-medium text-emerald-700 underline-offset-4 hover:underline'
  link.href = `/devices/${device.id}`
  link.textContent = 'View device'
  root.append(title, reading, metrics, meta, link)
  return root
}

export function PublicMap({
  devices,
  state = 'ready',
  error,
  retry,
  selectedId,
  onSelect,
  compact = false,
  className,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const fittedRef = useRef(false)
  const devicesRef = useRef(devices)
  const geojsonRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const deviceIndex = useMemo(
    () => new Map(devices.map((device) => [device.id, device])),
    [devices],
  )
  const geojson = useMemo(() => devicesToGeoJSON(devices), [devices])
  devicesRef.current = devices
  geojsonRef.current = geojson
  onSelectRef.current = onSelect
  const mapStyle = styleUrl()

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapStyle) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: mapStyle,
      center: WORLD_CENTER,
      zoom: 1.25,
      attributionControl: true,
    })
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      map.addSource('devices', {
        type: 'geojson',
        data: geojsonRef.current,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 52,
        clusterProperties: { worst_aqi: ['max', ['get', 'aqi']] },
      })
      map.addLayer({
        id: 'device-clusters',
        type: 'circle',
        source: 'devices',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': colorExpression('worst_aqi'),
          'circle-radius': ['step', ['get', 'point_count'], 22, 10, 27, 50, 34],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'devices',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
        paint: { 'text-color': '#172033' },
      })
      map.addLayer({
        id: 'device-points',
        type: 'circle',
        source: 'devices',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': colorExpression('aqi'),
          'circle-radius': 20,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
          'circle-opacity': ['case', ['==', ['get', 'status'], 'offline'], 0.62, 1],
        },
      })
      map.addLayer({
        id: 'device-aqi',
        type: 'symbol',
        source: 'devices',
        filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['to-string', ['get', 'aqi']], 'text-size': 12 },
        paint: { 'text-color': '#172033' },
      })
      if (devicesRef.current.length) {
        const bounds = new LngLatBounds()
        devicesRef.current.forEach((device) => bounds.extend([device.lon, device.lat]))
        map.fitBounds(bounds, { padding: compact ? 45 : 80, maxZoom: 11, duration: 0 })
        fittedRef.current = true
      }

      map.on('click', 'device-clusters', async (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['device-clusters'] })[0]
        if (!feature) return
        const zoom = await map
          .getSource('devices')
          .getClusterExpansionZoom(feature.properties.cluster_id)
        map.easeTo({ center: feature.geometry.coordinates, zoom })
      })
      map.on('click', 'device-points', (event) => {
        const id = String(event.features?.[0]?.properties?.id ?? '')
        const device = devicesRef.current.find((item) => item.id === id)
        if (!device) return
        onSelectRef.current?.(id)
        popupRef.current?.remove()
        popupRef.current = new Popup({ offset: 24, maxWidth: '280px' })
          .setLngLat([device.lon, device.lat])
          .setDOMContent(popupContent(device))
          .addTo(map)
      })
      for (const layer of ['device-clusters', 'device-points']) {
        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
        })
      }
    })
    return () => {
      resizeObserver.disconnect()
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [compact, mapStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    map.getSource('devices')?.setData(geojson)
    if (!fittedRef.current && devices.length) {
      const bounds = new LngLatBounds()
      devices.forEach((device) => bounds.extend([device.lon, device.lat]))
      map.fitBounds(bounds, { padding: compact ? 45 : 80, maxZoom: 11, duration: 0 })
      fittedRef.current = true
    }
  }, [compact, devices, geojson])

  useEffect(() => {
    const map = mapRef.current
    const selected = deviceIndex.get(selectedId)
    if (map && selected)
      map.flyTo({
        center: [selected.lon, selected.lat],
        zoom: Math.max(map.getZoom(), 10),
        essential: false,
      })
  }, [deviceIndex, selectedId])

  return (
    <div className={cn('relative overflow-hidden bg-slate-200', className)}>
      <div className="absolute inset-0">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label="Map of public Open AIQ sensors"
        />
      </div>
      {state === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-background/70">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {state === 'error' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
          <div className="pointer-events-auto flex min-h-52 w-full max-w-xs flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-background/95 p-6 shadow-xl">
            <span className="mb-3 grid size-12 place-items-center rounded-full bg-destructive/10">
              <ServerCrash className="size-6 text-destructive" />
            </span>
            <p className="font-medium">Public map data is unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We couldn’t reach the Open AIQ backend. Please try again.
            </p>
            {retry && (
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={retry}
              >
                Try again
              </Button>
            )}
            <span className="sr-only">Technical error: {error}</span>
          </div>
        </div>
      )}
      {state === 'ready' && devices.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
          <div className="flex min-h-48 w-full max-w-xs flex-col items-center justify-center rounded-2xl border bg-background/95 p-6 shadow-xl">
            <span className="mb-3 grid size-12 place-items-center rounded-full bg-muted">
              <RadioTower className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">No public devices yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Location-enabled sensors will appear here when they are available.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
