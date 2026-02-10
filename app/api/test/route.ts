import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      'https://htggnyatmvzpxxmzeesw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z2dueWF0bXZ6cHh4bXplZXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDc2NDksImV4cCI6MjA4NjE4MzY0OX0.vBlpc-JgvONCUMWqtyFeqJYAyqjKRRo9txmZfxyq3h8'
    )
    
    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('*')
    
    if (error) throw error
    
    return Response.json({
      success: true,
      message: 'Connected to Supabase!',
      spaces_count: spaces.length,
      spaces: spaces
    })
    
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

