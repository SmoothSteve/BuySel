import { NextResponse } from 'next/server'

const PACKAGE_NAME = 'com.buysel.app'

function parseFingerprints(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean)
}

export function GET() {
  const fingerprints = parseFingerprints(process.env.ASSETLINKS_SHA256_FINGERPRINTS)

  if (fingerprints.length === 0) {
    return NextResponse.json(
      {
        error: 'ASSETLINKS_SHA256_FINGERPRINTS is not configured',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  )
}
