import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

const MODES = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Monitor, label: 'System theme' },
]

// ThemeToggle cycles light → dark → system, showing the active mode's icon.
export function ThemeToggle() {
  const { theme = 'system', setTheme } = useTheme()
  const index = Math.max(0, MODES.findIndex((m) => m.value === theme))
  const { icon: Icon, label } = MODES[index]
  const next = MODES[(index + 1) % MODES.length]

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setTheme(next.value)}
      title={`${label} — click for ${next.value}`}
      aria-label={`Switch to ${next.value} theme`}
    >
      <Icon className="size-4" />
    </Button>
  )
}
