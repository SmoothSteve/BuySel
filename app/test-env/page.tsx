'use client'

import { useEffect, useState } from 'react'
import { usePageView } from '@/hooks/useAudit'

export default function TestEnvPage() {
  usePageView('test-env')
  const [runtimeEnv, setRuntimeEnv] = useState<Record<string, string>>({})

  useEffect(() => {
    // Get runtime environment variables
    const env = {
      NEXT_PUBLIC_GOOGLE_MAP_API: process.env.NEXT_PUBLIC_GOOGLE_MAP_API || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET: process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET || 'NOT SET',
    }
    setRuntimeEnv(env)
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Build-time Environment Variables:</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex">
            <span className="font-bold w-80">NEXT_PUBLIC_GOOGLE_MAP_API:</span>
            <span className={process.env.NEXT_PUBLIC_GOOGLE_MAP_API ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_GOOGLE_MAP_API ? 
                `${process.env.NEXT_PUBLIC_GOOGLE_MAP_API.substring(0, 10)}...` : 
                'NOT SET'}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold w-80">NEXT_PUBLIC_SUPABASE_URL:</span>
            <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold w-80">NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET:</span>
            <span className={process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET || 'NOT SET'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Runtime Check:</h2>
        <div className="space-y-2 font-mono text-sm">
          {Object.entries(runtimeEnv).map(([key, value]) => (
            <div key={key} className="flex">
              <span className="font-bold w-80">{key}:</span>
              <span className={value !== 'NOT SET' ? 'text-green-600' : 'text-red-600'}>
                {value !== 'NOT SET' && value.length > 20 ? `${value.substring(0, 20)}...` : value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Notes:</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>NEXT_PUBLIC_* variables must be available at build time</li>
          <li>They are embedded into the JavaScript bundle during build</li>
          <li>Changing them after deployment requires rebuilding the app</li>
          <li>Non-NEXT_PUBLIC variables are only available server-side</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
        <p className="text-sm">
          <strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
        </p>
      </div>
    </div>
  )
}
