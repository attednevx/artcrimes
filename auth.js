// ==== ART CRIMES — Auth Module (Supabase Magic Link) ====
import { supabase } from './supabase.js'

// ── Current User ─────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ── Session (synchronous-ish, uses cached session) ───────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Profile ──────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Profile fetch error:', error)
    return null
  }
  return data
}

export async function getCurrentProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  return await getProfile(user.id)
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .single()

  if (error) return null
  return data
}

// ── Magic Link ───────────────────────────────────────────
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Google OAuth ─────────────────────────────────────────
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Username ─────────────────────────────────────────────
export async function claimUsername(username) {
  const { data, error } = await supabase.rpc('claim_username', {
    desired_username: username
  })
  if (error) return { success: false, error: error.message }
  return data // { success: true } or { success: false, error: '...' }
}

export async function isUsernameAvailable(username) {
  const { data, error } = await supabase.rpc('check_username', {
    desired_username: username
  })
  if (error) return { available: false, error: error.message }
  return data // { available: true } or { available: false, error: '...' }
}

// ── Profile Updates ──────────────────────────────────────
export async function updateProfile(updates) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Logout ───────────────────────────────────────────────
export async function logout() {
  const { error } = await supabase.auth.signOut()
  return !error
}

// ── Auth State Listener ─────────────────────────────────
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// ── Helper: needs username setup? ────────────────────────
export function needsUsername(profile) {
  return profile && profile.username && profile.username.startsWith('user_')
}
