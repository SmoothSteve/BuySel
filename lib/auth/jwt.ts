import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload as JoseJWTPayload } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const JWT_ISSUER = 'buysel-app'
const JWT_AUDIENCE = 'buysel-api'

export interface JWTPayload extends JoseJWTPayload {
  sub: string // user id
  email: string
  name: string
  role?: string
  provider: string
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('1h') // Token expires in 1 hour
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}
