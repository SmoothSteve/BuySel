'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, AlertCircle, Check } from 'lucide-react'
import { Property } from '@/types/property'
import { Message } from '@/types/message'
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/push-notifications'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserData } from '@/hooks/useUserData'
import { useUserCache } from '@/hooks/useUserCache'
import { useRouter } from 'next/navigation'
import { getPhotoUrl } from '@/lib/r2-config'
import { useTimezoneCorrection } from '@/hooks/useTimezoneCorrection'
import { Seller } from '@/types/seller'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  property: Property | null
  currentUserId: number | string
  initialConversationId?: string | null
}

export default function ChatModal({ isOpen, onClose, property, currentUserId, initialConversationId }: ChatModalProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { userId, isProfileComplete, isLoading: userDataLoading } = useUserData()
  const { fetchUser } = useUserCache()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sellerInfo, setSellerInfo] = useState<Seller|null>(null)
  const [buyerInfo, setBuyerInfo] = useState<Seller|null>(null)
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isBuyer, setIsBuyer] = useState<boolean>(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)
  const correctDateForTimezone = useTimezoneCorrection()
  useEffect(() => {
    // Initialize notification sound
    if (!notificationSoundRef.current) {
      // Use a simple notification beep sound (data URL for a short beep)
      notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77+WXTwwNUKzn77BdGwU7k9jyz3cqBR99y/DinkULFFuy6OmgTBIo')
      notificationSoundRef.current.volume = 0.5 // Set volume to 50%
    }
  }, [])

  useEffect(() => {
    console.log('ChatModal useEffect:', {
      isOpen,
      userDataLoading,
      userId,
      isProfileComplete,
      property: property?.id
    })

    if (property?.sellerid && isOpen) {
      // If still loading user data, wait
      if (userDataLoading) {
        console.log('ChatModal: Still loading user data, waiting...')
        return
      }
      
      // Check if user has completed profile
      if (!userId || !isProfileComplete) {
        console.log('ChatModal: User profile issue - userId:', userId, 'isProfileComplete:', isProfileComplete)
        alert('Please complete your profile before using chat.')
        onClose()
        router.push('/complete-profile')
        return
      }
      
      // Only fetch seller info if we don't have it yet
      if (!sellerInfo && property?.sellerid) {
        fetchSellerInfo()
      }
      
      // Use the cached userId directly
      if (userId) {
        loadMessages(userId)
      }
      
      if (initialConversationId) {
        // If we have a conversation ID, also load messages directly
        loadMessages(userId)
      }
    }
    
    return () => {
      // Cleanup polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      // Clear state when modal closes
      if (!isOpen) {
        setSellerInfo(null)
        setBuyerInfo(null)
        setMessages([])
        setConversationId(null)
      }
    }
  }, [property, isOpen, userDataLoading, userId, isProfileComplete, initialConversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Set up notifications and polling when we have the user ID and conversation
    if (userId && conversationId && isOpen) {
      setupNotifications()
      startPollingMessages()
    }

    return () => {
      // Stop polling when dependencies change or component unmounts
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [userId, conversationId, isOpen])
  
  useEffect(() => {
    // Mark all messages as read when conversation is loaded/changed
    if (conversationId && userId && messages.length > 0) {
      markMessagesAsRead(messages, conversationId)
    }
  }, [conversationId, userId])

  const fetchSellerInfo = async () => {
    if (!property?.sellerid) return
    
    try {
      const data = await fetchUser(property.sellerid)
      if (data) {
        setSellerInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch seller info:', error)
    }
  }

  const fetchBuyerInfo = async (buyerId: number) => {
    try {
      const data = await fetchUser(buyerId)
      if (data) {
        setBuyerInfo(data)
        console.log('Fetched buyer info:', data)
      }
    } catch (error) {
      console.error('Failed to fetch buyer info:', error)
    }
  }


  const loadMessages = async (userIdToUse?: number) => {
    if (!property) return
    
    const effectiveUserId = userIdToUse || userId
    if (!effectiveUserId && !initialConversationId) {
      console.log('ChatModal: No user ID or conversation ID yet, skipping load')
      return
    }
    
    console.log('ChatModal: Loading messages for property:', property.id, 'seller:', property.sellerid, 'user:', effectiveUserId, 'initialConversationId:', initialConversationId)
    setLoading(true)
    try {
      // If we have an initial conversation ID, use it directly
      if (initialConversationId) {
        console.log('ChatModal: Using provided conversation ID:', initialConversationId)
        setConversationId(initialConversationId)
        
        // For initial conversation, fetch user's conversations to get details
        let convResponse
        try {
          convResponse = await fetch('/api/chat')
        } catch (fetchError) {
          console.error('Failed to fetch conversations:', fetchError)
        }
        
        if (convResponse && convResponse.ok) {
          const conversations = await convResponse.json()
          const convDetail = conversations.find((c: any) => c.id.toString() === initialConversationId)
          
          if (convDetail) {
            console.log('Found conversation details:', convDetail)
            
            // Determine if current user is buyer or seller
            const userIsBuyer = effectiveUserId === convDetail.buyer_id
            setIsBuyer(userIsBuyer)
            
            console.log('ChatModal: User role check:', {
              effectiveUserId,
              buyer_id: convDetail.buyer_id,
              seller_id: convDetail.seller_id,
              userIsBuyer
            })
            
            // If current user is seller, fetch buyer info
            if (!userIsBuyer && (!buyerInfo || buyerInfo.id !== convDetail.buyer_id)) {
              await fetchBuyerInfo(convDetail.buyer_id)
            }
          }
        }
        
        const msgUrl = `/api/chat?conversationId=${initialConversationId}`
        console.log('ChatModal: Fetching messages from:', msgUrl)
        let msgResponse
        try {
          msgResponse = await fetch(msgUrl)
        } catch (fetchError) {
          console.error('Failed to fetch messages:', fetchError)
          return
        }
        
        if (msgResponse && msgResponse.ok) {
          const messages = await msgResponse.json()
          console.log('ChatModal: Loaded', messages.length, 'messages:', messages)
          
          // Mark unread messages as read
          await markMessagesAsRead(messages, initialConversationId)

          setMessages(messages.map((msg: Message) => ({
            ...msg,
            created_at: msg.created_at ? correctDateForTimezone(new Date(msg.created_at)).toISOString() : null,
            read_at: msg.read_at ? correctDateForTimezone(new Date(msg.read_at)).toISOString() : null
          })))
        }
        return
      }
      // First check if conversation exists for this property
      console.log('ChatModal: Checking conversations for property:', property.id)
      let convResponse
      try {
        convResponse = await fetch(`/api/chat?propertyId=${property.id}`)
      } catch (fetchError) {
        console.error('Failed to fetch conversations:', fetchError)
        return
      }
      console.log('ChatModal: Conversation response status:', convResponse.status)
      if (convResponse && convResponse.ok) {
        const conversations = await convResponse.json()
        console.log('ChatModal: Found', conversations.length, 'conversations:', conversations)
        
        const existingConv = conversations.find((c: any) => {
          console.log('Checking conversation:', {
            conv_property_id: c.property_id,
            property_id: property.id,
            conv_buyer_id: c.buyer_id,
            conv_seller_id: c.seller_id,
            current_user_id: effectiveUserId,
            is_buyer: c.buyer_id === effectiveUserId,
            is_seller: c.seller_id === effectiveUserId,
            property_match: c.property_id === property.id
          })
          return c.property_id === property.id && 
            (c.buyer_id === effectiveUserId || c.seller_id === effectiveUserId)
        })
        
        if (existingConv) {
          console.log('Found existing conversation:', existingConv.id)
          setConversationId(existingConv.id.toString()) // Convert integer ID to string
          
          // Determine if current user is buyer or seller
          const userIsBuyer = effectiveUserId === existingConv.buyer_id
          setIsBuyer(userIsBuyer)
          
          console.log('ChatModal: User role check (existing conv):', {
            effectiveUserId,
            buyer_id: existingConv.buyer_id,
            seller_id: existingConv.seller_id,
            userIsBuyer
          })
          
          // If current user is seller, fetch buyer info
          if (!userIsBuyer && (!buyerInfo || buyerInfo.id !== existingConv.buyer_id)) {
            await fetchBuyerInfo(existingConv.buyer_id)
          }
          
          // Load messages for this conversation
          const msgUrl = `/api/chat?conversationId=${existingConv.id}`
          console.log('ChatModal: Fetching messages from:', msgUrl)
          let msgResponse
          try {
            msgResponse = await fetch(msgUrl)
          } catch (fetchError) {
            console.error('Failed to fetch messages for conversation:', fetchError)
            return
          }
          console.log('ChatModal: Messages response status:', msgResponse.status)
          
          if (msgResponse && msgResponse.ok) {
            const messages = await msgResponse.json()
            console.log('ChatModal: Loaded', messages.length, 'messages:', messages)
            
            // Mark unread messages as read
            await markMessagesAsRead(messages, existingConv.id.toString())

            setMessages(messages.map((msg: Message) => ({
              ...msg,
              created_at: msg.created_at ? correctDateForTimezone(new Date(msg.created_at)).toISOString() : null,
              read_at: msg.read_at ? correctDateForTimezone(new Date(msg.read_at)).toISOString() : null
            })))
          }
        } else {
          console.log('No existing conversation found for property:', property.id, 'and user:', effectiveUserId)
          // New conversation - current user is buyer
          setIsBuyer(true)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const markMessagesAsRead = async (messages: Message[], conversationId?: string) => {
    if (!userId || !conversationId) return
    
    try {
      // Use the bulk endpoint to mark all messages in the conversation as read
      console.log(`Marking all messages as read for conversation ${conversationId} and user ${userId}`)
      
      const response = await fetch(`https://buysel.azurewebsites.net/api/message/markread/${userId}/${conversationId}`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        console.log(`Successfully marked all messages as read in conversation ${conversationId}`)
        
        // Update local message state to reflect read status
        setMessages(prevMessages => 
          prevMessages.map(msg => ({
            ...msg,
            read: true
          }))
        )
      } else {
        console.error(`Failed to mark messages as read. Status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const setupNotifications = async () => {
    const permission = await requestNotificationPermission()
    if (permission) {
      await subscribeToPushNotifications()
    }
  }

  const startPollingMessages = () => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Poll for new messages every 3 seconds when chat is open
    console.log('[ChatModal] Starting message polling for conversation:', conversationId)
    pollingIntervalRef.current = setInterval(async () => {
      if (!conversationId || !isOpen) return

      try {
        const response = await fetch(`/api/chat?conversationId=${conversationId}`)
        if (response.ok) {
          const fetchedMessages = await response.json()

          // Convert to our Message format
          const formattedMessages: Message[] = fetchedMessages.map((msg: Message) => ({
            ...msg,
            created_at: msg.created_at ? correctDateForTimezone(new Date(msg.created_at)).toISOString() : null,
            read_at: msg.read_at ? correctDateForTimezone(new Date(msg.read_at)).toISOString() : null
          }))

          // Only update if we have new messages
          setMessages(prev => {
            if (prev.length !== formattedMessages.length) {
              console.log('[ChatModal] New messages detected:', formattedMessages.length - prev.length)

              // Mark new messages as read if they're from the other user
              const newMessages = formattedMessages.filter(
                newMsg => !prev.some(prevMsg => prevMsg.id === newMsg.id)
              )

              if (newMessages.length > 0 && conversationId) {
                const unreadFromOthers = newMessages.filter(msg => msg.senderId !== userId)
                if (unreadFromOthers.length > 0) {
                  // Play notification sound for new messages from others
                  notificationSoundRef.current?.play().catch(err => {
                    console.log('Could not play notification sound:', err)
                  })
                  markMessagesAsRead(unreadFromOthers.map(m => ({ id: parseInt(m.id) })), conversationId)
                }
              }

              return formattedMessages
            }
            return prev
          })
        }
      } catch (error) {
        console.error('[ChatModal] Error polling messages:', error)
      }
    }, 3000) // Poll every 3 seconds
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !property || !userId) return

    const tempMessage: Message = {
      id: 0, // Temporary ID for optimistic update
      conversation_id: parseInt(conversationId || '0'),
      sender_id: userId,
      content: newMessage,
      created_at: new Date().toISOString(),
      read_at: null,
      bloburl: null
    }

    setMessages([...messages, tempMessage])
    setNewMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property.id,
          sellerId: property.sellerid,
          content: newMessage,
          conversationId: conversationId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const savedMessage = await response.json()
      // Update conversation ID if this is the first message
      if (!conversationId && savedMessage.conversationId) {
        setConversationId(savedMessage.conversationId)
        // For new conversations, current user is the buyer
        setIsBuyer(true)
      }
      // Update with server response
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? {
          ...savedMessage,
          created_at: savedMessage.created_at ? correctDateForTimezone(new Date(savedMessage.created_at)).toISOString() : null,
          read_at: null
        } : msg
      ))
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      alert('Failed to send message. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen || !property) return null

  // Show profile completion message only if:
  // 1. No initial conversation ID (new chat)
  // 2. No numeric user ID found
  // 3. Not loading
  // 4. Not checking profile
  if (isOpen && user?.email && userId === null && !loading && !userDataLoading && !initialConversationId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-auto">
          <h3 className="text-xl font-semibold mb-4">Complete Your Profile</h3>
          <p className="text-gray-600 mb-6">
            Before you can send messages, you need to complete your profile with your name and contact details.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/complete-profile'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Complete Profile
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] max-h-[90vh] flex flex-col mx-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {isBuyer && sellerInfo?.photoazurebloburl && (
              <img
                src={getPhotoUrl(sellerInfo.photoazurebloburl) || ''}
                alt={`${sellerInfo.firstname} ${sellerInfo.lastname}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            {!isBuyer && buyerInfo?.photoazurebloburl && (
              <img
                src={getPhotoUrl(buyerInfo.photoazurebloburl) || ''}
                alt={`${buyerInfo.firstname} ${buyerInfo.lastname}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{property.title}</h3>
              {isBuyer && sellerInfo && (
                <>
                  <p className="text-sm text-gray-600">
                    Chat with {sellerInfo.firstname} {sellerInfo.lastname} ({sellerInfo.email})
                  </p>
                  <p className="text-xs flex items-center gap-1">
                    {sellerInfo.idverified ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Seller ID verified</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">Seller ID not verified</span>
                      </>
                    )}
                  </p>
                </>
              )}
              {!isBuyer && buyerInfo && (
                <>
                  <p className="text-sm text-gray-600">
                    Chat with {buyerInfo.firstname} {buyerInfo.lastname} ({buyerInfo.email})
                  </p>
                  <p className="text-xs flex items-center gap-1">
                    {buyerInfo.idverified ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Buyer ID verified</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">Buyer ID not verified</span>
                      </>
                    )}
                  </p>
                </>
              )}
              {conversationId && (
                <p className="text-xs text-gray-400">
                  Conv ID: {conversationId}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {userDataLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Checking your profile...</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading messages...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Your personal information will be kept private until both parties agree to share contact details.
                </p>
              </div>

              {messages.map((message) => {
            const isSender = message.sender_id === userId
            const fileExtension = message.bloburl ? message.bloburl.split('.').pop()?.toLowerCase() : null
            const isImage = fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)
            const isPdf = fileExtension === 'pdf'

            return (
              <div
                key={message.id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isSender
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                <p className="break-words">{message.content}</p>

                {message.bloburl && (
                  <div className="mt-2">
                    {isImage ? (
                      <img
                        src={getPhotoUrl(message.bloburl) || ''}
                        alt="Attachment"
                        className="max-w-full rounded border border-gray-300"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : isPdf ? (
                      <a
                        href={getPhotoUrl(message.bloburl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded ${
                          isSender ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                        View PDF Document
                      </a>
                    ) : (
                      <a
                        href={getPhotoUrl(message.bloburl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded ${
                          isSender ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        Download Attachment
                      </a>
                    )}
                  </div>
                )}

                <p
                  className={`text-xs mt-1 ${
                    isSender ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.created_at && new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            )
          })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={userDataLoading ? "Checking profile..." : loading ? "Loading messages..." : "Type a message..."}
              disabled={userDataLoading || loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || userDataLoading || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {user?.email && (
            <p className="text-xs text-gray-400 mt-2">
              Sender: {user.email}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}