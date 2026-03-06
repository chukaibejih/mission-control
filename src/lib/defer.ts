type IdleCancel = () => void

type IdleFn = (deadline: IdleDeadline) => void

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: IdleFn, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

/**
 * Run a callback once the browser is idle (or after a timeout fallback).
 * Returns a cancel function for cleanup on unmount.
 */
export function deferToIdle(callback: () => void, timeout = 1200): IdleCancel {
  let active = true

  const run = () => {
    if (!active) return
    callback()
  }

  if (typeof window === 'undefined') {
    const timer = setTimeout(run, timeout)
    return () => { active = false; clearTimeout(timer) }
  }

  const w = window as IdleCapableWindow
  if (w.requestIdleCallback) {
    const handle = w.requestIdleCallback(run, { timeout })
    return () => {
      active = false
      w.cancelIdleCallback?.(handle)
    }
  }

  const timer = window.setTimeout(run, timeout)
  return () => {
    active = false
    window.clearTimeout(timer)
  }
}
