export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: 'Missing required field: subscription' },
        { status: 400 }
      );
    }

    console.log('[API] Saving push subscription for email:', session.user.email);
    console.log('[API] Subscription object:', JSON.stringify(subscription, null, 2));

    // Validate subscription structure
    if (!subscription.endpoint) {
      console.error('[API] Subscription missing endpoint field');
      return NextResponse.json(
        { error: 'Invalid subscription: missing endpoint' },
        { status: 400 }
      );
    }

    // Ensure keys object exists and has required fields
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error('[API] Subscription missing or invalid keys');
      return NextResponse.json(
        { error: 'Invalid subscription: missing or invalid keys (p256dh, auth)' },
        { status: 400 }
      );
    }

    // Clean up the subscription data - remove null/undefined values
    const cleanedSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys
      // Omit expirationTime if it's null - C# backend may not handle it well
    };

    const requestBody = {
      email: session.user.email,
      subscription_data: cleanedSubscription,
      platform: 'web'
    };
    console.log('[API] Request body:', JSON.stringify(requestBody, null, 2));

    // Send subscription to Azure backend using email
    const response = await fetch(
      'https://buysel.azurewebsites.net/api/push/push_subscription',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Backend responded with status:', response.status);
      console.error('[API] Backend error response:', errorText);
      console.error('[API] Failed to save subscription to backend');
      throw new Error(`Backend error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[API] Subscription saved successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully'
    });

  } catch (error) {
    console.error('[API] Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
