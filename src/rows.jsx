import { useNavigate } from 'react-router-dom';
import { useStore } from './store.jsx';
import { methodLabel, money, shortDate, currentMonth, monthKey, monthStart, todayStr } from './lib.js';
import { Icon } from './ui.jsx';
import { supabase } from './supabase.js';

export function ExpenseRow({ e }) {
  const { catById, memberById } = useStore();
  const nav = useNavigate();
  const cat = catById[e.category_id];
  const who = memberById[e.paid_by];
  const title = e.note || cat?.name || 'Gasto';
  const meta = [cat?.name, who?.display_name, methodLabel(e), shortDate(e.spent_on)].filter(Boolean).join(' · ');
  return (
    <button type="button" className="exprow" onClick={() => nav('/gasto/' + e.id)}>
      <span className="catbadge" style={{ background: (cat?.color || '#8C9A95') + '22', color: cat?.color || '#5B6B66' }}>
        {(cat?.name || '?').slice(0, 2).toUpperCase()}
      </span>
      <span className="grow col">
        <span className="exptitle">{title}{e.recurring_key && <Icon name="repeat" size={13} className="inline-ic" />}</span>
        <span className="muted small ellipsis">{meta}</span>
      </span>
      <span className="amount">{money(e.share)}</span>
    </button>
  );
}

// Gastos fijos del mes anterior que todavía no se cargaron este mes.
export function usePendingRecurring() {
  const { expenses, month } = useStore();
  const prev = expenses.filter((e) => e.recurring_key && monthKey(e.spent_on) === month - 1);
  const now = new Set(expenses.filter((e) => e.recurring_key && monthKey(e.spent_on) === month).map((e) => e.recurring_key));
  const seen = new Set();
  return prev.filter((e) => !now.has(e.recurring_key) && !seen.has(e.recurring_key) && seen.add(e.recurring_key));
}

export function PendingRecurring() {
  const { month, catById, loadAll, me } = useStore();
  const pend = usePendingRecurring();
  if (!pend.length) return null;
  async function cargar(e) {
    const spent_on = month === currentMonth() ? todayStr() : monthStart(month);
    const { error } = await supabase.from('expenses').insert({
      family_id: me.family_id, amount: e.amount, category_id: e.category_id, paid_by: e.paid_by,
      method: e.method, installments: 1, note: e.note, spent_on, recurring_key: e.recurring_key
    });
    if (error) alert(error.message); else loadAll();
  }
  return (
    <section className="card">
      <h2 className="cardtitle">Gastos fijos para cargar este mes</h2>
      <div className="col">
        {pend.map((e) => (
          <div key={e.id} className="row gap12 pendrow">
            <span className="grow col">
              <span className="exptitle">{e.note || catById[e.category_id]?.name}</span>
              <span className="muted small">El mes pasado: {money(e.amount)}</span>
            </span>
            <button type="button" className="btn small" onClick={() => cargar(e)}>Cargar</button>
          </div>
        ))}
      </div>
    </section>
  );
}
