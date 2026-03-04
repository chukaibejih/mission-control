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


export async function POST(
  req: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  try {
    const body = await req.text()
    const res = await fetch(`${BASE}/${params.endpoint}`, {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: 'Clawd API unreachable' }, { status: 503 })
  }
}

