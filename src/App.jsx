import { RedirectToSignIn, Show, SignIn, SignUp } from '@clerk/react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'

import { Dashboard } from '@/pages/Dashboard'
import { DevicePage } from '@/pages/DevicePage'
import { DeviceSettingsPage } from '@/pages/DeviceSettingsPage'
import { PublicDevicePage } from '@/pages/PublicDevicePage'
import { LandingPage } from '@/pages/LandingPage'
import { PublicMapPage } from '@/pages/PublicMapPage'
import { Toaster } from '@/components/ui/sonner'

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
      <Toaster
        richColors
        position="bottom-right"
      />
    </>
  )
}
