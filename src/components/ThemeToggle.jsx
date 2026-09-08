import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MODES = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Monitor, label: 'System theme' },
]

export function ThemeToggle() {
  const { theme = 'system', setTheme } = useTheme()
  const index = Math.max(
    0,
    MODES.findIndex((m) => m.value === theme),
  )
  const { icon: Icon, label } = MODES[index]

  return (
    <Select
      value={theme}
      onValueChange={(value) => value && setTheme(value)}
    >
      <SelectTrigger
        className="w-32"
        title={`Theme: ${label}`}
        aria-label={`Choose theme. Current: ${label}`}
      >
        <SelectValue>
          <Icon className="size-4" /> {label.replace(' theme', '')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {MODES.map(({ value, icon: ModeIcon, label: modeLabel }) => (
          <SelectItem
            key={value}
            value={value}
          >
            <ModeIcon /> {modeLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
