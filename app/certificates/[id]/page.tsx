import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, spaces(*)')
    .eq('id', params.id)
    .single()

  if (error || !cert) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <p>Error: {error?.message}</p>
      <p>ID: {params.id}</p>
    </div>
  }

  return <div style={{ padding: '2rem' }}>
    <pre>{JSON.stringify(cert, null, 2)}</pre>
  </div>
}
