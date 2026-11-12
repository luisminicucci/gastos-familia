import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { currentMonth, monthStart } from './lib.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

// Cuántos meses hacia atrás traemos (alcanza para cuotas largas y reportes).
const MESES_HISTORIA = 24;

async function fetchAll(query) {
  const page = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await query().range(from, from + page - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < page) return rows;
    from += page;
  }
}

export function StoreProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [me, setMe] = useState(undefined); // undefined = cargando, null = sin familia
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    if (!session) return;
    try {
      const { data: mine, error: e1 } = await supabase.from('members').select('*').eq('user_id', session.user.id).maybeSingle();
      if (e1) throw e1;
      if (!mine) { setMe(null); return; }
      const since = monthStart(currentMonth() - MESES_HISTORIA);
      const [fam, mem, cat, exp] = await Promise.all([
        supabase.from('families').select('*').eq('id', mine.family_id).single(),
        supabase.from('members').select('*').order('created_at'),
        supabase.from('categories').select('*').order('sort'),
        fetchAll(() => supabase.from('expenses').select('*').gte('spent_on', since).order('spent_on', { ascending: false }))
      ]);
      for (const r of [fam, mem, cat]) if (r.error) throw r.error;
      setFamily(fam.data);
      setMembers(mem.data);
      setCategories(cat.data);
      setExpenses(exp);
      setMe(mine);
      setError('');
    } catch (err) {
      setError(err.message || String(err));
    }
  }, [session]);

  useEffect(() => {
    if (session) loadAll();
    else if (session === null) { setMe(undefined); setExpenses([]); }
  }, [session, loadAll]);

  // Cambios en vivo: si otro integrante carga un gasto, aparece solo.
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel('cambios-familia')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `family_id=eq.${me.family_id}` }, () => loadAll())
      .subscribe();
    const onFocus = () => document.visibilityState === 'visible' && loadAll();
    document.addEventListener('visibilitychange', onFocus);
    return () => { supabase.removeChannel(ch); document.removeEventListener('visibilitychange', onFocus); };
  }, [me, loadAll]);

  const value = useMemo(() => {
    const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
    const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
    return {
      session, me, family, members, categories, expenses, month, setMonth, error, setError, loadAll,
      memberById, catById,
      activeCategories: categories.filter((c) => !c.archived)
    };
  }, [session, me, family, members, categories, expenses, month, error, loadAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
