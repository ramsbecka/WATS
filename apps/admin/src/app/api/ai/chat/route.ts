import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Chat API Route – WATS customer support robot
 * Uses OpenAI with a rich system prompt so the AI can answer many and complex questions about the project.
 */

const WATS_KNOWLEDGE = `
## WATS ni nini?
WATS ni jukwaa la biashara (e-commerce) la Tanzania lenye maduka mengi (multi-vendor). Wateja wanunua kwenye simu (app ya Android/iOS), malipo ni kwa simu (M-Pesa, Airtel Money, n.k.), na sarafu ni TZS. Lugha: Kiswahili na Kiingereza.

## App ya mtumiaji (mobile)
- Kuangalia bidhaa kwa kategoria na utafutaji
- Cart: ongeza bidhaa, badilisha idadi, ondoa; unaweza kuchagua variant (rangi/size) ikiwa ipo
- Checkout: jaza anwani kamili (jina, simu, mkoa, wilaya, mtaa), weka voucher code ikiwa unayo (voucher ni ya mtumiaji mmoja tu)
- Malipo: M-Pesa STK Push – utapokea prompt kwenye simu, ingiza PIN; status inaonekana live. Ikiwa STK imeshindwa, kuna "Retry Payment" (hakuna order mpya, tu jaribio jipya la malipo)
- Orders: angalia order zako kwenye Profile → Orders; status: pending → confirmed (baada ya malipo) → processing → shipped → delivered. Admin anaweka tracking
- Returns: unaweza omba return kutoka ukurasa wa order (Request Return)
- Wishlist, anwani zako, vouchers yako, notifications, loyalty points
- Msaada: kwenye chatbot una "Robot" (mimi) na "Live" – kuchat na mtu halisi. Ikiwa hauna jibu au unahitaji mtu, piga: +255 792 108 835

## Malipo kwa undani
- Malipo yanafanywa server-side tu; simu inachukuliwa kutoka profile/checkout
- Checkout inatengeneza order (pending) na payment (initiated), kisha STK Push
- Unapoingiza PIN, M-Pesa inatumia webhook; order inakuwa confirmed na una notification
- Voucher: code inatumika wakati wa checkout; discount inakokotwa server-side; voucher ni ya wewe tu (user_id)
- Idempotency: ikiwa ubonyeze mara mbili, order moja tu inatengenezwa

## Admin na fulfillment
- WATS (operator) inasimamia inventory, packing, shipping, na returns
- Maduka (vendors) huongeza bidhaa; WATS inashipa na kusafirisha
- Refund: admin anaweza kufanya refund; order inakuwa cancelled na return record

## Mawasiliano
- Piga msaada (mawasiliano ya kawaida): +255 792 108 835
- Live chat: kwenye app, chagua tab "Live (mtu)" kuchat na mtu halisi
`.trim();

const SYSTEM_PROMPT = `You are the official customer support assistant for WATS, a multi-vendor e-commerce platform in Tanzania (currency: TZS; languages: Swahili and English).

## Your knowledge (answer accurately from this)
${WATS_KNOWLEDGE}

## Instructions
1. Answer in the same language the customer uses (Swahili or English). If mixed, prefer Swahili for Tanzanian context.
2. Be helpful, accurate, and concise. For complex or multi-part questions, give a clear step-by-step answer.
3. You can answer detailed questions about: how to order, checkout, payment (M-Pesa, STK, retry), vouchers, order status and tracking, returns, refunds, account (profile, addresses), app features, and who to contact.
4. If the customer asks something you are not sure about (e.g. specific order amount, exact delivery date), tell them to check the app (Orders, Profile) or contact support.
5. Always mention the support phone +255 792 108 835 when: they need a human, something failed, or they want to talk to someone. Also mention they can switch to "Live" chat in the same screen.
6. Do not invent features or policies that are not in the knowledge above. If you don't know, say so and direct to support.
7. For technical or internal questions (e.g. how the backend works), give a simple customer-facing explanation only.`;

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

    const contextLine = [
      context?.userId ? `Current user ID: ${context.userId}` : '',
      context?.orderId ? `Current order ID (if any): ${context.orderId}` : '',
    ].filter(Boolean).join('\n');

    const systemMessage = {
      role: 'system' as const,
      content: contextLine ? `${SYSTEM_PROMPT}\n\n${contextLine}` : SYSTEM_PROMPT,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        messages: [systemMessage, ...(Array.isArray(messages) ? messages : [])],
        max_tokens: 550,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Samahani, sijui jibu sahihi. Tafadhali piga msaada: +255 792 108 835 au badilisha kwa Live chat.';

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
