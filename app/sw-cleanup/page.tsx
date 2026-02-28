"use client";

import { useEffect } from 'react'
import { usePageView } from '@/hooks/useAudit'

export default function ServiceWorkerCleanup() {
  usePageView('sw-cleanup')
  useEffect(() => {
    async function cleanup() {
      console.log('🧹 Starting service worker cleanup...')

      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()

          if (registrations.length > 0) {
            console.log('🧹 Found', registrations.length, 'service worker(s) to unregister')

            // Unregister all service workers
            await Promise.all(
              registrations.map(reg => {
                console.log('🧹 Unregistering:', reg.scope)
                return reg.unregister()
              })
            )

            console.log('✅ All service workers unregistered')

            // Clear all caches
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
            console.log('✅ All caches cleared')

            // Clear all cookies except the cleanup cookie
            const cookies = document.cookie.split(';')
            for (let cookie of cookies) {
              const eqPos = cookie.indexOf('=')
              const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
              if (name !== 'sw-cleanup-done') {
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
              }
            }
            console.log('✅ All cookies cleared (except cleanup marker)')

            // Clear localStorage and sessionStorage
            try {
              localStorage.clear()
              sessionStorage.clear()
              console.log('✅ Local/session storage cleared')
            } catch (e) {
              console.warn('Could not clear storage:', e)
            }

            // Set cookie to indicate cleanup is done
            document.cookie = 'sw-cleanup-done=true; path=/; max-age=31536000; SameSite=Lax'

            // Wait a moment, then redirect to home
            setTimeout(() => {
              console.log('✅ Redirecting to home page...')
              window.location.href = '/'
            }, 1000)
          } else {
            console.log('✅ No service workers found, redirecting...')
            // Set cookie and redirect
            document.cookie = 'sw-cleanup-done=true; path=/; max-age=31536000; SameSite=Lax'
            setTimeout(() => {
              window.location.href = '/'
            }, 500)
          }
        } catch (error) {
          console.error('❌ Error during cleanup:', error)
          // Set cookie and redirect anyway
          document.cookie = 'sw-cleanup-done=true; path=/; max-age=31536000; SameSite=Lax'
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        }
      } else {
        console.log('✅ Service workers not supported, redirecting...')
        document.cookie = 'sw-cleanup-done=true; path=/; max-age=31536000; SameSite=Lax'
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      }
    }

    cleanup()
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '500px'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>🔧</div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#111827'
        }}>
          Updating BuySel...
        </h1>
        <p style={{
          color: '#6b7280',
          marginBottom: '1rem'
        }}>
          We're applying important updates to improve your experience.
        </p>
        <p style={{
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          This will only take a moment...
        </p>
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#ff6600',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  )
}
