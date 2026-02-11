// app/api/confirm/[token]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { token } = await params

  const { data, error } = await supabase
    .from('properties')
    .select('id, title, address, price, beds, baths, sqft, year_built, property_type, image_urls, needs_confirmation, confirmed_at')
    .eq('confirmation_token', token)
    .single()

  if (error || !data) {
    return Response.json({ error: 'Link not found or expired' }, { status: 404 })
  }

  if (data.confirmed_at) {
    return Response.json({ error: 'This link has already been used' }, { status: 410 })
  }

  return Response.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { token } = await params

  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('*')
    .eq('confirmation_token', token)
    .single()

  if (fetchError || !property) {
    return Response.json({ error: 'Link not found or expired' }, { status: 404 })
  }

  if (property.confirmed_at) {
    return Response.json({ error: 'Already confirmed' }, { status: 410 })
  }

  const body = await request.json()

  if (!body.address || body.address.trim().length < 5) {
    return Response.json({ error: 'Address is required' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update({
      address: body.address,
      price: body.price || property.price,
      beds: body.beds || property.beds,
      baths: body.baths || property.baths,
      sqft: body.sqft || property.sqft,
      year_built: body.year_built || property.year_built,
      property_type: body.property_type || property.property_type,
      needs_confirmation: false,
      confirmed_at: new Date().toISOString(),
      status: 'processing',
    })
    .eq('id', property.id)

  if (updateError) {
    return Response.json({ error: `Update failed: ${updateError.message}` }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rumoo-app.vercel.app'

  try {
    const ingestRes = await fetch(`${appUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing: {
          source_url: `confirmation:${token}`,
          address: body.address,
          price: body.price || property.price,
          beds: body.beds || property.beds,
          baths: body.baths || property.baths,
          sqft: body.sqft || property.sqft,
          year_built: body.year_built || property.year_built,
          property_type: body.property_type || property.property_type,
          description: property.description,
          image_urls: property.image_urls || [],
          _existing_property_id: property.id,
        },
      }),
    })

    const data = await ingestRes.json()

    if (data.certificate_id) {
      return Response.json({
        certificate_id: data.certificate_id,
        redirect_url: data.redirect_url,
      })
    }

    return Response.json({ error: data.error || 'Pipeline failed' }, { status: 500 })

  } catch (err) {
    return Response.json({ error: 'Pipeline error', details: String(err) }, { status: 500 })
  }
}