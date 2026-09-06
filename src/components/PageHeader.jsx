import { Show, SignInButton, UserButton } from '@clerk/react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

export function PageHeader({ title, description, actions }) {
  return <header className="flex flex-wrap items-center justify-between gap-4">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{description && <p className="text-sm text-muted-foreground">{description}</p>}</div>
    <nav className="flex items-center gap-2" aria-label="Main navigation">
      <Link className={buttonVariants({ variant: 'ghost' })} to="/">Dashboard</Link>
      <Link className={buttonVariants({ variant: 'ghost' })} to="/public">Public devices</Link>
      <ThemeToggle />
      {actions}
      <Show when="signed-out"><SignInButton mode="modal"><Button>Sign in</Button></SignInButton></Show>
      <Show when="signed-in"><UserButton /></Show>
    </nav>
  </header>
}
