import { useState } from 'react'
import { Show, SignInButton, useClerk, useUser } from '@clerk/react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import {
  BookOpen,
  ExternalLink,
  FlaskConical,
  LogOut,
  Map as MapIcon,
  UserRound,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'

import { Avatar, displayName } from '@/components/Avatar'
import { GitHubIcon } from '@/components/GitHubIcon'
import { THEME_MODES } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DOCUMENTATION_URL, ORGANIZATION_URL } from '@/config'
import { appPath } from '@/lib/paths'
import { cn } from '@/lib/utils'

// The avatar at the right of every top bar, matching the app's AccountMenuButton.
// Everything that isn't the page itself lives here: your profile, the theme,
// your account, the docs, map, code and prototype links, and signing out.
export function AccountMenu() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <SignedInMenu />
      </Show>
    </>
  )
}

function SignedInMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const email = user?.primaryEmailAddress?.emailAddress
  const name = displayName(user)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut({ redirectUrl: '/' })
    } finally {
      setSigningOut(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account and settings"
          title="Account and settings"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar
            imageUrl={user?.imageUrl}
            name={name}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-64 rounded-2xl p-1.5"
        >
          <div className="flex items-center gap-3 px-2 pt-2 pb-2.5">
            <Avatar
              imageUrl={user?.imageUrl}
              name={name}
              className="size-9"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              {email && email !== name && (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <ThemeRow />
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link to="/app/account" />}>
            <UserRound /> Manage account
          </DropdownMenuItem>
          <MenuLink href={DOCUMENTATION_URL}>
            <BookOpen /> Docs
          </MenuLink>
          <MenuLink href={appPath('/map')}>
            <MapIcon /> Public map
          </MenuLink>
          <MenuLink href={ORGANIZATION_URL}>
            <GitHubIcon /> View code
          </MenuLink>
          <MenuLink href="/prototype/">
            <FlaskConical /> Prototype
          </MenuLink>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !signingOut && setConfirmOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              Your monitors keep recording. You can sign back in any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={signingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={signingOut}
            >
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// System, Light and Dark as a compact segmented row. Each segment is a menu
// radio item, so arrow keys reach it and picking one keeps the menu open.
function ThemeRow() {
  const { theme = 'system', setTheme } = useTheme()
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
      <span className="text-sm">Theme</span>
      <MenuPrimitive.RadioGroup
        value={theme}
        onValueChange={(value) => value && setTheme(value)}
        aria-label="Theme"
        className="flex rounded-full bg-muted p-0.5"
      >
        {THEME_MODES.map(({ value, icon: Icon, label }) => (
          <MenuPrimitive.RadioItem
            key={value}
            value={value}
            label={label}
            aria-label={label}
            title={label}
            className={cn(
              'grid size-7 cursor-default place-items-center rounded-full text-muted-foreground outline-none transition-colors',
              'data-highlighted:text-foreground data-highlighted:ring-2 data-highlighted:ring-ring/50',
              'data-checked:bg-background data-checked:text-foreground data-checked:shadow-sm',
            )}
          >
            <Icon className="size-4" />
          </MenuPrimitive.RadioItem>
        ))}
      </MenuPrimitive.RadioGroup>
    </div>
  )
}

function MenuLink({ href, children }) {
  return (
    <DropdownMenuItem
      render={
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
        />
      }
    >
      {children}
      <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
    </DropdownMenuItem>
  )
}
