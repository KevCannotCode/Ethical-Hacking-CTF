// Polls race state and keeps a local clock so the timer ticks smoothly between polls.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { fetchState } from '@/adapters/index.js'

export function useRaceState(intervalMs) {
  const [state, setState] = useState(null)
  const clock = useRef({ elapsed: 0, at: performance.now() })

  const refresh = useCallback(async () => {
    try {
      const s = await fetchState()
      clock.current = { elapsed: s.elapsed, at: performance.now() }
      setState(s)
    } catch { /* server away — keep the last good screen */ }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  const elapsedNow = useCallback(() => clock.current.elapsed + (performance.now() - clock.current.at) / 1000, [])
  return { state, refresh, elapsedNow }
}

// Re-renders the caller every `ms` while enabled (clock and chart animation).
export function useTick(ms, enabled) {
  const [, force] = useReducer((n) => n + 1, 0)
  useEffect(() => {
    if (!enabled) return undefined
    const id = setInterval(force, ms)
    return () => clearInterval(id)
  }, [ms, enabled])
}
