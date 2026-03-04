import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PASSWORD = process.env.MC_PASSWORD || 'changeme'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('mc_auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return response
}
