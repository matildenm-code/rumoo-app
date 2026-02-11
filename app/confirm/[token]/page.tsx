'use client'

// app/confirm/[token]/page.tsx
// Lightweight form shown when url_only scrape couldn't extract full listing data.
// User fills in missing fields → triggers pipeline to complete.

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

type PropertyData = {
  id: string
  title: string | null
  address: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  year_built: number | null
  property_type: string | null
  image_urls: string[]
  source_id: string
}

export default function ConfirmPage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()

  const [property, setProperty] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    address: '',
    price: '',
    beds: '',
    baths: '',
    sqft: '',
    year_built: '',
    property_type: 'Single Family',
  })

  useEffect(() => {
    fetch(`/api/confirm/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setProperty(data)
        setForm(prev => ({
          ...prev,
          address: data.address !== 'Pending confirmation' ? data.address : '',
          price: data.price ? String(data.price) : '',
          beds: data.beds ? String(data.beds) : '',
          baths: data.baths ? String(data.baths) : '',
          sqft: data.sqft ? String(data.sqft) : '',
          year_built: data.year_built ? String(data.year_built) : '',
          property_type: data.property_type || 'Single Family',
        }))
        setLoading(false)
      })
      .catch(() => { setError('Could not load property data.'); setLoading(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.address.trim()) { setError('Address is required'); return }
    setSubmitting(true)
    setError(null)

    const res = await fetch(`/api/confirm/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: form.address,
        price: form.price ? parseInt(form.price.replace(/[^0-9]/g, '')) : null,
        beds: form.beds ? parseFloat(form.beds) : null,
        baths: form.baths ? parseFloat(form.baths) : null,
        sqft: form.sqft ? parseInt(form.sqft) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        property_type: form.property_type,
      }),
    })

    const data = await res.json()
    if (data.certificate_id) {
      router.push(`/certificates/${data.certificate_id}`)
    } else {
      setError(data.error || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏠</div>
          Loading your listing...
        </div>
      </div>
    )
  }

  // ── NOT FOUND ──────────────────────────────────────────────────────────────
  if (!property && error) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: 'system-ui', color: '#111827', marginBottom: 8 }}>Link Expired</h2>
          <p style={{ color: '#6B7280', fontFamily: 'system-ui' }}>
            This confirmation link has expired or already been used. Send the listing URL again to get a new one.
          </p>
        </div>
      </div>
    )
  }

  // ── FORM ───────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'system-ui, sans-serif',
    color: '#111827',
    background: '#fff',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
    fontFamily: 'system-ui, sans-serif',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'system-ui', color: '#111827' }}>Rumoo</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', fontFamily: 'system-ui', margin: '0 0 8px' }}>
            Confirm listing details
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', fontFamily: 'system-ui', margin: 0, lineHeight: 1.5 }}>
            We couldn't automatically extract all the details from this listing. Fill in what you can — the more you provide, the better the analysis.
          </p>
        </div>

        {/* Source URL badge */}
        {property && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', marginBottom: 24, fontSize: 13, color: '#6B7280', fontFamily: 'system-ui', wordBreak: 'break-all' }}>
            🔗 From listing URL
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20, marginBottom: 16 }}>

            {/* Address — required */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                Full address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                style={inputStyle}
                placeholder="e.g. 1234 Maple Ave, Los Angeles, CA 90024"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                required
              />
            </div>

            {/* Price */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Listing price</label>
              <input
                style={inputStyle}
                placeholder="e.g. 1,250,000"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                inputMode="numeric"
              />
            </div>

            {/* Beds / Baths in a row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <input
                  style={inputStyle}
                  placeholder="3"
                  value={form.beds}
                  onChange={e => setForm(f => ({ ...f, beds: e.target.value }))}
                  inputMode="decimal"
                />
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <input
                  style={inputStyle}
                  placeholder="2"
                  value={form.baths}
                  onChange={e => setForm(f => ({ ...f, baths: e.target.value }))}
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Sqft / Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Square feet</label>
                <input
                  style={inputStyle}
                  placeholder="1,400"
                  value={form.sqft}
                  onChange={e => setForm(f => ({ ...f, sqft: e.target.value }))}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label style={labelStyle}>Year built</label>
                <input
                  style={inputStyle}
                  placeholder="1985"
                  value={form.year_built}
                  onChange={e => setForm(f => ({ ...f, year_built: e.target.value }))}
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Property type */}
            <div>
              <label style={labelStyle}>Property type</label>
              <select
                style={{ ...inputStyle, appearance: 'auto' }}
                value={form.property_type}
                onChange={e => setForm(f => ({ ...f, property_type: e.target.value }))}
              >
                <option>Single Family</option>
                <option>Condo</option>
                <option>Townhouse</option>
                <option>Multi-Family</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 14, fontFamily: 'system-ui' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: submitting ? '#93C5FD' : '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: 'system-ui',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 200ms',
            }}
          >
            {submitting ? '⏳ Generating certificate...' : 'Analyze this property →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: 'system-ui', marginTop: 14 }}>
            Takes ~30 seconds. You'll see the full Rumoo certificate immediately.
          </p>
        </form>
      </div>
    </div>
  )
}