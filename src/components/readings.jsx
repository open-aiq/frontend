import {
  FeelsLikeIcon,
  HumidityIcon,
  Pm1Icon,
  Pm10Icon,
  Pm25Icon,
  TemperatureIcon,
} from '@/components/icons.g'
import { Skeleton } from '@/components/ui/skeleton'
import { aqiInfo } from '@/lib/aqi'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// The reading pieces from the visual playground (docs: Contribute > Visual
// playground), matching the mobile app's AqiBlock, AqiTile and MetricGroups
// in app/lib/widgets/tiles.dart. The AQI band name always sits next to its
// color, so meaning never rides on color alone.

// AqiBlock is the compact AQI block on a monitor card.
export function AqiBlock({ aqi, loading = false, className }) {
  if (loading) return <Skeleton className={cn('h-34 rounded-[1.25rem]', className)} />
  const info = aqiInfo(aqi)
  return (
    <div
      className={cn('flex h-34 flex-col justify-center rounded-[1.25rem] px-4', className)}
      style={{ backgroundColor: info.bg, color: info.fg }}
    >
      <p className="leading-none">
        <span className="text-[2.6rem] font-medium tracking-tight tabular-nums">{aqi ?? '--'}</span>{' '}
        <span className="text-sm">AQI</span>
      </p>
      <p className="mt-1.5">{info.short}</p>
    </div>
  )
}

// AqiTile is the large AQI tile that leads the view inside a monitor.
export function AqiTile({ aqi, caption, loading = false, className }) {
  if (loading) return <Skeleton className={cn('h-52 rounded-[1.75rem]', className)} />
  const info = aqiInfo(aqi)
  return (
    <div
      className={cn('rounded-[1.75rem] px-4 pt-6 pb-5 text-center', className)}
      style={{ backgroundColor: info.bg, color: info.fg }}
    >
      <p className="text-7xl leading-none font-medium tracking-tighter tabular-nums">
        {aqi ?? '--'}
      </p>
      <p className="mt-2 text-xs tracking-[0.08em] opacity-85">AQI</p>
      <p className="mt-1 text-xl">{info.label}</p>
      {caption && <p className="mt-1.5 text-xs opacity-75">{caption}</p>}
    </div>
  )
}

function Bubble({ icon: Icon }) {
  return (
    <span className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground">
      <Icon className="size-5" />
    </span>
  )
}

function Value({ value, unit, large = false }) {
  return (
    <span>
      <span className={cn('font-medium tabular-nums', large ? 'text-xl' : 'text-base')}>
        {value}
      </span>{' '}
      <span className="text-xs text-muted-foreground">{unit}</span>
    </span>
  )
}

const groupClass = 'rounded-[1.25rem] border bg-card p-4 text-card-foreground'

function Columns({ metrics }) {
  return (
    <div className={cn(groupClass, 'grid auto-cols-fr grid-flow-col divide-x divide-border')}>
      {metrics.map(({ icon, label, value, unit }) => (
        <div
          key={label}
          className="grid justify-items-center gap-1 text-center"
        >
          <Bubble icon={icon} />
          <Value
            value={value}
            unit={unit}
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

// MetricGroups shows the readings in three cards: particulates, how it feels,
// then climate. Pass `current` (the API's current reading) or nothing while
// loading.
export function MetricGroups({ current, loading = false, className }) {
  if (loading) {
    return (
      <div
        className={cn('grid gap-3', className)}
        aria-hidden="true"
      >
        <Skeleton className="h-26 rounded-[1.25rem]" />
        <Skeleton className="h-18 rounded-[1.25rem]" />
        <Skeleton className="h-26 rounded-[1.25rem]" />
      </div>
    )
  }
  const particulates = [
    { icon: Pm25Icon, label: 'PM2.5', value: formatNumber(current?.pm2_5), unit: 'µg/m³' },
    { icon: Pm1Icon, label: 'PM1', value: formatNumber(current?.pm1_0), unit: 'µg/m³' },
    { icon: Pm10Icon, label: 'PM10', value: formatNumber(current?.pm10_0), unit: 'µg/m³' },
  ]
  const climate = [
    {
      icon: TemperatureIcon,
      label: 'Temperature',
      value: formatNumber(current?.temperature),
      unit: '°C',
    },
    { icon: HumidityIcon, label: 'Humidity', value: formatNumber(current?.humidity, 0), unit: '%' },
  ]
  return (
    <div className={cn('grid gap-3', className)}>
      <Columns metrics={particulates} />
      <div className={cn(groupClass, 'flex items-center gap-3')}>
        <Bubble icon={FeelsLikeIcon} />
        <span className="flex-1">Feels like</span>
        <Value
          value={formatNumber(current?.heat_index)}
          unit="°C"
          large
        />
      </div>
      <Columns metrics={climate} />
    </div>
  )
}
