import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { downloadCSV, entriesForMonth, methodLabel, money, monthLabel, shortDate, sum } from '../lib.js';
import { Dot, Icon, MonthPicker, PageHead } from '../ui.jsx';
import { ExpenseRow } from '../rows.jsx';

export default function Movements() {
  const { expenses, month, members, activeCategories, activeRubros, rubroById, catById, memberById } = useStore();
  const [rubro, setRubro] = useState('');
  const nav = useNavigate();
  const [persona, setPersona] = useState('');
  const [categoria, setCategoria] = useState('');
  const [q, setQ] = useState('');

  const all = entriesForMonth(expenses, month);
  const rows = all.filter((e) =>
    (!persona || e.paid_by === persona) &&
    (!categoria || e.category_id === categoria) &&
    (!rubro || (rubro === 'none' ? !catById[e.category_id]?.rubro_id : catById[e.category_id]?.rubro_id === rubro)) &&
    (!q || (e.note || '').toLowerCase().includes(q.toLowerCase())));

  function exportar() {
    downloadCSV(`gastos-${monthLabel(month).replace(' ', '-').toLowerCase()}.csv`, [
      ['Fecha', 'Detalle', 'Rubro', 'Categoría', 'Quién pagó', 'Medio', 'Cuotas', 'Monto total', 'Cuenta este mes'],
      ...rows.map((e) => [e.spent_on, e.note, rubroById[catById[e.category_id]?.rubro_id]?.name || '', catById[e.category_id]?.name || '', memberById[e.paid_by]?.display_name || '',
        e.method, e.installments, String(Number(e.amount)).replace('.', ','), String(Math.round(e.share * 100) / 100).replace('.', ',')])
    ]);
  }

  return (
    <div className="page">
      <PageHead title="Movimientos">
        <button type="button" className="btn" onClick={exportar}><Icon name="download" size={18} />Exportar a Excel</button>
      </PageHead>
      <MonthPicker />
      <div className="filters">
        <label className="field compact"><span className="sr">Persona</span>
          <select value={persona} onChange={(e) => setPersona(e.target.value)}>
            <option value="">Todos</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
          </select>
        </label>
        {activeRubros.length > 0 && (
          <label className="field compact"><span className="sr">Rubro</span>
            <select value={rubro} onChange={(e) => { setRubro(e.target.value); setCategoria(''); }}>
              <option value="">Todos los rubros</option>
              {activeRubros.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              <option value="none">Sin rubro</option>
            </select>
          </label>
        )}
        <label className="field compact"><span className="sr">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {activeCategories.filter((c) => !rubro || (rubro === 'none' ? !c.rubro_id : c.rubro_id === rubro)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field compact grow"><span className="sr">Buscar</span>
          <input type="search" placeholder="Buscar en las notas" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <p className="muted small">{rows.length} movimientos · Total {money(sum(rows))}</p>

      <section className="card flush mobile-only">
        {rows.length === 0 && <p className="muted empty">No hay movimientos.</p>}
        {rows.map((e) => <ExpenseRow key={e.id + (e.cuota || '')} e={e} />)}
      </section>

      <section className="card desktop-only">
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Detalle</th><th>Categoría</th><th>Quién</th><th>Medio</th><th className="num">Este mes</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id + (e.cuota || '')} onClick={() => nav('/gasto/' + e.id)} className="clickable">
                  <td className="muted">{shortDate(e.spent_on)}</td>
                  <td className="strong">{e.note || '—'}</td>
                  <td><span className="row gap6"><Dot color={catById[e.category_id]?.color} />{catById[e.category_id]?.name || 'Sin categoría'}</span></td>
                  <td>{memberById[e.paid_by]?.display_name || '—'}</td>
                  <td className="muted">{methodLabel(e)}</td>
                  <td className="num strong">{money(e.share)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="6" className="muted">No hay movimientos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
