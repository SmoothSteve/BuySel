export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

console.log('VAPID_EMAIL:', process.env.VAPID_EMAIL || 'MISSING');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'YES (length ' + process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length + ')' : 'MISSING');
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? 'YES (length ' + process.env.VAPID_PRIVATE_KEY.length + ')' : 'MISSING');

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  conversationId?: string;
  propertyId?: number;
}

export async function POST(request: NextRequest) {
  try {
    // VAPID setup — ONLY runs at request time (runtime), not build time
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@buysel.com.au',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const body = await request.json();
    const { userId, payload } = body as {
      userId: number;
      payload: PushPayload;
    };

    if (!userId || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, payload' },
        { status: 400 }
      );
    }

    console.log('[API] Sending push notification to user:', userId);

    // First, get user's email from userId
    const userResponse = await fetch(
      `https://buysel.azurewebsites.net/api/user/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      console.error('[API] Failed to fetch user:', userResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 500 }
      );
    }

    const userData = await userResponse.json();
    const userEmail = userData.email;

    if (!userEmail) {
      console.error('[API] User has no email:', userId);
      return NextResponse.json(
        { error: 'User has no email' },
        { status: 400 }
      );
    }

    console.log('[API] Fetching subscriptions for email:', userEmail);

    // Fetch user's push subscriptions from Azure backend using email
    const subscriptionsResponse = await fetch(
      `https://buysel.azurewebsites.net/api/push/push_subscription/email/${encodeURIComponent(userEmail)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!subscriptionsResponse.ok) {
      console.error('[API] Failed to fetch subscriptions:', subscriptionsResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch user subscriptions' },
        { status: 500 }
      );
    }

    const subscriptionsData = await subscriptionsResponse.json();
    const subscriptions = subscriptionsData.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log('[API] No subscriptions found for user:', userId, 'email:', userEmail);
      return NextResponse.json({
        success: true,
        message: 'No subscriptions to send to'
      });
    }

    console.log(`[API] Found ${subscriptions.length} subscription(s) for email:`, userEmail);

    // Send push notification to all user's subscriptions
    const pushPromises = subscriptions.map(async (subscription: any) => {
      try {
        await webpush.sendNotification(
          subscription.subscription_data,
          JSON.stringify(payload)
        );
        console.log('[API] Push notification sent successfully');
        return { success: true };
      } catch (error: any) {
        console.error('[API] Error sending push notification:', error);

        // If the subscription is invalid (410 Gone), remove it
        if (error.statusCode === 410) {
          console.log('[API] Subscription expired, removing...');
          await fetch(
            `https://buysel.azurewebsites.net/api/push/push_subscription/${subscription.id}`,
            {
              method: 'DELETE',
            }
          ).catch(err => console.error('[API] Failed to remove expired subscription:', err));
        }

        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`[API] Sent ${successCount}/${subscriptions.length} notifications successfully`);

    return NextResponse.json({
      success: true,
      successCount,
      total: subscriptions.length,
      message: `Sent ${successCount}/${subscriptions.length} notifications`
    });
  } catch (error) {
    console.error('[API] Error in push send endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}