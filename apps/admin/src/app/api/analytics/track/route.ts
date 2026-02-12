import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Analytics Tracking API Route
 * Stores events in database for analysis
 */

export async function POST(request: NextRequest) {
  try {
    const { event, params } = await request.json();
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event name required' },
        { status: 400 }
      );
    }
    
    // Store in database for analysis
    // Create analytics_events table if it doesn't exist
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event,
        event_params: params || {},
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      // Table might not exist, log but don't fail
      console.warn('Analytics tracking failed:', error);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track event' },
      { status: 500 }
    );
  }
}
