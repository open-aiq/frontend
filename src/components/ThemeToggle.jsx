import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

// The order matches the app's Settings screen: System, Light, Dark.
export const THEME_MODES = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
]

// A single icon button that steps System → Light → Dark. Used in the public
// header; signed-in pages pick the theme from the avatar menu instead.
export function ThemeToggle() {
  const { theme = 'system', setTheme } = useTheme()
  const index = Math.max(
    0,
    THEME_MODES.findIndex((m) => m.value === theme),
  )
  const { icon: Icon, label } = THEME_MODES[index]
  const next = THEME_MODES[(index + 1) % THEME_MODES.length]

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next.value)}
      title={`Theme: ${label}`}
      aria-label={`Theme: ${label}. Switch to ${next.label.toLowerCase()}`}
    >
      <Icon />
    </Button>
  )
}
