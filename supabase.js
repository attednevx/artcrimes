import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://nxzmegxvgzllhkvkaczt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54em1lZ3h2Z3psbGhrdmthY3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODg4MzIsImV4cCI6MjA4Nzk2NDgzMn0.-sRpnkAZB3FbCX9fgKX126r9xVioPdHwp86HI17F4uQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
