'use client'
import { useEffect, useCallback, useRef } from 'react'

export function useSSE(onEvent: (resource: string) => void) {
  const handlerRef = useRef(onEvent)

  useEffect(() => {
    handlerRef.current = onEvent
  }, [onEvent])

  const connect = useCallback(() => {
    const es = new EventSource('/api/events')
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload?.resource) handlerRef.current(payload.resource)
      } catch {}
    }
    es.onerror = () => {
      es.close()
      setTimeout(connect, 5000)
    }
    return es
  }, [])

  useEffect(() => {
    const es = connect()
    return () => es.close()
  }, [connect])
}
