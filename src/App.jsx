import { lazy, Suspense } from 'react'
import { RedirectToSignIn, Show, SignIn, SignUp } from '@clerk/react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'

const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })),
)
const DevicePage = lazy(() =>
  import('@/pages/DevicePage').then(({ DevicePage }) => ({ default: DevicePage })),
)
const DeviceSettingsPage = lazy(() =>
  import('@/pages/DeviceSettingsPage').then(({ DeviceSettingsPage }) => ({
    default: DeviceSettingsPage,
  })),
)
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then(({ LandingPage }) => ({ default: LandingPage })),
)
const PublicDevicePage = lazy(() =>
  import('@/pages/PublicDevicePage').then(({ PublicDevicePage }) => ({
    default: PublicDevicePage,
  })),
)
const PublicMapPage = lazy(() =>
  import('@/pages/PublicMapPage').then(({ PublicMapPage }) => ({ default: PublicMapPage })),
)

function RouteFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-background">
      <span className="text-sm text-muted-foreground">Loading…</span>
    </main>
  )
}

function Private({ children }) {
  const location = useLocation()
  const redirectUrl = `${location.pathname}${location.search}`
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <RedirectToSignIn redirectUrl={redirectUrl} />
      </Show>
    </>
  )
}

function AuthPage({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {children}
    </main>
  )
}

function LegacyPublicDeviceRedirect() {
  const { id } = useParams()
  return (
    <Navigate
      to={`/devices/${id}`}
      replace
    />
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/sign-in/*"
            element={
              <AuthPage>
                <SignIn />
              </AuthPage>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <AuthPage>
                <SignUp />
              </AuthPage>
            }
          />
          <Route
            path="/"
            element={<LandingPage />}
          />
          <Route
            path="/map"
            element={<PublicMapPage />}
          />
          <Route
            path="/devices/:id"
            element={<PublicDevicePage />}
          />
          <Route
            path="/public"
            element={
              <Navigate
                to="/map"
                replace
              />
            }
          />
          <Route
            path="/public/devices/:id"
            element={<LegacyPublicDeviceRedirect />}
          />
          <Route
            path="/app"
            element={
              <Private>
                <Dashboard />
              </Private>
            }
          />
          <Route
            path="/app/devices/:id"
            element={
              <Private>
                <DevicePage />
              </Private>
            }
          />
          <Route
            path="/app/devices/:id/settings"
            element={
              <Private>
                <DeviceSettingsPage />
              </Private>
            }
          />
        </Routes>
      </Suspense>
      <Toaster
        richColors
        position="bottom-right"
      />
    </>
  )
}
