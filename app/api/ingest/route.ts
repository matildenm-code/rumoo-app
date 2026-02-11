// app/api/ingest/route.ts
// Accepts two payload types:
//   A) full_capture  — from bookmarklet (all fields present)
//   B) url_only      — from mobile share (URL only, server attempts scrape)

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type FullCapturePayload = {
  source_url: string
  external_id?: string | null
  title?: string | null
  price?: number | null
  address: string
  beds?: number | null
  baths?: number | null
  sqft?: number | null
  year_built?: number | null
  property_type?: string | null
  description?: string | null
  image_urls: string[]
}

type UrlOnlyPayload = {
  source_url: string
}

type IngestBody =
  | { listing: FullCapturePayload }   // bookmarklet
  | { url: string }                    // mobile share

function isFullCapture(body: IngestBody): body is { listing: FullCapturePayload } {
  return 'listing' in body && typeof (body as { listing: FullCapturePayload }).listing === 'object'
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function generateConfirmationToken(): string {
  return randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F9C2B1"
}

function detectSource(url: string): string {
  if (url.includes('zillow.com')) return 'zillow'
  if (url.includes('redfin.com')) return 'redfin'
  if (url.includes('realtor.com')) return 'realtor'
  return 'manual'
}

// ─── GEOCODING ────────────────────────────────────────────────────────────────

async function geocodeAddress(address: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
    )
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.[0]) return null

    const result = data.results[0]
    const loc = result.geometry.location
    const get = (type: string) =>
      result.address_components.find((c: { types: string[] }) => c.types.includes(type))

    return {
      lat: loc.lat as number,
      lng: loc.lng as number,
      city: get('locality')?.long_name || get('sublocality')?.long_name || '',
      state: get('administrative_area_level_1')?.short_name || '',
      zip: get('postal_code')?.long_name || '',
    }
  } catch {
    return null
  }
}

// ─── SERVER-SIDE SCRAPE (url_only mode) ──────────────────────────────────────
// Best-effort. Uses Apify if key present, otherwise returns null.

async function attemptServerScrape(url: string): Promise<Partial<FullCapturePayload> | null> {
  const apifyKey = process.env.APIFY_API_KEY
  if (!apifyKey) return null

  try {
    // Trigger Apify Zillow scraper actor
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/maxcopell~zillow-scraper/run-sync-get-dataset-items?token=${apifyKey}&timeout=30`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrls: [{ url }], maxItems: 1 }),
      }
    )

    if (!runRes.ok) return null
    const items = await runRes.json()
    const item = items?.[0]
    if (!item) return null

    return {
      source_url: url,
      external_id: item.zpid ? String(item.zpid) : null,
      title: item.address?.streetAddress
        ? `${item.address.streetAddress}, ${item.address.city}, ${item.address.state}`
        : null,
      price: item.price || null,
      address: item.address
        ? [item.address.streetAddress, item.address.city, item.address.state, item.address.zipcode]
            .filter(Boolean).join(', ')
        : '',
      beds: item.bedrooms || null,
      baths: item.bathrooms || null,
      sqft: item.livingArea || null,
      year_built: item.yearBuilt || null,
      property_type: item.homeType || null,
      description: item.description || null,
      image_urls: (item.photos || [])
        .map((p: { url?: string }) => p.url)
        .filter(Boolean)
        .slice(0, 20),
    }
  } catch {
    return null
  }
}

// ─── LOCATION INSIGHTS ────────────────────────────────────────────────────────

async function generateLocationInsights(lat: number, lng: number) {
  const key = process.env.GOOGLE_MAPS_API_KEY
  const amenities: Record<string, number> = {
    supermarket_min: 10, metro_min: 15, cafe_min: 5,
    park_min: 10, gym_min: 12, pharmacy_min: 8,
  }

  if (key) {
    const types = [
      { key: 'supermarket_min', type: 'supermarket' },
      { key: 'metro_min', type: 'subway_station' },
      { key: 'cafe_min', type: 'cafe' },
      { key: 'park_min', type: 'park' },
      { key: 'gym_min', type: 'gym' },
      { key: 'pharmacy_min', type: 'pharmacy' },
    ]

    await Promise.all(types.map(async ({ key: aKey, type }) => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}&key=${key}`
        )
        const data = await res.json()
        if (data.results?.[0]) {
          const dRes = await fetch(
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${data.results[0].place_id}&mode=walking&key=${key}`
          )
          const dData = await dRes.json()
          const seconds = dData.rows?.[0]?.elements?.[0]?.duration?.value
          if (seconds) amenities[aKey] = Math.round(seconds / 60)
        }
      } catch { /* keep default */ }
    }))
  }

  const avgMin = Object.values(amenities).reduce((a, b) => a + b, 0) / Object.values(amenities).length
  const walkability = avgMin <= 6 ? 'high' : avgMin <= 12 ? 'moderate' : 'low'
  const daily_convenience = amenities.supermarket_min <= 5 ? 'strong' : amenities.supermarket_min <= 10 ? 'moderate' : 'weak'
  const neighbourhood_energy = avgMin <= 5 ? 'vibrant' : avgMin <= 10 ? 'balanced' : 'calm'
  const traffic_exposure = amenities.metro_min <= 3 ? 'high' : avgMin <= 7 ? 'moderate' : 'low'

  return {
    walkability, daily_convenience, traffic_exposure, neighbourhood_energy,
    proximity_score: Math.max(20, Math.min(100, Math.round(100 - (avgMin * 3)))),
    amenities_json: amenities,
    solar_json: { orientation: 'unknown', morning_light: 'moderate', afternoon_light: 'moderate', seasonal_note: 'Verify light during visit.' },
    noise_json: { daytime_db: 55, nighttime_db: 45, primary_sources: ['street traffic'], sensitivity_note: 'Estimate only — verify during visit.' },
    lifestyle_json: { neighbourhood_type: 'urban residential', community_character: 'urban mix' },
  }
}

// ─── GEMINI VISION ────────────────────────────────────────────────────────────

async function analyzePhotos(imageUrls: string[]) {
  const key = process.env.GEMINI_API_KEY
  if (!key || imageUrls.length === 0) return null

  const urls = imageUrls.slice(0, 8)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze these ${urls.length} real estate listing photos. Return ONLY valid JSON, no markdown.

{
  "light_assessment": { "quality": "poor|fair|good|excellent", "natural_light_visible": true, "artificial_enhancement_suspected": false, "notes": "" },
  "spatial_assessment": { "size_impression": "cramped|compact|adequate|spacious", "ceiling_height": "low|standard|high", "flow": "poor|adequate|good", "notes": "" },
  "condition_assessment": { "overall": "poor|fair|good|excellent", "finishes": "basic|standard|premium|luxury", "estimated_renovation_age": "recent|5-10yr|10-20yr|dated", "notes": "" },
  "atmosphere": { "dominant_feeling": "", "calm_hectic_score": 50, "airy_dim_score": 50, "warm_cold_score": 50 },
  "red_flags": [],
  "confidence": "low|medium|high"
}`
              },
              ...urls.map(url => ({ image_url: { url } }))
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
        })
      }
    )

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

// ─── CERTIFICATE GENERATOR ────────────────────────────────────────────────────

function buildCertificate(
  property: { title: string | null; address: string; city: string; price: number | null; beds: number | null; baths: number | null; sqft: number | null; year_built: number | null; property_type: string | null },
  loc: Awaited<ReturnType<typeof generateLocationInsights>>,
  photoInsights: Record<string, unknown> | null,
  tier: 'normal' | 'pro'
) {
  const light = photoInsights as { light_assessment?: { quality?: string; artificial_enhancement_suspected?: boolean } } | null
  const spatial = photoInsights as { spatial_assessment?: { size_impression?: string } } | null
  const flags = photoInsights as { red_flags?: string[] } | null

  const stateScore = (() => {
    let s = 50
    if (loc.walkability === 'high') s += 8
    if (loc.traffic_exposure === 'high') s -= 12
    if (loc.traffic_exposure === 'low') s += 8
    if (loc.neighbourhood_energy === 'calm') s += 5
    if (loc.proximity_score >= 80) s += 5
    if (property.sqft && property.sqft >= 1500) s += 8
    if (property.sqft && property.sqft < 600) s -= 10
    return s
  })()

  const state = stateScore >= 70 ? 'Strong' : stateScore >= 50 ? 'Stable' : stateScore >= 35 ? 'Fragile' : 'Declining'
  const trajectory = loc.neighbourhood_energy === 'calm' && loc.daily_convenience === 'strong' ? 'Improving' : 'Stable'

  const photoLine = light?.light_assessment
    ? `Photo analysis: ${light.light_assessment.quality} light quality, ${spatial?.spatial_assessment?.size_impression} space impression.${light.light_assessment.artificial_enhancement_suspected ? ' Enhancement suspected.' : ''}`
    : 'Visit required to verify light and spatial conditions.'

  const base = {
    meta: { id: '', tier, version: '1.0.0', generated_at: new Date().toISOString() },
    property_identity: {
      title: property.title || property.address,
      city: property.city,
      property_type: property.property_type || 'Residential',
      sqft: property.sqft,
      beds: property.beds,
      baths: property.baths,
    },
    experience_barometer: {
      state,
      trajectory,
      one_sentence: `${property.property_type || 'Property'} in ${loc.neighbourhood_energy} neighbourhood with ${loc.daily_convenience} daily convenience.`,
    },
    experience_capital: {
      generating: [
        loc.walkability === 'high' ? 'High walkability — daily needs within walking distance' : 'Accessible urban location',
        loc.daily_convenience === 'strong' ? 'Strong daily convenience infrastructure' : null,
        light?.light_assessment?.quality === 'excellent' ? 'Excellent natural light (photo-verified)' : null,
      ].filter(Boolean) as string[],
      preserving: [
        'Standard residential layout',
        `Proximity score ${loc.proximity_score}/100`,
      ],
      draining: [
        loc.traffic_exposure === 'high' ? 'High traffic exposure — acoustic management required' : null,
        flags?.red_flags?.length ? `Photo flags: ${flags.red_flags.slice(0, 2).join(', ')}` : null,
      ].filter(Boolean) as string[],
    },
    signals: [
      { name: 'Urban Convenience', state: loc.walkability === 'high' ? 'positive' : 'neutral', short_explanation: `Metro ~${loc.amenities_json.metro_min} min, supermarket ~${loc.amenities_json.supermarket_min} min.` },
      { name: 'Traffic Exposure', state: loc.traffic_exposure === 'high' ? 'negative' : loc.traffic_exposure === 'low' ? 'positive' : 'neutral', short_explanation: `${loc.traffic_exposure} traffic exposure for this address.` },
      { name: 'Neighbourhood Energy', state: loc.neighbourhood_energy === 'calm' ? 'positive' : 'neutral', short_explanation: `${loc.neighbourhood_energy} neighbourhood character.` },
      ...(photoInsights ? [{ name: 'Photo Analysis', state: light?.light_assessment?.artificial_enhancement_suspected ? 'sensitive' : 'neutral', short_explanation: photoLine }] : []),
    ],
    location_context: {
      walkability: loc.walkability,
      daily_convenience: loc.daily_convenience,
      traffic_exposure: loc.traffic_exposure,
      neighbourhood_energy: loc.neighbourhood_energy,
    },
    realfeel_environment: {
      natural_light_summary: light?.light_assessment
        ? `${light.light_assessment.quality} light quality detected. ${light.light_assessment.artificial_enhancement_suspected ? 'Artificial enhancement suspected — verify in person.' : 'Photos appear representative.'}`
        : 'Verify natural light during visit.',
      noise_summary: `Estimated ~${loc.noise_json.daytime_db}dB daytime. ${loc.noise_json.sensitivity_note}`,
      lifestyle_summary: `${loc.lifestyle_json.neighbourhood_type}. ${loc.lifestyle_json.community_character}.`,
    },
    verification_checklist: [
      { item: 'Visit during the day to confirm real natural light conditions', category: 'light' },
      { item: 'Open all windows for 5 minutes — assess real ambient noise', category: 'noise' },
      { item: light?.light_assessment?.artificial_enhancement_suspected ? 'Compare listing photos to reality — artificial lighting suspected' : 'Check glazing: single vs double pane', category: 'structure' },
      { item: 'Inspect walls and ceiling for damp, cracks, or water staining', category: 'structure' },
      { item: 'Request full seller disclosure and HOA documents', category: 'legal' },
      { item: 'Verify any pending special assessments or HOA disputes', category: 'legal' },
      { item: `Walk to nearest supermarket (~${loc.amenities_json.supermarket_min} min) — verify route at night`, category: 'neighbourhood' },
      { item: 'Check cell signal and internet provider options in the unit', category: 'lifestyle' },
      ...(property.sqft && property.sqft < 800 ? [{ item: 'Bring a tape measure — verify key furniture fits', category: 'lifestyle' }] : []),
      ...(property.year_built && property.year_built < 1980 ? [{ item: 'Request full inspection — older build warrants structural review', category: 'structure' }] : []),
      ...(flags?.red_flags?.length ? flags.red_flags.map(f => ({ item: `Verify: ${f}`, category: 'structure' })) : []),
    ] as { item: string; category: string }[],
    editorial_summary: `This ${property.property_type || 'property'} at ${property.address} presents a ${state.toLowerCase()} experience profile. ${photoLine} The location offers ${loc.daily_convenience} daily convenience in a ${loc.neighbourhood_energy} neighbourhood. ${loc.traffic_exposure === 'high' ? 'Traffic noise requires investigation before committing.' : 'Acoustic conditions appear manageable from available data.'} In-person verification is essential before any decision.`,
  }

  if (tier !== 'pro') return base

  return {
    ...base,
    visit_strategy: {
      best_visit_time: loc.noise_json.nighttime_db >= 58 ? 'evening' : 'afternoon',
      why: loc.noise_json.nighttime_db >= 58
        ? `Estimated night noise (~${loc.noise_json.nighttime_db}dB) is a primary risk factor. An evening visit confirms the real acoustic environment.`
        : `Afternoon visit captures best natural light for assessment. Estimated noise is manageable — confirm during visit.`,
    },
    silence_and_drift: {
      missing_elements: ['Real light conditions — listing photos may be enhanced', 'Actual acoustic environment — estimates only', 'HOA financial health and building history'],
      hidden_risks: [
        ...(flags?.red_flags?.length ? [`Photo flags detected: ${flags.red_flags.join(', ')}`] : ['Condition details not visible from listing photos']),
        'Traffic patterns across different times of day',
        'Neighbourhood trajectory over next 3-5 years',
      ],
      overlooked_opportunities: ['Renovation potential relative to year built', 'Comparable sales momentum in this zip code', 'Development plans for immediate area'],
    },
    strategic_risks: {
      risks: [
        { risk: 'Listing photo accuracy', severity: light?.light_assessment?.artificial_enhancement_suspected ? 'medium' : 'low', mitigation: 'Verify all key claims in person before making offer.' },
        { risk: 'Noise environment', severity: loc.traffic_exposure === 'high' ? 'high' : 'medium', mitigation: 'Visit at multiple times of day and evening before committing.' },
        { risk: 'Market liquidity', severity: 'low', mitigation: 'Research recent comparable sales in the immediate area.' },
      ],
    },
  }
}

// ─── SHARED PIPELINE ─────────────────────────────────────────────────────────

async function runPipeline(propertyId: string, jobId: string, listing: FullCapturePayload) {
  const supabase = getSupabase()
  try {
    // 1. Geocode
    const geo = await geocodeAddress(listing.address)
    await supabase.from('ingest_jobs').update({ geocode_done: true }).eq('id', jobId)

    const lat = geo?.lat ?? 34.0522
    const lng = geo?.lng ?? -118.2437

    if (geo) {
      await supabase.from('properties').update({
        lat: geo.lat, lng: geo.lng,
        city: geo.city, state: geo.state, zip: geo.zip,
      }).eq('id', propertyId)
    }

    // 2. Location insights
    const loc = await generateLocationInsights(lat, lng)
    await supabase.from('ingest_jobs').update({ location_insights_done: true }).eq('id', jobId)

    // 3. Save location insights to location_insights table
    await supabase.from('location_insights').upsert({
      space_id: null,       // null for property-based ingestion
      property_id: propertyId,
      ...loc,
    }, { onConflict: 'property_id' }).select()

    // 4. Photo analysis
    const photoInsights = listing.image_urls?.length > 0
      ? await analyzePhotos(listing.image_urls)
      : null

    if (photoInsights) {
      await supabase.from('properties').update({
        photo_insights_json: photoInsights,
        photo_insights_at: new Date().toISOString(),
      }).eq('id', propertyId)
    }
    await supabase.from('ingest_jobs').update({ photo_analysis_done: true }).eq('id', jobId)

    // 5. Fetch property for certificate
    const { data: prop } = await supabase.from('properties').select('*').eq('id', propertyId).single()
    if (!prop) throw new Error('Property not found for certificate generation')

    // 6. Generate certificate
    const tier = 'normal' // upgrade when auth + subscription are live
    const certificate = buildCertificate(
      { title: prop.title, address: prop.address, city: prop.city || '', price: prop.price, beds: prop.beds, baths: prop.baths, sqft: prop.sqft, year_built: prop.year_built, property_type: prop.property_type },
      loc,
      photoInsights,
      tier
    )

    const { data: cert } = await supabase.from('certificates').insert({
      property_id: propertyId,
      space_id: null,
      tier,
      status: 'done',
      version: '1.0.0',
      certificate_json: certificate,
      completed_at: new Date().toISOString(),
    }).select().single()

    if (!cert) throw new Error('Certificate insert failed')

    // Backfill cert ID into JSON meta
    await supabase.from('certificates').update({
      certificate_json: { ...certificate, meta: { ...certificate.meta, id: cert.id } }
    }).eq('id', cert.id)

    // Update property + job
    await supabase.from('properties').update({ status: 'done' }).eq('id', propertyId)
    await supabase.from('ingest_jobs').update({
      certificate_done: true,
      certificate_id: cert.id,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)

    return { certificate_id: cert.id }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    await supabase.from('properties').update({ status: 'error', error_message: msg }).eq('id', propertyId)
    await supabase.from('ingest_jobs').update({ error_message: msg }).eq('id', jobId)
    throw error
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body: IngestBody = await request.json()

    // ── BRANCH A: full_capture (bookmarklet) ──────────────────────────────
    if (isFullCapture(body)) {
      const listing = body.listing

      if (!listing.source_url) return Response.json({ error: 'Missing source_url' }, { status: 400 })
      if (!listing.address || listing.address.length < 5) return Response.json({ error: 'Missing address' }, { status: 400 })

      // Upsert source
      const { data: source } = await supabase
        .from('property_sources')
        .upsert({ source: detectSource(listing.source_url) as 'zillow' | 'redfin' | 'realtor' | 'manual', ingest_mode: 'full_capture', source_url: listing.source_url, external_id: listing.external_id || null, raw_json: listing }, { onConflict: 'source_url' })
        .select().single()

      // Create property
      const { data: property } = await supabase.from('properties').insert({
        source_id: source?.id,
        title: listing.title,
        address: listing.address,
        price: listing.price,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        year_built: listing.year_built,
        property_type: listing.property_type,
        description: listing.description,
        image_urls: listing.image_urls || [],
        status: 'processing',
      }).select().single()

      if (!property) return Response.json({ error: 'Failed to create property record' }, { status: 500 })

      // Create job
      const { data: job } = await supabase.from('ingest_jobs').insert({ property_id: property.id }).select().single()
      if (!job) return Response.json({ error: 'Failed to create job' }, { status: 500 })

      // Run pipeline
      const result = await runPipeline(property.id, job.id, listing)

      return Response.json({
        certificate_id: result.certificate_id,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${result.certificate_id}`,
        property_id: property.id,
        mode: 'full_capture',
      }, { status: 201 })
    }

    // ── BRANCH B: url_only (mobile share) ─────────────────────────────────
    if ('url' in body && body.url) {
      const sourceUrl = body.url

      if (!sourceUrl.includes('zillow.com') && !sourceUrl.includes('redfin.com') && !sourceUrl.includes('realtor.com')) {
        return Response.json({ error: 'Unsupported listing URL. Paste a Zillow, Redfin, or Realtor.com link.' }, { status: 400 })
      }

      // Try server-side scrape first
      const scraped = await attemptServerScrape(sourceUrl)
      const scrapeSuccess = !!scraped?.address

      // Upsert source
      const { data: source } = await supabase
        .from('property_sources')
        .upsert({
          source: detectSource(sourceUrl) as 'zillow' | 'redfin' | 'realtor' | 'manual',
          ingest_mode: 'url_only',
          source_url: sourceUrl,
          raw_json: scraped || { source_url: sourceUrl },
          scrape_attempted_at: new Date().toISOString(),
          scrape_success: scrapeSuccess,
          scrape_provider: process.env.APIFY_API_KEY ? 'apify' : 'none',
        }, { onConflict: 'source_url' })
        .select().single()

      const confirmationToken = generateConfirmationToken()
      const needsConfirmation = !scrapeSuccess || !scraped?.address

      // Create property (partial if scrape failed)
      const { data: property } = await supabase.from('properties').insert({
        source_id: source?.id,
        title: scraped?.title || null,
        address: scraped?.address || 'Pending confirmation',
        price: scraped?.price || null,
        beds: scraped?.beds || null,
        baths: scraped?.baths || null,
        sqft: scraped?.sqft || null,
        year_built: scraped?.year_built || null,
        property_type: scraped?.property_type || null,
        description: scraped?.description || null,
        image_urls: scraped?.image_urls || [],
        needs_confirmation: needsConfirmation,
        confirmation_token: confirmationToken,
        status: needsConfirmation ? 'needs_confirmation' : 'processing',
      }).select().single()

      if (!property) return Response.json({ error: 'Failed to create property record' }, { status: 500 })

      if (needsConfirmation) {
        // Return confirmation URL — SMS bot will send this to the user
        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm/${confirmationToken}`
        return Response.json({
          status: 'needs_confirmation',
          property_id: property.id,
          confirmation_url: confirmUrl,
          confirmation_token: confirmationToken,
          message: 'Could not extract listing data. Please confirm the address via the link.',
          mode: 'url_only',
        }, { status: 202 })
      }

      // Scrape succeeded — run full pipeline
      const { data: job } = await supabase.from('ingest_jobs').insert({ property_id: property.id }).select().single()
      if (!job) return Response.json({ error: 'Failed to create job' }, { status: 500 })

      const result = await runPipeline(property.id, job.id, scraped as FullCapturePayload)

      return Response.json({
        certificate_id: result.certificate_id,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${result.certificate_id}`,
        property_id: property.id,
        mode: 'url_only',
      }, { status: 201 })
    }

    return Response.json({ error: 'Invalid request body. Send { listing: {...} } or { url: "..." }' }, { status: 400 })

  } catch (error: unknown) {
    console.error('/api/ingest error:', error)
    return Response.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}