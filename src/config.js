// Datos de conexión a Supabase. La clave "anon" está pensada para ir en la web:
// la seguridad la dan las reglas de la base (cada familia ve solo lo suyo).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'PEGAR_PROJECT_URL';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGAR_ANON_KEY';
