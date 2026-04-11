'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { buildApiUrl } from '@/lib/config'
//import { useRouter } from 'next/navigation'

interface UserData {
  id: number
  email: string
  firstname: string
  lastname: string
  idverified: string | null
  dateofbirth?: string | null
  idbloburl?: string
  phone?: string
  address?: string
  role?: string
}

interface UseUserDataReturn {
  userData: UserData | null
  userId: number | null
  userRole: string | null
  isLoading: boolean
  isProfileComplete: boolean
  dateofbirth: string | null
  idbloburl: string | null
  idverified: string | null
  error: string | null
  refetchUserData: () => Promise<void>
  clearUserData: () => void
}

const USER_DATA_KEY = 'buysel_user_data'
const USER_DATA_EXPIRY_KEY = 'buysel_user_data_expiry'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const USER_DATA_INVALIDATION_EVENT = 'buysel_user_data_invalidated'

/**
 * Invalidate the user data cache globally
 * Call this after updating user data to force all components to refetch
 */
export function invalidateUserDataCache() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(USER_DATA_KEY)
  localStorage.removeItem(USER_DATA_EXPIRY_KEY)

  // Dispatch custom event to notify all useUserData hooks
  window.dispatchEvent(new CustomEvent(USER_DATA_INVALIDATION_EVENT))

  console.log('User data cache invalidated globally')
}

export function useUserData(): UseUserDataReturn {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  //const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user?.email) {
      clearUserData()
      setIsLoading(false)
      return
    }

    // Check localStorage first
    const cachedData = localStorage.getItem(USER_DATA_KEY)
    const cachedExpiry = localStorage.getItem(USER_DATA_EXPIRY_KEY)

    if (cachedData && cachedExpiry) {
      const expiry = parseInt(cachedExpiry)
      const now = Date.now()

      if (now < expiry) {
        try {
          const parsedData = JSON.parse(cachedData)
          // Verify the cached data is for the current user
          if (parsedData.email === user.email) {
            console.log('Using cached user data for:', parsedData.email)
            setUserData(parsedData)
            setIsLoading(false)
            return
          }
        } catch (e) {
          console.error('Error parsing cached user data:', e)
        }
      }
    }

    // If no valid cache, fetch from API
    fetchUserData()
  }, [user?.email, isAuthenticated, authLoading])

  const fetchUserData = useCallback(async () => {
    if (!user?.email) {
      setError('No user email found')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching user data for:', user.email)
      const response = await fetch(buildApiUrl(`/api/user/email/${encodeURIComponent(user.email)}`))
      
      if (!response.ok) {
        if (response.status === 404) {
          // User profile doesn't exist
          console.log('User profile not found, needs to be created')
          setUserData(null)
          setIsLoading(false)
          return
        }
        throw new Error(`Failed to fetch user data: ${response.status}`)
      }

      const data = await response.json()
      
      // Store in localStorage with expiry
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data))
      localStorage.setItem(USER_DATA_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString())
      
      console.log('User data fetched and cached:', data)
      setUserData(data)
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.email])

  const refetchUserData = useCallback(async () => {
    // Clear cache and refetch
    localStorage.removeItem(USER_DATA_KEY)
    localStorage.removeItem(USER_DATA_EXPIRY_KEY)
    await fetchUserData()
  }, [fetchUserData])

  const clearUserData = useCallback(() => {
    localStorage.removeItem(USER_DATA_KEY)
    localStorage.removeItem(USER_DATA_EXPIRY_KEY)
    setUserData(null)
    setError(null)
  }, [])

  // Listen for cache invalidation events
  useEffect(() => {
    const handleInvalidation = () => {
      console.log('Cache invalidation event received, refetching user data')
      fetchUserData()
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_DATA_KEY && !e.newValue) {
        // Cache was cleared, reset state
        setUserData(null)
      }
    }

    window.addEventListener(USER_DATA_INVALIDATION_EVENT, handleInvalidation)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(USER_DATA_INVALIDATION_EVENT, handleInvalidation)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchUserData])

  const isProfileComplete = userData ? 
    !!(userData.firstname && userData.lastname) : 
    false

  return {
    userData,
    userId: userData?.id || null,
    userRole: userData?.role || null,
    isLoading,
    isProfileComplete,
    dateofbirth: userData?.dateofbirth || null,
    idbloburl: userData?.idbloburl || null,
    idverified: userData?.idverified || null,
    error,
    refetchUserData,
    clearUserData
  }
}