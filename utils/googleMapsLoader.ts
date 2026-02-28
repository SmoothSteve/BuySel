"use client";

let isLoading = false
let isLoaded = false
const callbacks: Array<() => void> = []

export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve) => {
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
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API}&libraries=places`
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