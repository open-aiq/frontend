// Review-mode stand-in for @clerk/react. vite.config.js aliases the package to
// this file only under `--mode review`. It provides exactly the pieces the app
// uses, with a fake signed-in user (or signed out, per the scenario), so pages
// render without a Clerk key or network.
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

const reviewUser = {
  fullName: 'Riley Review',
  username: 'riley',
  imageUrl: null,
  primaryEmailAddress: { emailAddress: 'riley@example.com' },
}

export function useUser() {
  return { isLoaded: true, isSignedIn: signedIn, user: signedIn ? reviewUser : null }
}

export function useClerk() {
  return {
    openUserProfile: () => toast('Clerk’s account page opens here in production.'),
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
