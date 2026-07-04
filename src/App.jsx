import { Route, Routes } from 'react-router-dom'

import { Dashboard } from '@/pages/Dashboard'
import { DevicePage } from '@/pages/DevicePage'
import { DeviceSettingsPage } from '@/pages/DeviceSettingsPage'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/devices/:id" element={<DevicePage />} />
        <Route path="/devices/:id/settings" element={<DeviceSettingsPage />} />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </>
  )
}

export default App
