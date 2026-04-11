export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const configuredToken = process.env.DEBUG_ENV_TOKEN
  const requestToken = req.headers.get('x-debug-token')

  if (isProduction && (!configuredToken || requestToken !== configuredToken)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only show in development or with proper auth
  const envVars = {
    NEXT_PUBLIC_AZUREBLOB_SASTOKEN: process.env.NEXT_PUBLIC_AZUREBLOB_SASTOKEN ? 'SET (hidden)' : 'NOT SET',
    NEXT_PUBLIC_AZUREBLOB_SASURL_BASE: process.env.NEXT_PUBLIC_AZUREBLOB_SASURL_BASE || 'NOT SET',
    NEXT_PUBLIC_AZUREBLOB_CONTAINER: process.env.NEXT_PUBLIC_AZUREBLOB_CONTAINER || 'NOT SET',
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
