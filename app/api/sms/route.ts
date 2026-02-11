// app/api/sms/route.ts
// Twilio webhook — receives SMS or WhatsApp messages containing Zillow/Redfin URLs
// 
// Setup in Twilio console:
//   SMS webhook:      https://rumoo-app.vercel.app/api/sms
//   WhatsApp webhook: https://rumoo-app.vercel.app/api/sms
//   Method: POST

import { NextRequest } from 'next/server'

// Twilio sends form-encoded bodies, not JSON
async function parseTwilioBody(request: NextRequest) {
  const text = await request.text()
  const params = new URLSearchParams(text)
  return {
    from: params.get('From') || '',          // e.g. "+15551234567" or "whatsapp:+15551234567"
    body: params.get('Body') || '',           // message text
    channel: params.get('From')?.startsWith('whatsapp:') ? 'whatsapp' : 'sms',
  }
}

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/)
  return match ? match[0].trim() : null
}

function isListingUrl(url: string): boolean {
  return url.includes('zillow.com') || url.includes('redfin.com') || url.includes('realtor.com')
}

function twimlReply(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function POST(request: NextRequest) {
  const { from, body, channel } = await parseTwilioBody(request)

  // Validate Twilio signature in production
  // TODO: add validateRequest() from twilio library

  const url = extractUrl(body)

  if (!url) {
    return twimlReply(
      "Send me a Zillow, Redfin, or Realtor.com listing URL and I'll analyze it for you.\n\nExample: just paste the link from your browser."
    )
  }

  if (!isListingUrl(url)) {
    return twimlReply(
      "That doesn't look like a listing URL. Please send a link from Zillow, Redfin, or Realtor.com."
    )
  }

  // Call our own /api/ingest endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rumoo-app.vercel.app'

  try {
    const ingestRes = await fetch(`${appUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    const data = await ingestRes.json()

    // Store mobile session for tracking
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('mobile_sessions').insert({
      phone_number: from,
      property_id: data.property_id || null,
      channel,
      state: data.certificate_id ? 'done' : data.status === 'needs_confirmation' ? 'waiting' : 'error',
    })

    // Case 1: Certificate generated immediately
    if (data.certificate_id && data.redirect_url) {
      return twimlReply(
        `✅ Rumoo analysis ready!\n\n${data.redirect_url}\n\nOpen this link to see the full certificate with light, noise, and experience assessment.`
      )
    }

    // Case 2: Needs confirmation (scrape blocked, missing fields)
    if (data.status === 'needs_confirmation' && data.confirmation_url) {
      return twimlReply(
        `🏠 Got your listing. I need a bit more info to complete the analysis.\n\nFill in the details here (takes 30 seconds):\n${data.confirmation_url}\n\nYour certificate will generate automatically after.`
      )
    }

    // Case 3: Error
    return twimlReply(
      `Something went wrong analyzing that listing. Try again in a moment, or visit rumoo-app.vercel.app to analyze it there.`
    )

  } catch (error) {
    console.error('SMS webhook error:', error)
    return twimlReply(
      `Having trouble right now. Visit rumoo-app.vercel.app to analyze your listing.`
    )
  }
}