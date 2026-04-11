'use client'

import { Seller } from '@/types/seller'
import { useState, useEffect, useCallback } from 'react'
import { buildApiUrl } from '@/lib/config'

/*interface UserData {
  id: number
  email: string
  firstname: string
  lastname: string
  idverified?: boolean
  phone?: string
  address?: string
  mobile?: string
  [key: string]: any
}*/

const USER_CACHE_KEY_PREFIX = 'buysel_user_cache_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Global in-memory cache for the current session
const memoryCache = new Map<number, Seller>()

export function useUserCache() {
  const getCachedUser = useCallback((userId: number): Seller | null => {
    // Check memory cache first
    if (memoryCache.has(userId)) {
      console.log(`User ${userId} found in memory cache`)
      return memoryCache.get(userId)!
    }

    // Check localStorage
    const cacheKey = `${USER_CACHE_KEY_PREFIX}${userId}`
    const cachedData = localStorage.getItem(cacheKey)
    const cachedExpiry = localStorage.getItem(`${cacheKey}_expiry`)
    
    if (cachedData && cachedExpiry) {
      const expiry = parseInt(cachedExpiry)
      const now = Date.now()
      
      if (now < expiry) {
        try {
          const userData = JSON.parse(cachedData)
          console.log(`User ${userId} found in localStorage cache`)
          // Also store in memory cache
          memoryCache.set(userId, userData)
          return userData
        } catch (e) {
          console.error('Error parsing cached user data:', e)
          // Clear invalid cache
          localStorage.removeItem(cacheKey)
          localStorage.removeItem(`${cacheKey}_expiry`)
        }
      } else {
        // Cache expired, clear it
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(`${cacheKey}_expiry`)
      }
    }
    
    return null
  }, [])

  const setCachedUser = useCallback((userId: number, userData: UserData) => {
    const cacheKey = `${USER_CACHE_KEY_PREFIX}${userId}`
    
    // Store in both memory and localStorage
    memoryCache.set(userId, userData)
    localStorage.setItem(cacheKey, JSON.stringify(userData))
    localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + CACHE_DURATION).toString())
    
    console.log(`User ${userId} cached successfully`)
  }, [])

  const fetchUser = useCallback(async (userId: number): Promise<UserData | null> => {
    // Check cache first
    const cached = getCachedUser(userId)
    if (cached) {
      return cached
    }

    // Fetch from API
    try {
      console.log(`Fetching user ${userId} from API`)
      const response = await fetch(buildApiUrl(`/api/user/${userId}`))
      
      if (!response.ok) {
        console.error(`Failed to fetch user ${userId}: ${response.status}`)
        return null
      }

      const userData = await response.json()
      
      // Cache the result
      setCachedUser(userId, userData)
      
      return userData
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error)
      return null
    }
  }, [getCachedUser, setCachedUser])

  const clearUserCache = useCallback((userId?: number) => {
    if (userId) {
      // Clear specific user
      memoryCache.delete(userId)
      const cacheKey = `${USER_CACHE_KEY_PREFIX}${userId}`
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(`${cacheKey}_expiry`)
    } else {
      // Clear all users
      memoryCache.clear()
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(USER_CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [])

  return {
    getCachedUser,
    setCachedUser,
    fetchUser,
    clearUserCache
  }
}