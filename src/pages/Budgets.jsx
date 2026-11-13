import { useState } from 'react';
import { useStore } from '../store.jsx';
import { supabase } from '../supabase.js';
import { entriesForMonth, money, sum } from '../lib.js';
import { Bar, Dot, MonthPicker, PageHead } from '../ui.jsx';

export default function Budgets() {
  const { expenses, month, activeCategories, activeRubros, loadAll } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const entries = entriesForMonth(expenses, month);
  const total = sum(entries);
  const budget = activeCategories.reduce((t, c) => t + Number(c.budget), 0);

  const conRubro = activeRubros.length > 0;
  const grupos = conRubro
    ? [...activeRubros, { id: null, name: 'Sin rubro', color: '#8C9A95' }].map((r) => ({
        ...r, header: true,
        cats: activeCategories.filter((c) => (activeRubros.some((x) => x.id === c.rubro_id) ? c.rubro_id : null) === r.id)
      })).filter((g) => g.cats.length)
    : [{ id: null, header: false, cats: activeCategories }];
  for (const g of grupos) {
    g.budget = g.cats.reduce((t, c) => t + Number(c.budget), 0);
    g.gastado = sum(entries.filter((e) => g.cats.some((c) => c.id === e.category_id)));
  }

  function empezar() {
    setDraft(Object.fromEntries(activeCategories.map((c) => [c.id, String(Number(c.budget) || '')])));
    setEditing(true);
  }
  async function guardar() {
    setBusy(true);
    const cambios = activeCategories.filter((c) => Number(draft[c.id] || 0) !== Number(c.budget));
    for (const c of cambios) {
      const v = Number(String(draft[c.id] || '0').replace(/\./g, '').replace(',', '.')) || 0;
      const { error } = await supabase.from('categories').update({ budget: v }).eq('id', c.id);
      if (error) { alert(error.message); break; }
    }
    await loadAll();
    setBusy(false);
    setEditing(false);
  }

  return (
    <div className="page">
      <PageHead title="Presupuestos">
        {editing
          ? <><button type="button" className="btn" onClick={() => setEditing(false)}>Cancelar</button><button type="button" className="btn primary" disabled={busy} onClick={guardar}>Guardar</button></>
          : <button type="button" className="btn" onClick={empezar}>Editar montos</button>}
      </PageHead>
      <MonthPicker />
      <div className="kpis">
        <div className="card kpi"><span className="muted small">Presupuesto mensual</span><span className="kpi-num">{money(budget)}</span></div>
        <div className="card kpi"><span className="muted small">Gastado</span><span className="kpi-num">{money(total)}</span></div>
        <div className="card kpi"><span className="muted small">{total <= budget ? 'Disponible' : 'Excedido'}</span><span className={'kpi-num ' + (total <= budget ? 'accent' : 'warn')}>{money(Math.abs(budget - total))}</span></div>
      </div>
      <section className="card stack4">
        <p className="muted small">El presupuesto es el mismo todos los meses. Las compras en cuotas cuentan solo la cuota de cada mes.</p>
        {grupos.map((g) => (
          <div key={g.id || 'none'} className="stack4">
            {g.header && (
              <div className="rubrohead">
                <Dot color={g.color} /><span className="grow rubroname">{g.name}</span>
                <span className="nowrap">{money(g.gastado)}{g.budget > 0 && ` de ${money(g.budget)}`}</span>
              </div>
            )}
          {g.cats.map((c) => {
            const gas = sum(entries.filter((e) => e.category_id === c.id));
            const b = Number(c.budget);
            const pct = b ? (gas / b) * 100 : 0;
            return (
              <div key={c.id} className="budgetrow">
                <div className="row gap8">
                  <Dot color={c.color} />
                  <span className="grow strong">{c.name}</span>
                  {editing ? (
                    <label className="row gap6 small"><span className="muted">$</span>
                      <input className="budget-input" inputMode="numeric" aria-label={'Presupuesto de ' + c.name}
                        value={draft[c.id] ?? ''} onChange={(e) => setDraft({ ...draft, [c.id]: e.target.value })} placeholder="0" />
                    </label>
                  ) : b > 0 ? <span className={'small strong ' + (pct >= 85 ? 'warn' : 'muted')}>{Math.round(pct)}%</span> : <span className="small muted">Sin límite</span>}
                </div>
                {!editing && b > 0 && <Bar pct={pct} warn={pct >= 85} />}
                {!editing && <span className="muted small">{b > 0 ? `${money(gas)} de ${money(b)} · ${gas <= b ? 'quedan ' + money(b - gas) : 'excedido ' + money(gas - b)}` : `Gastado ${money(gas)}`}</span>}
              </div>
            );
          })}
          </div>
        ))}
      </section>
    </div>
  );
}
