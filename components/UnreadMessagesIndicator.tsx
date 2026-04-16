"use client";

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

interface UnreadConversation {
  conversationId: string
  propertyId: number
  propertyTitle: string
  otherUserName: string
  lastMessage: string
  unreadCount: number
  timestamp: Date
}

interface UnreadMessagesIndicatorProps {
  onOpenChat: (propertyId: number, conversationId: string) => void | Promise<void>
}

interface UnreadResponse {
  conversations: UnreadConversation[]
  totalUnread: number
}

const unreadCache = new Map<string, { data: UnreadResponse; timestamp: number }>()
const inFlightUnreadRequests = new Map<string, Promise<UnreadResponse>>()
const CACHE_TTL_MS = 10000

async function fetchUnreadMessagesForEmail(email: string): Promise<UnreadResponse> {
  const now = Date.now()
  const cached = unreadCache.get(email)

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const existingRequest = inFlightUnreadRequests.get(email)
  if (existingRequest) {
    return existingRequest
  }

  const requestPromise = (async () => {
    const response = await fetch('/api/chat/unread', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch unread messages (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const normalizedData: UnreadResponse = {
      conversations: data.conversations || [],
      totalUnread: data.totalUnread || 0,
    }

    unreadCache.set(email, { data: normalizedData, timestamp: Date.now() })
    return normalizedData
  })()

  inFlightUnreadRequests.set(email, requestPromise)

  try {
    return await requestPromise
  } finally {
    inFlightUnreadRequests.delete(email)
  }
}

export default function UnreadMessagesIndicator({ onOpenChat }: UnreadMessagesIndicatorProps) {
  const { user, isAuthenticated } = useAuth()
  const [unreadConversations, setUnreadConversations] = useState<UnreadConversation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const refreshUnreadMessages = useCallback(async () => {
    if (!user?.email || !isAuthenticated) {
      setUnreadConversations([])
      setTotalUnread(0)
      return
    }

    try {
      const data = await fetchUnreadMessagesForEmail(user.email)
      setUnreadConversations(data.conversations)
      setTotalUnread(data.totalUnread)
    } catch (error) {
      console.error('Failed to fetch unread messages:', error)
      setUnreadConversations([])
      setTotalUnread(0)
    }
  }, [user?.email, isAuthenticated])

  useEffect(() => {
    if (!user?.email || !isAuthenticated) {
      return
    }

    refreshUnreadMessages()
    const interval = setInterval(refreshUnreadMessages, 30000)

    return () => clearInterval(interval)
  }, [user?.email, isAuthenticated, refreshUnreadMessages])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConversationClick = async (conv: UnreadConversation) => {
    setIsOpen(false)
    await onOpenChat(conv.propertyId, conv.conversationId)
    setTimeout(refreshUnreadMessages, 1000)
  }

  if (totalUnread === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pulsating notification badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-red-200 shadow-lg hover:bg-gray-100 transition-colors border-2 border-red-500"
      >
        <MessageCircle className="h-6 w-6 text-gray-700" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown list of unread conversations */}
      {isOpen && (
        <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 mt-2 w-auto md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold flex items-center justify-between">
              Unread Messages
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </h3>
          </div>

          <div className="overflow-y-auto max-h-80">
            {unreadConversations.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No unread messages</p>
            ) : (
              unreadConversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => handleConversationClick(conv)}
                  className="w-full p-3 hover:bg-gray-50 border-b border-gray-100 text-left transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{conv.propertyTitle}</h4>
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unreadCount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.otherUserName}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
