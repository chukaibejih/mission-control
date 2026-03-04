'use client'
import { useEffect, useCallback } from 'react'

export function useSSE(onEvent: (resource: string) => void) {
  const connect = useCallback(() => {
    const es = new EventSource('/api/events')
    es.onmessage = (e) => {
      try { onEvent(JSON.parse(e.data).resource) } catch {}
    }
    es.onerror = () => { es.close(); setTimeout(connect, 5000) }
    return es
  }, [onEvent])

  useEffect(() => {
    const es = connect()
    return () => es.close()
  }, [connect])
}
