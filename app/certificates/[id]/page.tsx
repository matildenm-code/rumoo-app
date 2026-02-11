import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getCertificate(id: string) {
  const { data } = await supabase
    .from('certificates')
    .select('*, spaces(*)')
    .eq('id', id)
    .single()
  return data
}

const STATE_COLORS: Record<string, string> = {
  'Strong': '#059669',
  'Stable': '#3B82F6',
  'Fragile': '#F59E0B',
  'Declining': '#EF4444',
}

const TRAJECTORY_ICON: Record<string, string> = {
  'Improving': '↗',
  'Stable': '→',
  'Declining': '↘',
}

const SIGNAL_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  positive: { bg: '#ECFDF5', border: '#10B981', text: '#047857', dot: '#10B981' },
  neutral:  { bg: '#F0F9FF', border: '#3B82F6', text: '#1D4ED8', dot: '#3B82F6' },
  sensitive:{ bg: '#FFFBEB', border: '#F59E0B', text: '#B45309', dot: '#F59E0B' },
  negative: { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C', dot: '#EF4444' },
}

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const cert = await getCertificate(params.id)
  if (!cert) return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Certificate not found.</div>

  const c = cert.certificate_json
  const space = cert.spaces
  const isPro = cert.tier === 'pro'
  const stateColor = STATE_COLORS[c.experience_barometer?.state] ?? '#6B7280'
  const trajectoryIcon = TRAJECTORY_ICON[c.experience_barometer?.trajectory] ?? '→'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: '#1C1917' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fade { animation: fadeUp 0.6s ease forwards; opacity: 0; }
        .d1 { animation-delay: 0.1s; } .d2 { animation-delay: 0.2s; } .d3 { animation-delay: 0.3s; } .d4 { animation-delay: 0.4s; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
        a { text-decoration: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(248,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E7E5E0', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/certificates" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#1C1917' }}>Rumoo</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: isPro ? '#1C1917' : '#F0F9FF', color: isPro ? '#F8F7F4' : '#1D4ED8', padding: '3px 10px', borderRadius: '999px', border: isPro ? 'none' : '1px solid #BFDBFE' }}>
            {isPro ? 'PRO' : 'Standard'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#A8A29E' }}>#{cert.id.slice(0, 8)}</span>
        </div>
      </nav>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* HEADER */}
        <div className="fade" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '0.4rem' }}>{space.city} · {space.neighborhood}</p>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#1C1917', marginBottom: '0.5rem' }}>
                {c.property_identity?.title || space.name}
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#78716C' }}>{space.address_label} · {space.area_m2}m² · Floor {space.floor} · {space.property_type}</p>
            </div>
            {space.listing_price && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '0.2rem' }}>Listed at</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#1C1917' }}>€{Number(space.listing_price).toLocaleString()}</p>
              </div>
            )}
          </div>
          <div style={{ height: '1px', backgroundColor: '#E7E5E0', marginTop: '1.75rem' }} />
        </div>

        {/* EXPERIENCE BAROMETER */}
        <div className="fade d1" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem', border: '1px solid #E7E5E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '1.25rem' }}>Experience Barometer</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: stateColor + '18', border: `2px solid ${stateColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: stateColor }} />
              </div>
              <div>
                <p style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#1C1917', lineHeight: 1.2 }}>{c.experience_barometer?.state}</p>
                <p style={{ fontSize: '0.8rem', color: '#78716C', marginTop: '1px' }}>{trajectoryIcon} {c.experience_barometer?.trajectory}</p>
              </div>
            </div>
            <div style={{ width: '1px', height: '44px', backgroundColor: '#E7E5E0', flexShrink: 0 }} />
            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#57534E', lineHeight: 1.55, flex: 1, minWidth: '180px', fontFamily: "'DM Serif Display', serif" }}>
              &ldquo;{c.experience_barometer?.one_sentence}&rdquo;
            </p>
          </div>
        </div>

        {/* SIGNALS */}
        <div className="fade d2" style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '1rem', paddingLeft: '0.25rem' }}>Signals</p>
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {c.signals?.map((signal: { name: string; state: string; short_explanation: string }, i: number) => {
              const colors = SIGNAL_COLORS[signal.state] ?? SIGNAL_COLORS.neutral
              return (
                <div key={i} className="card" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}30`, borderLeft: `3px solid ${colors.border}`, borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.dot, flexShrink: 0, marginTop: '6px' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, marginBottom: '0.2rem' }}>{signal.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#57534E', lineHeight: 1.5 }}>{signal.short_explanation}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* EXPERIENCE CAPITAL */}
        <div className="fade d3" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem', border: '1px solid #E7E5E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '1.5rem' }}>Experience Capital</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Generating', items: c.experience_capital?.generating, color: '#10B981' },
              { label: 'Preserving',  items: c.experience_capital?.preserving,  color: '#3B82F6' },
              { label: 'Draining',    items: c.experience_capital?.draining,    color: '#F59E0B' },
            ].map(({ label, items, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>{label}</p>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {(items as string[])?.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#292524', paddingLeft: '0.75rem', borderLeft: `2px solid ${color}30`, lineHeight: 1.4 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* EDITORIAL SUMMARY */}
        <div className="fade d4" style={{ backgroundColor: '#1C1917', borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', backgroundColor: '#292524', opacity: 0.6 }} />
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78716C', marginBottom: '1rem', position: 'relative' }}>Editorial Summary</p>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#D6D3D1', fontWeight: 300, position: 'relative' }}>{c.editorial_summary}</p>
        </div>

        {/* PRO ONLY */}
        {isPro && c.silence_and_drift && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '2rem 0 1rem', paddingLeft: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: '#1C1917', color: '#F8F7F4', padding: '3px 8px', borderRadius: '6px' }}>PRO</span>
              <div style={{ height: '1px', flex: 1, backgroundColor: '#E7E5E0' }} />
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem', border: '1px solid #E7E5E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '1.5rem' }}>Silence & Drift</p>
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {[
                  { label: 'Missing Elements',          items: c.silence_and_drift.missing_elements,          color: '#6B7280' },
                  { label: 'Hidden Risks',               items: c.silence_and_drift.hidden_risks,               color: '#EF4444' },
                  { label: 'Overlooked Opportunities',   items: c.silence_and_drift.overlooked_opportunities,   color: '#10B981' },
                ].map(({ label, items, color }) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {(items as string[])?.map((item, i) => (
                        <li key={i} style={{ fontSize: '0.825rem', color: '#57534E', paddingLeft: '1rem', position: 'relative', lineHeight: 1.5 }}>
                          <span style={{ position: 'absolute', left: 0, color }}>·</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {c.strategic_risks?.risks && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem', border: '1px solid #E7E5E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '1.25rem' }}>Strategic Risks</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(c.strategic_risks.risks as { risk: string; severity: string; mitigation: string }[]).map((risk, i) => {
                    const sc = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' }[risk.severity] ?? '#6B7280'
                    return (
                      <div key={i} style={{ padding: '1rem 1.25rem', backgroundColor: sc + '08', border: `1px solid ${sc}20`, borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1C1917' }}>{risk.risk}</p>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: sc, backgroundColor: sc + '15', padding: '2px 8px', borderRadius: '999px' }}>{risk.severity}</span>
                        </div>
                        <p style={{ fontSize: '0.775rem', color: '#78716C', lineHeight: 1.5 }}>{risk.mitigation}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #E7E5E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '0.875rem', color: '#A8A29E' }}>
            Rumoo · {new Date(cert.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#C8C4BC', letterSpacing: '0.04em' }}>v{cert.version} · {cert.tier.toUpperCase()}</span>
        </div>

      </main>
    </div>
  )
}
