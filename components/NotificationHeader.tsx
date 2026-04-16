'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserData } from '@/hooks/useUserData'
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/push-notifications'

interface NotificationHeaderProps {
  onOpenChat?: (propertyId: number, conversationId?: string) => void | Promise<void>
}

export default function NotificationHeader({ onOpenChat }: NotificationHeaderProps) {
  void onOpenChat
  const { isAuthenticated } = useAuth()
  const { userId, isLoading: userDataLoading } = useUserData()
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isEnabling, setIsEnabling] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    if (userDataLoading || !userId) {
      return
    }

    // Check if already subscribed (stored in localStorage)
    const alreadySubscribed = localStorage.getItem('push-notifications-enabled')
    if (alreadySubscribed === 'true') {
      console.log('[NotificationHeader] Already subscribed, hiding banner')
      setShowPermissionBanner(false)
      setIsSubscribed(true)
      return
    }

    // Check notification permission status
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        // Show banner to request permission
        setShowPermissionBanner(true)
      } else if (Notification.permission === 'granted' && !isSubscribed) {
        // Auto-subscribe if permission already granted, but wait for service worker to be ready
        console.log('[NotificationHeader] Permission already granted, waiting for service worker to be ready...')

        // Wait for service worker to be ready before subscribing
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then(() => {
              console.log('[NotificationHeader] Service worker ready, auto-subscribing...')
              handleEnableNotifications()
            })
            .catch((error) => {
              console.error('[NotificationHeader] Service worker ready check failed:', error)
            })
        }
      }
    }
  }, [isAuthenticated, isSubscribed, userId, userDataLoading])

  const handleEnableNotifications = async () => {
    console.log('[NotificationHeader] Requesting notification permission')
    setIsEnabling(true)

    // Set a safety timeout to ensure button doesn't get stuck (30 seconds for service worker registration)
    const safetyTimeout = setTimeout(() => {
      console.error('[NotificationHeader] Operation timed out after 30 seconds')
      setIsEnabling(false)
      alert('The operation took too long. This may be due to a slow service worker registration. Please refresh the page and try again.')
    }, 30000)

    try {
      const permissionGranted = await requestNotificationPermission()

      if (permissionGranted) {
        console.log('[NotificationHeader] Permission granted, subscribing to push')
        const subscribed = await subscribeToPushNotifications()

        // Clear timeout immediately after successful subscription
        clearTimeout(safetyTimeout)

        setIsSubscribed(subscribed)
        if (subscribed) {
          // Store subscription status
          localStorage.setItem('push-notifications-enabled', 'true')
          console.log('[NotificationHeader] Successfully subscribed! Showing success message')

          // Show success message for 3 seconds
          setShowSuccess(true)
          setTimeout(() => {
            setShowSuccess(false)
            setShowPermissionBanner(false)
          }, 3000)
        } else {
          console.error('[NotificationHeader] Subscription failed')
          alert('Failed to subscribe to push notifications. Please try again.')
        }
      } else {
        console.warn('[NotificationHeader] Permission denied')
        clearTimeout(safetyTimeout)
        alert('Notification permission was denied. To enable notifications, please allow them in your browser settings.')
      }
    } catch (error) {
      console.error('[NotificationHeader] Error enabling notifications:', error)
      clearTimeout(safetyTimeout)
      alert('Failed to enable notifications. Please try again or check your browser settings.')
    } finally {
      clearTimeout(safetyTimeout)
      setIsEnabling(false)
    }
  }

  const handleDismissBanner = () => {
    setShowPermissionBanner(false)
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('notification-banner-dismissed', Date.now().toString())
  }

  // Check if banner was recently dismissed
  useEffect(() => {
    if (!isAuthenticated) return
    const dismissedAt = localStorage.getItem('notification-banner-dismissed')
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        // Don't show banner if dismissed within last 7 days
        setShowPermissionBanner(false)
      }
    }
  }, [isAuthenticated])

  if (!showPermissionBanner && !showSuccess) return null

  return (
    <>
      {/* Spacer to push content down */}
      <div className="h-14" />

      {showSuccess ? (
        // Success Banner
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white shadow-md animate-in slide-in-from-top">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold text-lg">Push Notifications Enabled!</p>
                <p className="text-sm text-green-100">
                  You&apos;ll now receive notifications for new messages
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Permission Request Banner
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Enable Push Notifications</p>
                  <p className="text-sm text-blue-100">
                    Get notified instantly when you receive messages, even when the app is closed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleEnableNotifications}
                  disabled={isEnabling}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEnabling ? 'Enabling...' : 'Enable'}
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="p-2 hover:bg-blue-700 rounded transition-colors"
                  title="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
