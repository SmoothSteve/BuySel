"use client";

let isLoading = false
let isLoaded = false
const callbacks: Array<() => void> = []
const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api/js'
let hasLoggedMissingApiKey = false

const getMapsApiKey = (): string => process.env.NEXT_PUBLIC_GOOGLE_MAP_API || ''

export const buildGoogleMapsScriptUrl = (libraries: string[] = []): string => {
  const params = new URLSearchParams()
  params.set('key', getMapsApiKey())
  params.set('loading', 'async')
  params.set('v', 'weekly')

  if (libraries.length > 0) {
    params.set('libraries', libraries.join(','))
  }

  return `${MAPS_BASE_URL}?${params.toString()}`
}

export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const apiKey = getMapsApiKey()
    if (!apiKey) {
      const error = 'Google Maps API key is missing (NEXT_PUBLIC_GOOGLE_MAP_API)'
      if (!hasLoggedMissingApiKey) {
        console.warn(error)
        hasLoggedMissingApiKey = true
      }
      reject(new Error(error))
      return
    }

    // If already loaded, resolve immediately
    if (isLoaded || window.google?.maps?.places) {
      isLoaded = true
      resolve()
      return
    }

    // If currently loading, add callback to queue
    if (isLoading) {
      callbacks.push(resolve)
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
    if (existingScript) {
      // Script exists, wait for it to load
      callbacks.push(resolve)
      existingScript.addEventListener('load', () => {
        isLoaded = true
        isLoading = false
        callbacks.forEach(cb => cb())
        callbacks.length = 0
      })
      return
    }

    // Start loading
    isLoading = true
    callbacks.push(resolve)

    const script = document.createElement('script')
    script.src = buildGoogleMapsScriptUrl(['places'])
    script.async = true
    script.defer = true
    
    script.onload = () => {
      isLoaded = true
      isLoading = false
      callbacks.forEach(cb => cb())
      callbacks.length = 0
    }

    script.onerror = () => {
      isLoading = false
      callbacks.length = 0
      console.error('Failed to load Google Maps script')
    }

    document.head.appendChild(script)
  })
}
