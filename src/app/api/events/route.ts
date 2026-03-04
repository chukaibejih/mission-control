import { NextRequest } from 'next/server'

const BASE = process.env.CLAWD_API_URL || 'http://127.0.0.1:4310'
const KEY  = process.env.CLAWD_API_KEY  || 'mission-control-dev-key'

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const upstream = await fetch(`${BASE}/events`, {
          headers: { 'x-api-key': KEY },
        })
        const reader = upstream.body?.getReader()
        if (!reader) { controller.close(); return }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      } catch {
        // Reconnect handled client-side
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
