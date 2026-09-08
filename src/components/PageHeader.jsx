import { Show, SignInButton, UserButton } from '@clerk/react'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { GitHubIcon } from '@/components/GitHubIcon'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DOCUMENTATION_URL, ORGANIZATION_URL } from '@/config'

export function PageHeader({ title, description, actions, showDashboard = true }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <nav
        className="flex items-center gap-2"
        aria-label="Main navigation"
      >
        {showDashboard && (
          <Link
            className={buttonVariants({ variant: 'ghost' })}
            to="/app"
          >
            Dashboard
          </Link>
        )}
        <a
          className={buttonVariants({ variant: 'ghost' })}
          href="/map"
          target="_blank"
          rel="noreferrer"
        >
          Public map
        </a>
        <a
          className={buttonVariants({ variant: 'ghost' })}
          href={DOCUMENTATION_URL}
          target="_blank"
          rel="noreferrer"
          title="Read the Open AIQ documentation"
        >
          <BookOpen /> Docs
        </a>
        <a
          className={buttonVariants({ variant: 'ghost' })}
          href={ORGANIZATION_URL}
          target="_blank"
          rel="noreferrer"
          title="See the code on GitHub"
        >
          <GitHubIcon /> View code
        </a>
        <ThemeToggle />
        {actions}
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </nav>
    </header>
  )
}
