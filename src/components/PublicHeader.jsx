import { BookOpen, Wind } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { GitHubIcon } from '@/components/GitHubIcon'
import { buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DOCUMENTATION_URL, ORGANIZATION_URL } from '@/config'
import { cn } from '@/lib/utils'

export function PublicHeader({ overlay = false }) {
  const { pathname } = useLocation()
  const onMapPage = pathname === '/map'

  return (
    <header
      className={cn(
        'relative z-20 border-b bg-background/90 backdrop-blur',
        overlay && 'border-white/15 bg-slate-950/65 text-white',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-500 text-slate-950">
            <Wind className="size-5" />
          </span>
          Open AIQ
        </Link>
        <nav
          className="flex items-center gap-1"
          aria-label="Public navigation"
        >
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'max-sm:hidden')}
            href={DOCUMENTATION_URL}
            target={onMapPage ? '_blank' : undefined}
            rel={onMapPage ? 'noreferrer' : undefined}
            title="Read the Open AIQ documentation"
          >
            <BookOpen /> Docs
          </a>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'max-sm:hidden')}
            href={ORGANIZATION_URL}
            target="_blank"
            rel="noreferrer"
            title="See the code on GitHub"
          >
            <GitHubIcon /> View code
          </a>
          <ThemeToggle />
          {onMapPage ? (
            <a
              className={buttonVariants({ variant: 'default' })}
              href="/app"
              target="_blank"
              rel="noreferrer"
            >
              Dashboard
            </a>
          ) : (
            <Link
              className={buttonVariants({ variant: overlay ? 'secondary' : 'default' })}
              to="/app"
            >
              Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
