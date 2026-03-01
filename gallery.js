import { supabase } from './supabase.js'

// Upload drawing and save to DB
export async function submitDrawing(canvasId, displayName = 'Anonymous') {
  const canvas = document.getElementById(canvasId)
  
  const blob = await new Promise(resolve => 
    canvas.toBlob(resolve, 'image/jpeg', 0.7)
  )
  
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const today = new Date().toISOString().slice(0, 10)

  const { error: uploadError } = await supabase
    .storage
    .from('submissions')
    .upload(filename, blob, { contentType: 'image/jpeg' })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { success: false, error: uploadError }
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from('submissions')
    .getPublicUrl(filename)

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

// Fetch today's submissions (last 20, skip reported)
export async function getTodaysSubmissions() {
  const today = new Date().toISOString().slice(0, 10)
  
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('topic_date', today)
    .eq('reported', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Fetch error:', error)
    return []
  }

  return data
}

// Like a submission
export async function likeSubmission(id) {
  const { error } = await supabase.rpc('increment_likes', { row_id: id })
  if (error) console.error('Like error:', error)
  return !error
}

// Dislike a submission
export async function dislikeSubmission(id) {
  const { error } = await supabase.rpc('increment_dislikes', { row_id: id })
  if (error) console.error('Funny error:', error)
  return !error
}

// Report a submission
export async function reportSubmission(id) {
  const { error } = await supabase
    .from('submissions')
    .update({ reported: true })
    .eq('id', id)
  if (error) console.error('Report error:', error)
  return !error
}

// === ADMIN ONLY ===

export async function getAllSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin fetch error:', error)
    return []
  }
  return data
}

export async function deleteSubmission(id, imageUrl) {
  const parts = imageUrl.split('/submissions/')
  const filename = parts[1] ? parts[1].split('?')[0] : null

  if (filename) {
    const { error: storageError } = await supabase
      .storage
      .from('submissions')
      .remove([filename])
    if (storageError) console.error('Storage delete error:', storageError)
  }

  const { error: dbError } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id)

  if (dbError) {
    console.error('DB delete error:', dbError)
    return false
  }
  return true
}

export async function restoreSubmission(id) {
  const { error } = await supabase
    .from('submissions')
    .update({ reported: false })
    .eq('id', id)
  if (error) console.error('Restore error:', error)
  return !error
}
