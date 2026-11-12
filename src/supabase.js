import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const configured = !SUPABASE_URL.startsWith('PEGAR');
export const supabase = createClient(configured ? SUPABASE_URL : 'https://example.supabase.co', SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
