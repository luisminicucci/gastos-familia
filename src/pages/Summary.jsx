import { useState } from 'react';
import { useStore } from '../store.jsx';
import { entriesForMonth, money, monthLabel, monthShort, sum } from '../lib.js';
import { Dot, MonthPicker, PageHead } from '../ui.jsx';

export default function Summary() {
  const { expenses, month, members, categories } = useStore();
  const [vista, setVista] = useState('cat');

  const meses = [5, 4, 3, 2, 1, 0].map((i) => {
    const k = month - i;
    return { k, total: sum(entriesForMonth(expenses, k)) };
  });
  const max = Math.max(1, ...meses.map((m) => m.total));
  const entries = entriesForMonth(expenses, month);
  const total = sum(entries);
  const prev = meses[4].total;

  const grupos = vista === 'cat'
    ? [...categories, { id: null, name: 'Sin categoría', color: '#8C9A95' }].map((c) => ({ id: c.id, name: c.name, color: c.color, v: sum(entries.filter((e) => (e.category_id || null) === c.id)) }))
    : [...members, { id: null, display_name: 'Sin asignar', color: '#8C9A95' }].map((m) => ({ id: m.id, name: m.display_name, color: m.color, v: sum(entries.filter((e) => (e.paid_by || null) === m.id)) }));
  const filas = grupos.filter((g) => g.v > 0).sort((a, b) => b.v - a.v);
  const top = filas[0]?.v || 1;

  return (
    <div className="page">
      <PageHead title="Resumen" />
      <MonthPicker />
      <div className="kpis">
        <div className="card kpi"><span className="muted small">Total {monthLabel(month).toLowerCase()}</span><span className="kpi-num">{money(total)}</span></div>
        <div className="card kpi"><span className="muted small">Mes anterior</span><span className="kpi-num">{money(prev)}</span></div>
        <div className="card kpi"><span className="muted small">Promedio mensual</span><span className="kpi-num">{money(meses.filter((m) => m.total > 0).reduce((t, m) => t + m.total, 0) / Math.max(1, meses.filter((m) => m.total > 0).length))}</span></div>
      </div>

      <div className="summarygrid">
        <section className="card stack12">
          <h2 className="cardtitle">Gasto por mes</h2>
          <div className="chart" role="img" aria-label="Gasto de los últimos 6 meses">
            {meses.map((m) => (
              <div key={m.k} className="chartcol">
                <span className="chartval">{m.total >= 1000 ? Math.round(m.total / 1000) + 'k' : Math.round(m.total)}</span>
                <div className="chartbar" style={{ height: Math.max(2, (m.total / max) * 140) + 'px', background: m.k === month ? 'var(--accent)' : '#B9CFC8' }} />
                <span className="chartlbl">{monthShort(m.k)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card stack12">
          <div className="segmented">
            <button type="button" className={vista === 'cat' ? 'on' : ''} onClick={() => setVista('cat')}>Por categoría</button>
            <button type="button" className={vista === 'per' ? 'on' : ''} onClick={() => setVista('per')}>Por persona</button>
          </div>
          {filas.length === 0 && <p className="muted">Sin gastos en este mes.</p>}
          {filas.map((f) => (
            <div key={f.id || 'none'} className="row gap10">
              <Dot color={f.color} />
              <div className="grow stack6">
                <div className="row between"><span className="strong">{f.name}</span><span className="strong">{money(f.v)}</span></div>
                <div className="bar thin"><div style={{ width: (f.v / top) * 100 + '%', background: f.color }} /></div>
              </div>
              <span className="muted small pctcol">{Math.round((f.v / (total || 1)) * 100)}%</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
