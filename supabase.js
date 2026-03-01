import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://nxzmegxvgzllhkvkaczt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloanhudWxzcHJzeGJ1ZWx1d3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODYwNjIsImV4cCI6MjA4Nzk2MjA2Mn0.Qgo_SyCWakbzZ_g4LAl2C3CRhFbETvFGofEkHZh_A4I'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
