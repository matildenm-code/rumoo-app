import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, spaces(*)')
    .eq('id', id)
    .single()

  if (error || !cert) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <p>Error: {error?.message}</p>
      <p>ID: {id}</p>
    </div>
  }

  return <div style={{ padding: '2rem' }}>
    <pre>{JSON.stringify(cert, null, 2)}</pre>
  </div>
}
