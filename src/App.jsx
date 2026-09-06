import { RedirectToSignIn, Show, SignIn, SignUp } from '@clerk/react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { Dashboard } from '@/pages/Dashboard'
import { DevicePage } from '@/pages/DevicePage'
import { DeviceSettingsPage } from '@/pages/DeviceSettingsPage'
import { PublicDevicesPage } from '@/pages/PublicDevicesPage'
import { PublicDevicePage } from '@/pages/PublicDevicePage'
import { Toaster } from '@/components/ui/sonner'

function Private({ children }) {
  const location = useLocation()
  const redirectUrl = `${location.pathname}${location.search}`
  return <><Show when="signed-in">{children}</Show><Show when="signed-out"><RedirectToSignIn redirectUrl={redirectUrl} /></Show></>
}

function AuthPage({ children }) {
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">{children}</main>
}

export default function App() {
  return <>
    <Routes>
      <Route path="/sign-in/*" element={<AuthPage><SignIn /></AuthPage>} />
      <Route path="/sign-up/*" element={<AuthPage><SignUp /></AuthPage>} />
      <Route path="/public" element={<PublicDevicesPage />} />
      <Route path="/public/devices/:id" element={<PublicDevicePage />} />
      <Route path="/" element={<Private><Dashboard /></Private>} />
      <Route path="/devices/:id" element={<Private><DevicePage /></Private>} />
      <Route path="/devices/:id/settings" element={<Private><DeviceSettingsPage /></Private>} />
    </Routes>
    <Toaster richColors position="bottom-right" />
  </>
}
