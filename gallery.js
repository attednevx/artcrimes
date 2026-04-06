import { supabase } from './supabase.js'

// ── Browser Fingerprint ──────────────────────────────────────
// Simple hash of user-agent + screen + timezone. Not perfect, but
// good enough as a lightweight identifier for a free game.
let _fingerprint = null
export function getFingerprint() {
  if (_fingerprint) return _fingerprint
  const raw = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset()
  ].join('|')
  // Simple djb2 hash
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0
  }
  _fingerprint = hash.toString(36)
  return _fingerprint
}


// ── Submit Drawing ───────────────────────────────────────────
export async function submitDrawing(canvasId, displayName = 'Anonymous', replayData = null, userId = null) {
  const canvas = document.getElementById(canvasId)

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.7)
  )

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const today = new Date().toISOString().slice(0, 10)

  const { data: uploadData, error: uploadError } = await supabase
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

  const row = {
    topic_date: today,
    image_url: publicUrl,
    display_name: displayName
  }
  if (userId) row.user_id = userId
  if (replayData && replayData.actions && replayData.actions.length > 0) {
    row.replay_data = replayData
  }

  const { error: dbError } = await supabase
    .from('submissions')
    .insert(row)

  if (dbError) {
    console.error('DB error:', dbError)
    return { success: false, error: dbError }
  }

  return { success: true, url: publicUrl }
}


// ── Fetch Today's Submissions ────────────────────────────────
export async function getTodaysSubmissions() {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('topic_date', today)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Fetch error:', error)
    return []
  }

  return data
}


// ── Check if user already submitted today ───────────────────
export async function hasUserSubmittedToday(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('topic_date', today)
    .limit(1)

  if (error) return false
  return data && data.length > 0
}

// ── Recap: yesterday's submissions ──────────────────────────
export async function getYesterdaySubmissions() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('topic_date', yesterday)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Fetch error:', error)
    return []
  }
  return data
}


// ── Profile Queries ─────────────────────────────────────────

// Fetch all submissions by a display name
export async function getSubmissionsByUser(displayName) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('display_name', displayName)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('User submissions fetch error:', error)
    return []
  }
  return data
}

// Get top active users (by submission count) — returns [{display_name, count, total_likes}]
export async function getTopUsers(limit = 10) {
  const { data, error } = await supabase
    .from('submissions')
    .select('display_name, likes')

  if (error) {
    console.error('Top users fetch error:', error)
    return []
  }

  const stats = {}
  data.forEach(s => {
    const name = s.display_name || 'Anonymous'
    if (!stats[name]) stats[name] = { display_name: name, count: 0, total_likes: 0 }
    stats[name].count++
    stats[name].total_likes += (s.likes || 0)
  })

  return Object.values(stats)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}


// ── Likes (Supabase-backed) ──────────────────────────────────

// Check which submissions this browser has liked (batch query)
export async function getMyLikes(submissionIds) {
  if (!submissionIds.length) return new Set()
  const fp = getFingerprint()

  const { data, error } = await supabase
    .from('likes')
    .select('submission_id')
    .eq('user_fingerprint', fp)
    .in('submission_id', submissionIds)

  if (error) {
    console.error('Likes fetch error:', error)
    return new Set()
  }

  return new Set(data.map(r => r.submission_id))
}

// Toggle like: insert or delete from likes table, then update submission count
export async function toggleLikeServer(submissionId) {
  const fp = getFingerprint()

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_fingerprint', fp)
    .limit(1)

  if (existing && existing.length > 0) {
    // Unlike: delete the like row
    await supabase
      .from('likes')
      .delete()
      .eq('submission_id', submissionId)
      .eq('user_fingerprint', fp)

    // Decrement count
    await supabase.rpc('decrement_likes', { row_id: submissionId })

    // Update localStorage cache
    const cache = JSON.parse(localStorage.getItem('artcrimes_liked_cache') || '{}')
    delete cache[submissionId]
    localStorage.setItem('artcrimes_liked_cache', JSON.stringify(cache))

    return { liked: false }
  } else {
    // Like: insert
    const { error } = await supabase
      .from('likes')
      .insert({ submission_id: submissionId, user_fingerprint: fp })

    if (error) {
      console.error('Like insert error:', error)
      return { liked: false, error }
    }

    // Increment count
    await supabase.rpc('increment_likes', { row_id: submissionId })

    // Update localStorage cache
    const cache = JSON.parse(localStorage.getItem('artcrimes_liked_cache') || '{}')
    cache[submissionId] = true
    localStorage.setItem('artcrimes_liked_cache', JSON.stringify(cache))

    return { liked: true }
  }
}

// Get fresh like count for a single submission
export async function getLikeCount(submissionId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('likes')
    .eq('id', submissionId)
    .single()

  if (error) return 0
  return data.likes || 0
}

// Quick check from localStorage cache (for instant UI before server responds)
export function isLikedCached(submissionId) {
  const cache = JSON.parse(localStorage.getItem('artcrimes_liked_cache') || '{}')
  return !!cache[submissionId]
}


// ── Ratings (Supabase-backed) ────────────────────────────────

// Upsert a 1-5 star rating for a submission
export async function rateSubmission(submissionId, rating) {
  const fp = getFingerprint()
  rating = Math.max(1, Math.min(5, Math.round(rating)))

  // Check if already rated
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_fingerprint', fp)
    .limit(1)

  if (existing && existing.length > 0) {
    // Update existing rating
    const { error } = await supabase
      .from('ratings')
      .update({ rating })
      .eq('submission_id', submissionId)
      .eq('user_fingerprint', fp)

    if (error) {
      console.error('Rating update error:', error)
      return { success: false, error }
    }
  } else {
    // Insert new rating
    const { error } = await supabase
      .from('ratings')
      .insert({ submission_id: submissionId, rating, user_fingerprint: fp })

    if (error) {
      console.error('Rating insert error:', error)
      return { success: false, error }
    }
  }

  // Cache locally
  const cache = JSON.parse(localStorage.getItem('artcrimes_ratings_cache') || '{}')
  cache[submissionId] = rating
  localStorage.setItem('artcrimes_ratings_cache', JSON.stringify(cache))

  return { success: true, rating }
}

// Get average rating for a submission
export async function getAverageRating(submissionId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('submission_id', submissionId)

  if (error || !data || !data.length) return { avg: 0, count: 0 }
  const sum = data.reduce((a, r) => a + r.rating, 0)
  return { avg: sum / data.length, count: data.length }
}

// Batch: get this user's ratings for a list of submission IDs
export async function getMyRatings(submissionIds) {
  if (!submissionIds.length) return {}
  const fp = getFingerprint()

  const { data, error } = await supabase
    .from('ratings')
    .select('submission_id, rating')
    .eq('user_fingerprint', fp)
    .in('submission_id', submissionIds)

  if (error) return {}
  const map = {}
  data.forEach(r => { map[r.submission_id] = r.rating })
  return map
}


// ── Comments (Supabase-backed) ───────────────────────────────

export async function getComments(submissionId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Comments fetch error:', error)
    return []
  }
  return data
}

export async function addComment(submissionId, displayName, content) {
  const fp = getFingerprint()

  // Rate-limit: max 1 comment per submission per fingerprint
  const { data: existing } = await supabase
    .from('comments')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_fingerprint', fp)
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: 'already_commented' }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      submission_id: submissionId,
      display_name: displayName || 'Anonymous',
      content: content.slice(0, 500),
      user_fingerprint: fp
    })
    .select()

  if (error) {
    console.error('Comment insert error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}
