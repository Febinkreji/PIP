import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, durationMs = 1000) {
  const [value, setValue] = useState(0)
  const startTimeRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    startTimeRef.current = null

    function step(timestamp) {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / durationMs, 1)
      setValue(target * progress)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    // requestAnimationFrame is paused (not just throttled) while the tab is
    // hidden in most browsers. Rather than leaving the value frozen at a
    // partial (or zero) amount indefinitely, show the final value right away.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      setValue(target)
      return undefined
    }

    rafRef.current = requestAnimationFrame(step)

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        setValue(target)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [target, durationMs])

  return value
}
