'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { buildApiUrl } from '@/lib/config'

interface AuditParams {
  page: string
  action: string
  propertyid?: number
}

interface AuditPayload {
  ipaddress: string
  id: number
  action: string
  page: string
  username: string
  dte: string
  propertyid: number
}

/**
 * Get the user's IP address
 * This uses a free IP lookup service
 */
async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch (error) {
    console.error('Failed to get IP address:', error)
    return 'unknown'
  }
}

/**
 * Hook to track user actions for audit purposes
 * Automatically logs page views and actions to the audit API
 */
export function useAudit() {
  const { user } = useAuth()
  const ipAddressRef = useRef<string | null>(null)

  // Fetch IP address once when hook is initialized
  useEffect(() => {
    if (!ipAddressRef.current) {
      getIPAddress().then(ip => {
        ipAddressRef.current = ip
      })
    }
  }, [])

  const logAudit = useCallback(async ({ page, action, propertyid }: AuditParams) => {
    try {
      // Get IP address (use cached if available)
      const ipaddress = ipAddressRef.current || await getIPAddress()

      // Cache IP for future calls
      if (!ipAddressRef.current) {
        ipAddressRef.current = ipaddress
      }

      const payload: AuditPayload = {
        ipaddress,
        id: 0,
        action,
        page,
        username: user?.email || 'anonymous',
        dte: new Date().toISOString(),
        propertyid: propertyid || 0
      }

      const response = await fetch(buildApiUrl('/api/audit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.error('Audit log failed:', response.status, response.statusText)
      }
    } catch (error) {
      // Don't throw errors from audit logging - fail silently
      console.error('Error logging audit:', error)
    }
  }, [user?.email])

  return { logAudit }
}

/**
 * Hook to automatically log page views
 * Call this at the top of any page component to track visits
 */
export function usePageView(page: string, propertyid?: number) {
  const { user, isLoading } = useAuth()
  const { logAudit } = useAudit()
  const hasLoggedRef = useRef(false)

  useEffect(() => {
    // Wait for auth to finish loading before logging
    // This ensures we capture the actual user email instead of 'anonymous'
    // when the user is logged in but the session is still loading
    if (!isLoading && !hasLoggedRef.current) {
      logAudit({ page, action: 'view', propertyid })
      hasLoggedRef.current = true
    }
  }, [page, propertyid, logAudit, user, isLoading])

  return { logAudit }
}
