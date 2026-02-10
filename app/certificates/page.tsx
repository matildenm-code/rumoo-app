// app/certificates/page.tsx
// Place this file at: app/certificates/page.tsx

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getCertificates() {
  const { data } = await supabase
    .from('certificates')
    .select('*, spaces(*)')
    .eq('status', 'done')
    .order('created_at', { ascending: false })
  return data || []
}

export default async function CertificatesPage() {
  const certs = await getCertificates()

  const stateColor: Record<string, string> = {
    'Strong': '#059669',
    'Stable': '#3B82F6',
    'Fragile': '#F59E0B',
    'Declining': '#EF4444',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F7F4',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cert-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; }
        .cert-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(248,247,244,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E7E5E0',
        padding: '0 2rem', height: '56px',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#1C1917',
        }}>Rumoo</span>
      </nav>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '0.5rem' }}>
            {certs.length} Certificates
          </p>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 400, letterSpacing: '-0.02em', color: '#1C1917',
          }}>
            All Certificates
          </h1>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {certs.map((cert: any) => {
            const state = cert.certificate_json?.experience_barometer?.state
            const color = stateColor[state] || '#6B7280'
            const isPro = cert.tier === 'pro'

            return (
              <Link key={cert.id} href={`/certificates/${cert.id}`} style={{ textDecoration: 'none' }}>
                <div className="cert-card" style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid #E7E5E0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      backgroundColor: color + '15',
                      border: `1.5px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1C1917', marginBottom: '0.15rem' }}>
                        {cert.spaces?.name}
                      </p>
                      <p style={{ fontSize: '0.775rem', color: '#A8A29E' }}>
                        {cert.spaces?.neighborhood} · {cert.spaces?.area_m2}m² · Floor {cert.spaces?.floor}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: color,
                      backgroundColor: color + '12',
                      padding: '3px 8px', borderRadius: '6px',
                    }}>{state}</span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                      backgroundColor: isPro ? '#1C1917' : '#F0F9FF',
                      color: isPro ? '#F8F7F4' : '#1D4ED8',
                      padding: '3px 8px', borderRadius: '6px',
                      border: isPro ? 'none' : '1px solid #BFDBFE',
                    }}>{isPro ? 'PRO' : 'STD'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="#C8C4BC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
