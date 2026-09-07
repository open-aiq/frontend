import { useEffect, useState } from 'react'

import { listPublicMapDevices } from '@/lib/api'

const REFRESH_MS = 5 * 60 * 1000

export function usePublicMapDevices() {
  const [devices, setDevices] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load(background = false) {
      if (!background) setState('loading')
      try {
        const data = await listPublicMapDevices()
        if (!active) return
        setDevices(data)
        setError(null)
        setState('ready')
      } catch (err) {
        if (!active) return
        setDevices([])
        setError(err.message)
        if (!background) setState('error')
      }
    }
    load()
    const interval = window.setInterval(() => load(true), REFRESH_MS)
    return () => { active = false; window.clearInterval(interval) }
  }, [reloadKey])

  return { devices, state, error, retry: () => setReloadKey((key) => key + 1) }
}
