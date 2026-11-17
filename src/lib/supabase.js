import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from './config.js'
import { captureGoogleRedirect } from './gcal.js'

captureGoogleRedirect() // Google Calendar-ის ტოკენი სესიად რომ არ მიიჩნიოს

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
