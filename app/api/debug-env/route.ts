export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const configuredToken = process.env.DEBUG_ENV_TOKEN
  const requestToken = req.headers.get('x-debug-token')

  if (!configuredToken || requestToken !== configuredToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only show in development or with proper auth
  const envVars = {
    SUPABASE_PROFILE_BUCKET: process.env.SUPABASE_PROFILE_BUCKET || 'NOT SET',
    NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET: process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET || 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    NEXT_PUBLIC_GOOGLE_MAP_API: process.env.NEXT_PUBLIC_GOOGLE_MAP_API ? 'SET (hidden)' : 'NOT SET',
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY || 'NOT SET',
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  }
  
  return NextResponse.json({
    message: 'Environment variables check',
    envVars
  })
}
