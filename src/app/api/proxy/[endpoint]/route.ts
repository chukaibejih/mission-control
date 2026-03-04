import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.CLAWD_API_URL || 'http://127.0.0.1:4310'
const KEY  = process.env.CLAWD_API_KEY  || 'mission-control-dev-key'

export async function GET(
  req: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  try {
    const res = await fetch(`${BASE}/${params.endpoint}`, {
      headers: { 'x-api-key': KEY },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Clawd API unreachable', data: [] }, { status: 503 })
  }
}
