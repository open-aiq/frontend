import {
  FeelsLikeIcon,
  HumidityIcon,
  Pm1Icon,
  Pm10Icon,
  Pm25Icon,
  TemperatureIcon,
} from '@/components/icons.g'
import { DeviceFacts } from '@/components/DeviceFacts'
import { Skeleton } from '@/components/ui/skeleton'
import { aqiInfo } from '@/lib/aqi'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// The reading pieces from the visual playground (docs: Contribute > Visual
// playground). AqiBlock and AqiTile match the mobile app's widgets in
// app/lib/widgets/tiles.dart. The AQI band name always sits next to its color,
// so meaning never rides on color alone. MonitorReadings arranges the readings
// in the web's two balanced columns; the app keeps its own stacked layout.

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

const BUBBLE = {
  sm: ['size-7', 'size-4'],
  md: ['size-10', 'size-5'],
  lg: ['size-12', 'size-6'],
}

function Bubble({ icon: Icon, size = 'md' }) {
  const [bubble, icon] = BUBBLE[size]
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground',
        bubble,
      )}
    >
      <Icon className={icon} />
    </span>
  )
}

function Value({ value, unit, className }) {
  return (
    <span className="leading-none whitespace-nowrap">
      <span className={cn('font-medium tabular-nums', className)}>{value}</span>{' '}
      <span className="text-xs font-normal text-muted-foreground">{unit}</span>
    </span>
  )
}

const groupClass = 'rounded-[1.25rem] border bg-card text-card-foreground'

// InlineMetric puts the icon beside the value, with the label underneath the
// value: `icon | value / label`. `large` is for a card with only one metric.
function InlineMetric({ icon, label, value, unit, large = false }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-3 px-2">
      <Bubble
        icon={icon}
        size={large ? 'lg' : 'md'}
      />
      <span className="grid min-w-0 gap-1.5">
        <Value
          value={value}
          unit={unit}
          className={large ? 'text-4xl tracking-tight' : 'text-2xl tracking-tight'}
        />
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  )
}

// ParticulatesGroup is the PM2.5, PM1 and PM10 card. Each column takes two
// lines: the icon beside the name, then the value.
export function ParticulatesGroup({ current, loading = false, className }) {
  if (loading) return <Skeleton className={cn('h-20 rounded-[1.25rem]', className)} />
  const metrics = [
    { icon: Pm25Icon, label: 'PM2.5', value: formatNumber(current?.pm2_5) },
    { icon: Pm1Icon, label: 'PM1', value: formatNumber(current?.pm1_0) },
    { icon: Pm10Icon, label: 'PM10', value: formatNumber(current?.pm10_0) },
  ]
  return (
    <div
      className={cn(
        groupClass,
        'grid auto-cols-fr grid-flow-col divide-x divide-border px-1 py-2.5',
        className,
      )}
    >
      {metrics.map(({ icon, label, value }) => (
        <div
          key={label}
          className="grid content-center justify-items-center gap-1.5 px-2"
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bubble
              icon={icon}
              size="sm"
            />
            {label}
          </span>
          <Value
            value={value}
            unit="µg/m³"
            className="text-base"
          />
        </div>
      ))}
    </div>
  )
}

// FeelsLikeGroup is how warm it feels (the API's heat_index). It has the card
// to itself, so its number is the larger one.
export function FeelsLikeGroup({ current, loading = false, className }) {
  if (loading) return <Skeleton className={cn('h-20 rounded-[1.25rem]', className)} />
  return (
    <div className={cn(groupClass, 'grid content-center p-3', className)}>
      <InlineMetric
        icon={FeelsLikeIcon}
        label="Feels like"
        value={formatNumber(current?.heat_index)}
        unit="°C"
        large
      />
    </div>
  )
}

// ClimateGroup is the temperature and humidity card.
export function ClimateGroup({ current, loading = false, className }) {
  if (loading) return <Skeleton className={cn('h-20 rounded-[1.25rem]', className)} />
  return (
    <div
      className={cn(
        groupClass,
        'grid grid-cols-2 content-center divide-x divide-border px-1 py-3',
        className,
      )}
    >
      <InlineMetric
        icon={TemperatureIcon}
        label="Temperature"
        value={formatNumber(current?.temperature)}
        unit="°C"
      />
      <InlineMetric
        icon={HumidityIcon}
        label="Humidity"
        value={formatNumber(current?.humidity, 0)}
        unit="%"
      />
    </div>
  )
}

// MonitorReadings is the web's view inside a monitor: two columns of the same
// height. On the left, the AQI tile over particulates (3:1); on the right, how
// it feels over climate (2:2). The particulates card sets the height, so the
// whole block stays compact. The monitor's facts sit underneath as bubbles.
// Below `md` everything stacks in that order. Pass `device` on owner pages,
// `placement` on public ones, and `loading` while the reading loads.
export function MonitorReadings({ current, device, placement, loading = false, className }) {
  if (loading) {
    return (
      <div
        className={cn('grid gap-3', className)}
        aria-busy="true"
      >
        <span className="sr-only">Loading current readings…</span>
        <div
          className="grid gap-3 md:grid-cols-2"
          aria-hidden="true"
        >
          <div className={LEFT}>
            <AqiTile
              loading
              className="h-44 md:h-full"
            />
            <ParticulatesGroup loading />
          </div>
          <div className={RIGHT}>
            <FeelsLikeGroup
              loading
              className="md:h-full"
            />
            <ClimateGroup
              loading
              className="md:h-full"
            />
          </div>
        </div>
        <DeviceFacts
          loading
          count={placement ? 2 : 3}
        />
      </div>
    )
  }
  return (
    <div className={cn('grid gap-3', className)}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className={LEFT}>
          <AqiTile
            aqi={current?.aqi}
            className="flex flex-col justify-center py-4"
          />
          <ParticulatesGroup current={current} />
        </div>
        <div className={RIGHT}>
          <FeelsLikeGroup current={current} />
          <ClimateGroup current={current} />
        </div>
      </div>
      <DeviceFacts
        current={current}
        device={device}
        placement={placement}
      />
    </div>
  )
}

// Row heights for the two columns: AQI over particulates at 3:1, and how it
// feels over climate at 2:2. The columns stretch to the same height.
const LEFT = 'grid gap-3 md:grid-rows-[3fr_1fr]'
const RIGHT = 'grid gap-3 md:grid-rows-[1fr_1fr]'
