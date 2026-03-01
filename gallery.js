import { supabase } from './supabase.js'

// Upload drawing and save to DB
export async function submitDrawing(canvasId, displayName = 'Anonymous') {
  const canvas = document.getElementById(canvasId)
  
  // Convert canvas to compressed blob
  const blob = await new Promise(resolve => 
    canvas.toBlob(resolve, 'image/jpeg', 0.7)
  )
  
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const today = new Date().toISOString().slice(0, 10)

  // Upload image to storage
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('submissions')
    .upload(filename, blob, { contentType: 'image/jpeg' })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { success: false, error: uploadError }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('submissions')
    .getPublicUrl(filename)

  // Save record to DB
  const { error: dbError } = await supabase
    .from('submissions')
    .insert({
      topic_date: today,
      image_url: publicUrl,
      display_name: displayName
    })

  if (dbError) {
    console.error('DB error:', dbError)
    return { success: false, error: dbError }
  }

  return { success: true, url: publicUrl }
}

// Fetch today's submissions (last 20)
export async function getTodaysSubmissions() {
  const today = new Date().toISOString().slice(0, 10)
  
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('topic_date', today)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Fetch error:', error)
    return []
  }

  return data
}
