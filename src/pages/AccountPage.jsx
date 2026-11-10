import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClerk, useReverification, useUser } from '@clerk/react'
import {
  FingerprintPattern,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'

import { AppShell } from '@/components/AppShell'
import { Avatar, displayName } from '@/components/Avatar'
import { GitHubIcon } from '@/components/GitHubIcon'
import { GoogleIcon } from '@/components/GoogleIcon'
import { LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DELETE_ACCOUNT_CONFIRMATION,
  clerkErrorMessage,
  isReverificationCancelled,
  signInMethodCount,
} from '@/lib/account'
import { useApi } from '@/lib/api'
import { appPath } from '@/lib/paths'

// The social accounts enabled in Clerk. Keep in step with the Clerk dashboard.
const PROVIDERS = [
  { provider: 'google', strategy: 'oauth_google', label: 'Google', icon: GoogleIcon },
  { provider: 'github', strategy: 'oauth_github', label: 'GitHub', icon: GitHubIcon },
]

const isVerified = (resource) => resource?.verification?.status === 'verified'

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// useAccountAction runs one change at a time, with the key of the busy control
// and a readable error. `reverify` wraps a Clerk call so Clerk can ask you to
// confirm it's you first, then retries it.
function useAccountAction() {
  const reverify = useReverification((action) => action())
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  async function run(key, action) {
    setBusy(key)
    setError('')
    try {
      await action()
      return true
    } catch (err) {
      if (!isReverificationCancelled(err)) setError(clerkErrorMessage(err))
      return false
    } finally {
      setBusy(null)
    }
  }

  return { busy, error, setError, run, reverify }
}

function Spinner({ when, icon: Icon }) {
  if (when) return <Loader2 className="size-4 animate-spin" />
  return Icon ? <Icon className="size-4" /> : null
}

function ErrorText({ id, children }) {
  if (!children) return null
  return (
    <p
      id={id}
      role="alert"
      className="text-sm text-destructive"
    >
      {children}
    </p>
  )
}

export function AccountPage() {
  const { isLoaded, user } = useUser()

  return (
    <AppShell
      backTo="/app"
      backLabel="Back to my monitors"
      title="Your account"
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {!isLoaded || !user ? (
          <main>
            <div className="p-5 surface-raised">
              <LoadingState label="Loading your account" />
            </div>
          </main>
        ) : (
          <main className="space-y-6">
            <ProfileCard user={user} />
            <SignInMethodsCard user={user} />
            <DangerZoneCard />
          </main>
        )}
      </div>
    </AppShell>
  )
}

function ProfileCard({ user }) {
  const name = displayName(user)
  const email = user.primaryEmailAddress?.emailAddress
  const [username, setUsername] = useState(user.username ?? '')
  const { busy, error, setError, run, reverify } = useAccountAction()
  const trimmed = username.trim()
  const changed = trimmed !== (user.username ?? '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!trimmed || !changed) return
    const ok = await run('username', () => reverify(() => user.update({ username: trimmed })))
    if (ok) toast.success('Username saved')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>How you show up in Open AIQ.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            imageUrl={user.imageUrl}
            name={name}
            className="size-14 text-base"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {email && email !== name && (
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-2"
        >
          <Label htmlFor="account-username">Username</Label>
          <div className="flex gap-2">
            <Input
              id="account-username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              disabled={busy !== null}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'account-username-error' : undefined}
            />
            <Button
              type="submit"
              disabled={busy !== null || !trimmed || !changed}
            >
              <Spinner when={busy === 'username'} />
              Save
            </Button>
          </div>
          <ErrorText id="account-username-error">{error}</ErrorText>
        </form>
      </CardContent>
    </Card>
  )
}

function SignInMethodsCard({ user }) {
  const methods = signInMethodCount(user)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign-in methods</CardTitle>
        <CardDescription>The ways you can get into your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {methods <= 1 && (
          <p className="rounded-lg border border-highlight/50 bg-highlight/10 p-3 text-sm text-muted-foreground">
            You have one way to sign in, so we can’t remove it yet. Add another one first.
          </p>
        )}
        <EmailSection
          user={user}
          methods={methods}
        />
        <ConnectionsSection
          user={user}
          methods={methods}
        />
        <PasswordSection
          user={user}
          methods={methods}
        />
        {user.passkeys?.length > 0 && (
          <PasskeysSection
            user={user}
            methods={methods}
          />
        )}
      </CardContent>
    </Card>
  )
}

function MethodSection({ title, icon: Icon, children }) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className="space-y-3"
    >
      <h3
        id={id}
        className="flex items-center gap-2 text-sm font-medium"
      >
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h3>
      {children}
    </section>
  )
}

const listClass = 'divide-y divide-border rounded-xl border'
const rowClass = 'flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5'

function EmailSection({ user, methods }) {
  const { busy, error, run, reverify } = useAccountAction()
  const [adding, setAdding] = useState(false)
  // The address waiting for its code, after you add it or ask to verify it.
  const [verifying, setVerifying] = useState(null)
  const emails = user.emailAddresses ?? []

  async function makePrimary(email) {
    const ok = await run(`primary:${email.id}`, () =>
      reverify(() => user.update({ primaryEmailAddressId: email.id })),
    )
    if (ok) toast.success(`${email.emailAddress} is now your primary email`)
  }

  async function remove(email) {
    const ok = await run(`remove:${email.id}`, async () => {
      await reverify(() => email.destroy())
      await user.reload()
    })
    if (!ok) return
    if (verifying?.id === email.id) setVerifying(null)
    toast.success(`Removed ${email.emailAddress}`)
  }

  async function verify(email) {
    const ok = await run(`verify:${email.id}`, () =>
      email.prepareVerification({ strategy: 'email_code' }),
    )
    if (!ok) return
    setAdding(false)
    setVerifying(email)
  }

  return (
    <MethodSection
      title="Email addresses"
      icon={Mail}
    >
      {emails.length > 0 && (
        <ul className={listClass}>
          {emails.map((email) => {
            const primary = email.id === user.primaryEmailAddressId
            const verified = isVerified(email)
            const removable = !primary && (!verified || methods > 1)
            return (
              <li
                key={email.id}
                className={rowClass}
              >
                <span className="min-w-0 flex-1 text-sm break-all">{email.emailAddress}</span>
                <span className="flex flex-wrap gap-1.5">
                  {primary && <Badge variant="secondary">Primary</Badge>}
                  <Badge variant="outline">{verified ? 'Verified' : 'Unverified'}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  {!verified && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => verify(email)}
                      disabled={busy !== null}
                    >
                      <Spinner when={busy === `verify:${email.id}`} />
                      Verify
                    </Button>
                  )}
                  {verified && !primary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => makePrimary(email)}
                      disabled={busy !== null}
                    >
                      <Spinner when={busy === `primary:${email.id}`} />
                      Make primary
                    </Button>
                  )}
                  {!primary && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => remove(email)}
                      disabled={busy !== null || !removable}
                      aria-label={`Remove ${email.emailAddress}`}
                      title={`Remove ${email.emailAddress}`}
                    >
                      <Spinner
                        when={busy === `remove:${email.id}`}
                        icon={Trash2}
                      />
                    </Button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {emails.length > 1 && (
        <p className="text-xs text-muted-foreground">
          To remove your primary address, make another one primary first.
        </p>
      )}

      {verifying ? (
        <VerifyEmailForm
          user={user}
          email={verifying}
          onDone={() => setVerifying(null)}
        />
      ) : adding ? (
        <AddEmailForm
          user={user}
          onCancel={() => setAdding(false)}
          onAdded={(email) => {
            setAdding(false)
            setVerifying(email)
          }}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          disabled={busy !== null}
        >
          <Plus /> Add an email address
        </Button>
      )}
      <ErrorText>{error}</ErrorText>
    </MethodSection>
  )
}

function AddEmailForm({ user, onCancel, onAdded }) {
  const [address, setAddress] = useState('')
  const { busy, error, setError, run, reverify } = useAccountAction()

  async function handleSubmit(e) {
    e.preventDefault()
    const email = address.trim()
    if (!email) return
    let created = null
    const ok = await run('add', async () => {
      created = await reverify(() => user.createEmailAddress({ email }))
      await user.reload()
      await created.prepareVerification({ strategy: 'email_code' })
    })
    if (ok) onAdded(created)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-xl border bg-muted/30 p-3"
    >
      <Label htmlFor="account-new-email">New email address</Label>
      <p className="text-sm text-muted-foreground">We’ll send it a code to check it’s yours.</p>
      <div className="flex flex-wrap gap-2">
        <Input
          id="account-new-email"
          type="email"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setError('')
          }}
          disabled={busy !== null}
          autoComplete="email"
          autoFocus
          className="min-w-48 flex-1"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'account-new-email-error' : undefined}
        />
        <Button
          type="submit"
          disabled={busy !== null || !address.trim()}
        >
          <Spinner when={busy === 'add'} />
          Send code
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={busy !== null}
        >
          Cancel
        </Button>
      </div>
      <ErrorText id="account-new-email-error">{error}</ErrorText>
    </form>
  )
}

function VerifyEmailForm({ user, email, onDone }) {
  const [code, setCode] = useState('')
  const { busy, error, setError, run } = useAccountAction()

  async function handleSubmit(e) {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    const ok = await run('verify', async () => {
      await email.attemptVerification({ code: value })
      await user.reload()
    })
    if (!ok) return
    toast.success(`${email.emailAddress} is verified`)
    onDone()
  }

  async function resend() {
    const ok = await run('resend', () => email.prepareVerification({ strategy: 'email_code' }))
    if (ok) toast.success('We sent you a new code')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-xl border bg-muted/30 p-3"
    >
      <Label htmlFor="account-email-code">Verification code</Label>
      <p className="text-sm text-muted-foreground">
        We sent a code to <span className="font-medium text-foreground">{email.emailAddress}</span>.
        It can take a minute to arrive, so check your spam folder too.
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          id="account-email-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
          disabled={busy !== null}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          className="w-36 font-mono tracking-widest"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'account-email-code-error' : undefined}
        />
        <Button
          type="submit"
          disabled={busy !== null || !code.trim()}
        >
          <Spinner when={busy === 'verify'} />
          Verify
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={resend}
          disabled={busy !== null}
        >
          <Spinner when={busy === 'resend'} />
          Send a new code
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={busy !== null}
        >
          Later
        </Button>
      </div>
      <ErrorText id="account-email-code-error">{error}</ErrorText>
    </form>
  )
}

function ConnectionsSection({ user, methods }) {
  const { busy, error, run, reverify } = useAccountAction()
  const accounts = user.externalAccounts ?? []

  // Clerk hands back the provider's sign-in page; you come back here after.
  async function follow(account) {
    const url = account?.verification?.externalVerificationRedirectURL
    if (url) window.location.assign(url.href ?? String(url))
    else await user.reload()
  }

  async function connect({ strategy }) {
    await run(`connect:${strategy}`, async () => {
      const account = await reverify(() =>
        user.createExternalAccount({ strategy, redirectUrl: window.location.href }),
      )
      await follow(account)
    })
  }

  async function reconnect(account) {
    await run(`reconnect:${account.id}`, async () => {
      const updated = await reverify(() =>
        account.reauthorize({ redirectUrl: window.location.href }),
      )
      await follow(updated)
    })
  }

  async function disconnect(account, label) {
    const ok = await run(`disconnect:${account.id}`, async () => {
      await reverify(() => account.destroy())
      await user.reload()
    })
    if (ok) toast.success(`Disconnected ${label}`)
  }

  return (
    <MethodSection
      title="Connected accounts"
      icon={Link2}
    >
      <ul className={listClass}>
        {PROVIDERS.map(({ provider, strategy, label, icon: Icon }) => {
          const connected = accounts.filter((account) => account.provider === provider)
          const icon = (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </span>
          )
          if (connected.length === 0) {
            return (
              <li
                key={provider}
                className={rowClass}
              >
                {icon}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">Not connected</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => connect({ strategy })}
                  disabled={busy !== null}
                >
                  <Spinner when={busy === `connect:${strategy}`} />
                  Connect
                </Button>
              </li>
            )
          }
          return connected.map((account) => {
            const verified = isVerified(account)
            const removable = !verified || methods > 1
            return (
              <li
                key={account.id}
                className={rowClass}
              >
                {icon}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.emailAddress || account.username || 'Connected'}
                  </span>
                </span>
                {!verified && <Badge variant="outline">Not finished</Badge>}
                <span className="flex items-center gap-1">
                  {!verified && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reconnect(account)}
                      disabled={busy !== null}
                    >
                      <Spinner when={busy === `reconnect:${account.id}`} />
                      Reconnect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => disconnect(account, label)}
                    disabled={busy !== null || !removable}
                  >
                    <Spinner when={busy === `disconnect:${account.id}`} />
                    Disconnect
                  </Button>
                </span>
              </li>
            )
          })
        })}
      </ul>
      <ErrorText>{error}</ErrorText>
    </MethodSection>
  )
}

function PasswordSection({ user, methods }) {
  const [dialog, setDialog] = useState(null) // 'password' | 'remove' | null
  // Kept while the dialog closes, so its title doesn't flip once a new
  // password is set.
  const [changing, setChanging] = useState(false)
  const enabled = user.passwordEnabled

  return (
    <MethodSection
      title="Password"
      icon={KeyRound}
    >
      <div className={`${rowClass} rounded-xl border`}>
        <span className="min-w-0 flex-1 text-sm text-muted-foreground">
          {enabled
            ? 'You can sign in with your email and password.'
            : 'Add one to sign in with your email and password.'}
        </span>
        <span className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setChanging(enabled)
              setDialog('password')
            }}
          >
            {enabled ? 'Change' : 'Set a password'}
          </Button>
          {enabled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDialog('remove')}
              disabled={methods <= 1}
            >
              Remove
            </Button>
          )}
        </span>
      </div>
      <PasswordDialog
        user={user}
        changing={changing}
        open={dialog === 'password'}
        onClose={() => setDialog(null)}
      />
      <RemovePasswordDialog
        user={user}
        open={dialog === 'remove'}
        onClose={() => setDialog(null)}
      />
    </MethodSection>
  )
}

function PasswordDialog({ user, changing, open, onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [signOutOthers, setSignOutOthers] = useState(true)
  const { busy, error, setError, run, reverify } = useAccountAction()
  const mismatch = confirm.length > 0 && next !== confirm

  function reset() {
    setCurrent('')
    setNext('')
    setConfirm('')
    setSignOutOthers(true)
    setError('')
  }

  function handleOpenChange(value) {
    if (busy !== null || value) return
    reset()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!next || next !== confirm) return
    const ok = await run('password', () =>
      reverify(() =>
        user.updatePassword({
          newPassword: next,
          ...(changing ? { currentPassword: current } : {}),
          signOutOfOtherSessions: signOutOthers,
        }),
      ),
    )
    if (!ok) return
    toast.success(changing ? 'Password changed' : 'Password set')
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={busy === null}
      >
        <DialogHeader>
          <DialogTitle>{changing ? 'Change your password' : 'Set a password'}</DialogTitle>
          <DialogDescription>
            A few unrelated words make a password that’s strong and easy to remember.
          </DialogDescription>
        </DialogHeader>
        <form
          id="account-password-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {changing && (
            <div className="space-y-2">
              <Label htmlFor="account-current-password">Current password</Label>
              <Input
                id="account-current-password"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                disabled={busy !== null}
                autoComplete="current-password"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="account-new-password">New password</Label>
            <Input
              id="account-new-password"
              type="password"
              value={next}
              onChange={(e) => {
                setNext(e.target.value)
                setError('')
              }}
              disabled={busy !== null}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-confirm-password">Type it again</Label>
            <Input
              id="account-confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy !== null}
              autoComplete="new-password"
              required
              aria-invalid={mismatch}
              aria-describedby={mismatch ? 'account-password-mismatch' : undefined}
            />
            {mismatch && (
              <p
                id="account-password-mismatch"
                className="text-sm text-destructive"
              >
                Those two don’t match yet.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="account-sign-out-others">Sign out everywhere else</Label>
              <p className="text-sm text-muted-foreground">
                Your other browsers and phones will need the new password.
              </p>
            </div>
            <Switch
              id="account-sign-out-others"
              checked={signOutOthers}
              onCheckedChange={setSignOutOthers}
              disabled={busy !== null}
            />
          </div>
          <ErrorText>{error}</ErrorText>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy !== null}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="account-password-form"
            disabled={busy !== null || !next || next !== confirm || (changing && !current)}
          >
            <Spinner when={busy === 'password'} />
            {changing ? 'Change password' : 'Set password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RemovePasswordDialog({ user, open, onClose }) {
  const [current, setCurrent] = useState('')
  const { busy, error, setError, run, reverify } = useAccountAction()

  function handleOpenChange(value) {
    if (busy !== null || value) return
    setCurrent('')
    setError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!current) return
    const ok = await run('remove', () =>
      reverify(() => user.removePassword({ currentPassword: current })),
    )
    if (!ok) return
    toast.success('Password removed')
    setCurrent('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={busy === null}
      >
        <DialogHeader>
          <DialogTitle>Remove your password?</DialogTitle>
          <DialogDescription>
            You’ll sign in with your other methods instead. You can set a new password any time.
          </DialogDescription>
        </DialogHeader>
        <form
          id="account-remove-password-form"
          onSubmit={handleSubmit}
          className="space-y-2"
        >
          <Label htmlFor="account-remove-password">Current password</Label>
          <Input
            id="account-remove-password"
            type="password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value)
              setError('')
            }}
            disabled={busy !== null}
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'account-remove-password-error' : undefined}
          />
          <ErrorText id="account-remove-password-error">{error}</ErrorText>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy !== null}
          >
            Keep it
          </Button>
          <Button
            type="submit"
            form="account-remove-password-form"
            variant="destructive"
            disabled={busy !== null || !current}
          >
            <Spinner when={busy === 'remove'} />
            Remove password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PasskeysSection({ user, methods }) {
  const { busy, error, run, reverify } = useAccountAction()

  async function remove(passkey) {
    const ok = await run(passkey.id, async () => {
      await reverify(() => passkey.delete())
      await user.reload()
    })
    if (ok) toast.success('Passkey removed')
  }

  return (
    <MethodSection
      title="Passkeys"
      icon={FingerprintPattern}
    >
      <ul className={listClass}>
        {user.passkeys.map((passkey) => {
          const lastUsed = formatDate(passkey.lastUsedAt)
          const added = formatDate(passkey.createdAt)
          const name = passkey.name || 'Passkey'
          return (
            <li
              key={passkey.id}
              className={rowClass}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium break-all">{name}</span>
                <span className="block text-xs text-muted-foreground">
                  {lastUsed ? `Last used ${lastUsed}` : added ? `Added ${added}` : 'Not used yet'}
                </span>
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => remove(passkey)}
                disabled={busy !== null || methods <= 1}
                aria-label={`Remove ${name}`}
                title={`Remove ${name}`}
              >
                <Spinner
                  when={busy === passkey.id}
                  icon={Trash2}
                />
              </Button>
            </li>
          )
        })}
      </ul>
      <ErrorText>{error}</ErrorText>
    </MethodSection>
  )
}

function DangerZoneCard() {
  const { deleteAccount } = useApi()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const confirmed = confirmation === DELETE_ACCOUNT_CONFIRMATION

  function handleOpenChange(value) {
    if (deleting) return
    setOpen(value)
    if (!value) {
      setConfirmation('')
      setError('')
    }
  }

  async function handleDelete(e) {
    e.preventDefault()
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      await deleteAccount()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      return
    }
    toast.success('Your account is deleted. Thanks for measuring the air with us.')
    try {
      await signOut({ redirectUrl: '/' })
    } catch {
      // The session usually goes with the account. Head home anyway.
      window.location.assign(appPath('/'))
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Deleting your account removes your monitors and all their data for good.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setOpen(true)}
            disabled={deleting}
          >
            <Spinner
              when={deleting}
              icon={Trash2}
            />
            Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent
          className="sm:max-w-lg"
          showCloseButton={!deleting}
        >
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" />
            </div>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This deletes everything, and we can’t undo it. Your monitors will stop uploading
              readings.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">Here’s what goes:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Every monitor on your account</li>
              <li>Their readings, logs and update history</li>
              <li>Your sign-in and profile</li>
            </ul>
          </div>

          <form
            id="delete-account-form"
            onSubmit={handleDelete}
            className="space-y-2"
          >
            <Label
              htmlFor="delete-account-confirmation"
              className="block leading-normal"
            >
              To confirm, type{' '}
              <span className="font-mono font-semibold text-foreground">
                {DELETE_ACCOUNT_CONFIRMATION}
              </span>{' '}
              below.
            </Label>
            <Input
              id="delete-account-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={deleting}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'delete-account-error' : undefined}
            />
            <ErrorText id="delete-account-error">{error}</ErrorText>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="delete-account-form"
              variant="destructive"
              disabled={deleting || !confirmed}
            >
              <Spinner
                when={deleting}
                icon={Trash2}
              />
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
