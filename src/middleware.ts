import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('mc_auth')?.value
  const { pathname } = req.nextUrl

  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api/login')

  if (!auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (auth && pathname === '/') {
    return NextResponse.redirect(new URL('/tasks', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
