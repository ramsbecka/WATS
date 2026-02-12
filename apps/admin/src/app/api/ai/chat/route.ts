import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Chat API Route
 * Integrates with OpenAI ChatGPT API
 */

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    // Prepare system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful customer support assistant for WATS, an e-commerce platform in Tanzania.
You help customers with:
- Order inquiries and tracking
- Product information
- Returns and refunds
- Payment questions
- General shopping assistance

Be friendly, concise, and helpful. If you don't know something, direct them to contact support.
${context?.userId ? `User ID: ${context.userId}` : ''}
${context?.orderId ? `Current Order: ${context.orderId}` : ''}`,
    };
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Use cheaper model for cost efficiency
        messages: [systemMessage, ...messages],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, I could not process your request.';
    
    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
