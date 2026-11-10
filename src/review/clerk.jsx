// Review-mode stand-in for @clerk/react. vite.config.js aliases the package to
// this file only under `--mode review`. It provides exactly the pieces the app
// uses, with a fake signed-in user (or signed out, per the scenario), so pages
// render without a Clerk key or network.
import { useSyncExternalStore } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { buttonVariants } from '@/components/ui/button'
import { ReviewBar } from './ReviewBar.jsx'
import { getScenario } from './scenario.js'

const signedIn = getScenario() !== 'signed-out'

export function ClerkProvider({ children }) {
  return (
    <>
      {children}
      <ReviewBar />
    </>
  )
}

export function Show({ when, children }) {
  const visible = when === 'signed-in' ? signedIn : when === 'signed-out' ? !signedIn : false
  return visible ? children : null
}

export function useAuth() {
  return { isLoaded: true, isSignedIn: signedIn, getToken: async () => 'review-token' }
}

// The review user lives in memory, so account changes stick until a reload.
// Each change builds a fresh snapshot and tells useUser() to re-render, the
// way Clerk does. Errors mimic Clerk's shape: `errors[0].longMessage`.
const account = {
  fullName: 'Riley Review',
  username: 'riley',
  imageUrl: null,
  passwordEnabled: true,
  primaryEmailAddressId: 'email-riley',
  emails: [
    { id: 'email-riley', emailAddress: 'riley@example.com', status: 'verified' },
    { id: 'email-work', emailAddress: 'riley@work.example', status: 'unverified' },
  ],
  externalAccounts: [
    {
      id: 'ext-github',
      provider: 'github',
      username: 'riley-review',
      emailAddress: 'riley@example.com',
      status: 'verified',
    },
  ],
  passkeys: [],
}

const LATENCY_MS = 400
const listeners = new Set()
let nextId = 1
let snapshot = buildUser()

const wait = () => new Promise((resolve) => window.setTimeout(resolve, LATENCY_MS))

function changed() {
  snapshot = buildUser()
  for (const listener of listeners) listener()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function clerkError(code, longMessage) {
  return Object.assign(new Error(longMessage), {
    errors: [{ code, message: longMessage, longMessage }],
  })
}

function emailResource(email) {
  return {
    id: email.id,
    emailAddress: email.emailAddress,
    verification: { status: email.status },
    prepareVerification: async () => {
      await wait()
      toast(`Review mode: no email goes out. Any 6-digit code works for ${email.emailAddress}.`)
      return emailResource(email)
    },
    attemptVerification: async ({ code }) => {
      await wait()
      if (!/^\d{6}$/.test(code ?? '')) {
        throw clerkError('form_code_incorrect', 'That code doesn’t look right. Try any 6 digits.')
      }
      email.status = 'verified'
      changed()
      return emailResource(email)
    },
    destroy: async () => {
      await wait()
      account.emails = account.emails.filter((item) => item.id !== email.id)
      changed()
    },
  }
}

function externalResource(external) {
  return {
    id: external.id,
    provider: external.provider,
    username: external.username,
    emailAddress: external.emailAddress,
    verification: { status: external.status, externalVerificationRedirectURL: null },
    reauthorize: async () => {
      await wait()
      external.status = 'verified'
      changed()
      return externalResource(external)
    },
    destroy: async () => {
      await wait()
      account.externalAccounts = account.externalAccounts.filter((item) => item.id !== external.id)
      changed()
    },
  }
}

function passkeyResource(passkey) {
  return {
    ...passkey,
    delete: async () => {
      await wait()
      account.passkeys = account.passkeys.filter((item) => item.id !== passkey.id)
      changed()
    },
  }
}

function buildUser() {
  const emailAddresses = account.emails.map(emailResource)
  return {
    id: 'user_review',
    fullName: account.fullName,
    username: account.username,
    imageUrl: account.imageUrl,
    primaryEmailAddressId: account.primaryEmailAddressId,
    primaryEmailAddress:
      emailAddresses.find((email) => email.id === account.primaryEmailAddressId) ?? null,
    emailAddresses,
    externalAccounts: account.externalAccounts.map(externalResource),
    passkeys: account.passkeys.map(passkeyResource),
    passwordEnabled: account.passwordEnabled,
    reload: async () => snapshot,
    update: async ({ username, primaryEmailAddressId }) => {
      await wait()
      if (username !== undefined) {
        if (!/^[a-z0-9_-]{4,64}$/i.test(username)) {
          throw clerkError(
            'form_username_invalid',
            'Usernames need 4 to 64 letters, numbers, dashes or underscores.',
          )
        }
        account.username = username
      }
      if (primaryEmailAddressId !== undefined) account.primaryEmailAddressId = primaryEmailAddressId
      changed()
      return snapshot
    },
    createEmailAddress: async ({ email }) => {
      await wait()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) {
        throw clerkError(
          'form_param_format_invalid',
          'Enter an email address like you@example.com.',
        )
      }
      if (account.emails.some((item) => item.emailAddress === email)) {
        throw clerkError('form_identifier_exists', 'That email address is already on your account.')
      }
      const created = { id: `email-${nextId++}`, emailAddress: email, status: 'unverified' }
      account.emails.push(created)
      changed()
      return emailResource(created)
    },
    createExternalAccount: async ({ strategy }) => {
      await wait()
      const provider = strategy.replace('oauth_', '')
      const name = { google: 'Google', github: 'GitHub' }[provider] ?? provider
      const created = {
        id: `ext-${nextId++}`,
        provider,
        username: 'riley-review',
        emailAddress: 'riley@example.com',
        status: 'verified',
      }
      account.externalAccounts.push(created)
      changed()
      toast(`Review mode: in production you’d approve this on ${name} and come back here.`)
      return externalResource(created)
    },
    updatePassword: async ({ newPassword, currentPassword }) => {
      await wait()
      if (account.passwordEnabled && !currentPassword) {
        throw clerkError('form_password_incorrect', 'Enter your current password.')
      }
      if ((newPassword ?? '').length < 8) {
        throw clerkError('form_password_length_too_short', 'Passwords need at least 8 characters.')
      }
      account.passwordEnabled = true
      changed()
      return snapshot
    },
    removePassword: async () => {
      await wait()
      account.passwordEnabled = false
      changed()
      return snapshot
    },
  }
}

export function useUser() {
  const user = useSyncExternalStore(subscribe, () => snapshot)
  return { isLoaded: true, isSignedIn: signedIn, user: signedIn ? user : null }
}

// Clerk asks you to confirm it's you before sensitive changes. Review mode
// never needs to, so the wrapped function runs as it is.
export function useReverification(fetcher) {
  return fetcher
}

export function useClerk() {
  return {
    signOut: async () => toast('Signed out (review mode keeps you signed in).'),
  }
}

export function SignInButton({ children }) {
  return children ?? <button className={buttonVariants()}>Sign in</button>
}

export function RedirectToSignIn() {
  return (
    <Navigate
      to="/sign-in"
      replace
    />
  )
}

function AuthPlaceholder({ title }) {
  return (
    <div className="w-full max-w-sm p-6 text-center surface-raised">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Clerk’s form shows here in production. Review mode doesn’t load Clerk.
      </p>
    </div>
  )
}

export function SignIn() {
  return <AuthPlaceholder title="Sign in" />
}

export function SignUp() {
  return <AuthPlaceholder title="Create your account" />
}
