import { useEffect, useState } from 'react'

import { listPublicMapDevices } from '@/lib/api'
import { nextMapState } from '@/lib/map'

const REFRESH_MS = 5 * 60 * 1000

const LOADING = { devices: [], state: 'loading', error: null }

export function usePublicMapDevices() {
  const [map, setMap] = useState(LOADING)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load(background = false) {
      if (!background) setMap((prev) => ({ ...prev, state: 'loading' }))
      let result
      try {
        result = { devices: await listPublicMapDevices() }
      } catch (err) {
        result = { error: err.message }
      }
      if (active) setMap((prev) => nextMapState(prev, result, background))
    }
    load()
    const interval = window.setInterval(() => load(true), REFRESH_MS)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [reloadKey])

  return { ...map, retry: () => setReloadKey((key) => key + 1) }
}
