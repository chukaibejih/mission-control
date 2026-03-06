import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.CLAWD_API_URL || 'http://127.0.0.1:4310'
const KEY  = process.env.CLAWD_API_KEY  || 'mission-control-dev-key'

export async function GET(
  req: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  const target = params.endpoint.join('/')
  try {
    const res = await fetch(`${BASE}/${target}`, {
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
  { params }: { params: { endpoint: string[] } }
) {
  const target = params.endpoint.join('/')
  try {
    const body = await req.text()
    const res = await fetch(`${BASE}/${target}`, {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  const target = params.endpoint.join('/')
  try {
    const body = await req.text()
    const res = await fetch(`${BASE}/${target}`, {
      method: 'PATCH',
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: 'Clawd API unreachable' }, { status: 503 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  const target = params.endpoint.join('/')
  try {
    const res = await fetch(`${BASE}/${target}`, {
      method: 'DELETE',
      headers: { 'x-api-key': KEY },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: 'Clawd API unreachable' }, { status: 503 })
  }
}

