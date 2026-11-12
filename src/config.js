// Datos de conexión a Supabase. La clave "anon" está pensada para ir en la web:
// la seguridad la dan las reglas de la base (cada familia ve solo lo suyo).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xlwnzlvgtpiqguumqbal.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5gj1parCAPImvn-z0VWq7w_cTawz9y8';
