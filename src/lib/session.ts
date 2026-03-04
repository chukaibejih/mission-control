import { SessionOptions } from 'iron-session'

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'mission-control-secret-change-me-32chars!!',
  cookieName: 'mc_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
}

export interface SessionData {
  isLoggedIn?: boolean
}
