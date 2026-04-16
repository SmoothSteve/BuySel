export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { backendUrl } from '@/lib/server-config'

interface ConversationSummary {
  property_id: number
}

function localApiUrl(req: NextRequest, path: string) {
  return new URL(path, req.nextUrl.origin).toString()
}

async function resolveCurrentUserId(req: NextRequest, email: string): Promise<number | null> {
  const userEmailUrl = localApiUrl(req, `/api/user/email/${encodeURIComponent(email)}`)
  const userResponse = await fetch(userEmailUrl)
  if (!userResponse.ok) {
    return null
  }
  const userData = await userResponse.json()
  return Number(userData.id)
}

export async function GET(req: NextRequest) {
  const session = await getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  const propertyId = searchParams.get('propertyId')
  const sellerId = searchParams.get('sellerId')
  
  try {
    const userId = await resolveCurrentUserId(req, session.user.email!)
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (conversationId) {
      const convDetailResponse = await fetch(backendUrl(`/api/conversation/${conversationId}`))
      if (!convDetailResponse.ok) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      const convDetail = await convDetailResponse.json()
      const isParticipant = userId === convDetail.buyer_id || userId === convDetail.seller_id
      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Get messages for a specific conversation
      const messageUrl = backendUrl(`/api/message/conversation/${conversationId}`)
      console.log('🔵 Fetching messages from:', messageUrl)
      const response = await fetch(messageUrl)
      const messages = await response.json()
      return NextResponse.json(messages)
    } else {
      const url = backendUrl(`/api/conversation/user/${userId}`)
      console.log('🔵 Fetching conversations from:', url)
      console.log('User ID:', userId)
      console.log('Property ID filter:', propertyId)
      console.log('Seller ID filter:', sellerId)
      
      const response = await fetch(url)
      
      // Check if response is ok
      if (!response.ok) {
        console.error('Response status:', response.status)
        const text = await response.text()
        console.error('Response text:', text)
        return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
      }
      
      // Check if response has content
      const text = await response.text()
      if (!text) {
        console.log('Empty response, returning empty array')
        return NextResponse.json([])
      }
      
      try {
        let conversations = JSON.parse(text)
        
        // Filter by property ID if specified
        if (propertyId) {
          console.log('Filtering conversations for property:', propertyId)
          conversations = conversations.filter((conv: ConversationSummary) => 
            conv.property_id === parseInt(propertyId)
          )
        }
        
        console.log('Returning conversations:', conversations)
        return NextResponse.json(conversations)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', text)
        return NextResponse.json({ error: 'Invalid JSON response' }, { status: 500 })
      }
    }
  } catch (error) {
    console.error('Error fetching chat data:', error)
    return NextResponse.json({ error: 'Failed to fetch chat data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { propertyId, sellerId, content, conversationId } = body

  try {
    const userId = await resolveCurrentUserId(req, session.user.email!)
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    let convId = conversationId
    let buyerId: number
    let actualSellerId: number

    // Create conversation if it doesn't exist
    if (!convId) {
      // Check if current user is the seller
      const providedSellerId = parseInt(sellerId)
      if (userId === providedSellerId) {
        // Current user is the seller, so they can't be the buyer
        // This is an error case - seller can't initiate chat with themselves
        return NextResponse.json({ error: 'Seller cannot initiate chat with themselves' }, { status: 400 })
      }
      
      // Current user is the buyer
      buyerId = userId
      actualSellerId = providedSellerId
      const convUrl = backendUrl('/api/conversation')
      console.log('🔵 Creating conversation at:', convUrl)
      console.log('Payload:', {
        id: 0, // New record
        property_id: propertyId,
        buyer_id: userId,
        seller_id: sellerId
      })
      
      const convResponse = await fetch(convUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 0, // New record
          property_id: propertyId,
          buyer_id: userId,
          seller_id: sellerId
        })
      })
      
      console.log('Conversation creation response status:', convResponse.status)
      
      if (!convResponse.ok) {
        const errorText = await convResponse.text()
        console.error('Failed to create conversation:', errorText)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      
      const responseText = await convResponse.text()
      console.log('Conversation response text:', responseText)
      
      if (!responseText) {
        return NextResponse.json({ error: 'Empty response from conversation API' }, { status: 500 })
      }
      
      try {
        const newConversation = JSON.parse(responseText)
        convId = newConversation.id.toString() // Convert integer ID to string
        buyerId = newConversation.buyer_id
        actualSellerId = newConversation.seller_id
        console.log('Created conversation with ID:', convId)
      } catch (parseError) {
        console.error('Failed to parse conversation response:', parseError)
        return NextResponse.json({ error: 'Invalid conversation response' }, { status: 500 })
      }
    } else {
      // If using existing conversation, get buyer and seller IDs
      const convDetailUrl = backendUrl(`/api/conversation/${convId}`)
      console.log('🔵 Fetching conversation details from:', convDetailUrl)
      let convDetailResponse
      try {
        convDetailResponse = await fetch(convDetailUrl)
      } catch (fetchError) {
        console.error('Network error fetching conversation details:', fetchError)
        return NextResponse.json({ error: 'Network error fetching conversation details' }, { status: 500 })
      }
      if (convDetailResponse.ok) {
        const convDetail = await convDetailResponse.json()
        buyerId = convDetail.buyer_id
        actualSellerId = convDetail.seller_id
        if (userId !== buyerId && userId !== actualSellerId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        console.log('🔍 Loaded conversation details:', {
          conversation_id: convId,
          buyer_id: buyerId,
          seller_id: actualSellerId,
          current_user_id: userId,
          current_user_role: userId === buyerId ? 'BUYER' : userId === actualSellerId ? 'SELLER' : 'UNKNOWN'
        })
      } else {
        console.error('Failed to fetch conversation details. Status:', convDetailResponse.status)
        const errorText = await convDetailResponse.text()
        console.error('Error response:', errorText)
        // Cannot proceed without knowing who to send notification to
        return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 })
      }
    }

    // Create message
    const messageUrl = backendUrl('/api/message')
    console.log('🔵 Sending message to:', messageUrl)
    console.log('Message payload:', {
      id: 0, // New record
      conversation_id: parseInt(convId), // Convert to number
      sender_id: userId,
      content: content
    })
    const messageResponse = await fetch(messageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 0, // New record
        conversation_id: parseInt(convId), // Convert to number
        sender_id: userId,
        content: content
      })
    })
    
    const message = await messageResponse.json()

    // Validate we have buyer and seller IDs
    if (!buyerId || !actualSellerId) {
      console.error('Missing buyer or seller ID. Cannot send notification.')
      console.error('buyerId:', buyerId, 'actualSellerId:', actualSellerId)
      return NextResponse.json({ ...message, conversationId: convId })
    }
    
    // Determine recipient ID (if sender is buyer, recipient is seller and vice versa)
    const recipientId = (userId === actualSellerId) ? buyerId : actualSellerId
    console.log('🔔 Notification routing:', {
      senderId: userId,
      senderType: userId === buyerId ? 'buyer' : 'seller',
      recipientId: recipientId,
      recipientType: recipientId === buyerId ? 'buyer' : 'seller',
      buyerId: buyerId,
      sellerId: actualSellerId,
      notificationChannel: `user-notifications-${recipientId}`
    })
    
    // Get sender info for notification
    const senderResponse = await fetch(localApiUrl(req, `/api/user/${userId}`))
    const senderData = await senderResponse.json()

    // Send Web Push notification to recipient
    console.log('🔔 NOTIFICATION SUMMARY:')
    console.log('  - Sender ID:', userId, '(', userId === buyerId ? 'BUYER' : 'SELLER', ')')
    console.log('  - Recipient ID:', recipientId, '(', recipientId === buyerId ? 'BUYER' : 'SELLER', ')')
    console.log('Notification data:', {
      conversationId: convId,
      propertyId: propertyId,
      senderName: `${senderData.firstname} ${senderData.lastname}`,
      senderId: userId,
      recipientId: recipientId,
      message: content.substring(0, 100)
    })

    console.log('🚀 Sending Web Push notification')

    try {
      // Send push notification via our API
      const pushResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          userId: recipientId,
          payload: {
            title: `New message from ${senderData.firstname} ${senderData.lastname}`,
            body: content.substring(0, 100),
            url: `/buyer/messages?conversationId=${convId}`,
            conversationId: convId,
            propertyId: propertyId
          }
        })
      })

      if (pushResponse.ok) {
        console.log('✅ Web Push notification sent successfully')
      } else {
        const errorText = await pushResponse.text()
        console.error('❌ Failed to send Web Push notification:', errorText)
      }
    } catch (pushError) {
      console.error('❌ Error sending Web Push notification:', pushError)
      // Don't fail the whole request if push fails
    }

    return NextResponse.json({ ...message, conversationId: convId })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
