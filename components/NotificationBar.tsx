'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X } from 'lucide-react'
import Pusher from 'pusher-js'
import { useAuth } from '@/hooks/useAuth'
import { useTimezoneCorrection } from '@/hooks/useTimezoneCorrection'
import { buildApiUrl } from '@/lib/config'
interface Notification {
  id: string
  conversationId: string
  propertyId: number
  propertyTitle: string
  senderName: string
  message: string
  timestamp: Date
}

interface NotificationBarProps {
  onOpenChat: (propertyId: number, conversationId?: string) => void
}

export default function NotificationBar({ onOpenChat }: NotificationBarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const { user } = useAuth()
  const pusherRef = useRef<Pusher | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const correctDateForTimezone = useTimezoneCorrection()
  useEffect(() => {
    if (!user?.id) return

    // Initialize audio for notification sound
    audioRef.current = new Audio('/notification.mp3')
    audioRef.current.volume = 0.5

    // Initialize Pusher for global notifications
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      })
    }

    const numericUserId = Number(user.id)
    if (!Number.isNaN(numericUserId)) {
      subscribeToNotifications(numericUserId)
    }

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`user-notifications-${user.id}`)
      }
    }
  }, [user])

  const subscribeToNotifications = (userId: number) => {
    console.log('NotificationBar: Subscribing to channel:', `user-notifications-${userId}`)
    const channel = pusherRef.current!.subscribe(`user-notifications-${userId}`)
    
    channel.bind('new-message', async (data: {
      conversationId: string
      propertyId: number
      senderName?: string
      message: string
    }) => {
      console.log('NotificationBar: Notification received:', data)
      
      // Fetch property details
      try {
        const propResponse = await fetch(buildApiUrl(`/api/property/${data.propertyId}`))
        const property = await propResponse.json()
        
        const notification: Notification = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conversationId: data.conversationId,
          propertyId: data.propertyId,
          propertyTitle: property.title || 'Property',
          senderName: data.senderName || 'Someone',
          message: data.message,
          timestamp: correctDateForTimezone(new Date())
        }
        
        setNotifications(prev => [...prev, notification])
        setIsVisible(true)
        
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed:', e))
        }
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${notification.senderName}`, {
            body: notification.message,
            icon: '/logo192.png',
            tag: notification.conversationId
          })
        }
      } catch (error) {
        console.error('Failed to process notification:', error)
      }
    })
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notifications.length <= 1) {
      setIsVisible(false)
    }
  }

  const openChat = (notification: Notification) => {
    console.log('NotificationBar: Opening chat with conversationId:', notification.conversationId)
    onOpenChat(notification.propertyId, notification.conversationId)
    dismissNotification(notification.id)
  }

  if (!isVisible || notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {notifications.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-2 animate-slide-up"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {notification.senderName} messaged you
              </p>
              <p className="text-sm text-gray-600 truncate">
                {notification.propertyTitle}
              </p>
              <p className="text-sm text-gray-500 truncate mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Conv ID: {notification.conversationId}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => openChat(notification)}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Reply
            </button>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
