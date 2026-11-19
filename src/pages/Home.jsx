import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { daysLeft, entriesForMonth, money, sum, monthLabel } from '../lib.js';
import { Avatar, Bar, Icon, MonthPicker } from '../ui.jsx';
import { ExpenseRow, PendingRecurring } from '../rows.jsx';

export default function Home() {
  const { me, members, expenses, month, activeCategories, family } = useStore();
  const entries = entriesForMonth(expenses, month);
  const total = sum(entries);
  const budget = activeCategories.reduce((t, c) => t + Number(c.budget), 0);
  const left = daysLeft(month);
  const pct = budget ? (total / budget) * 100 : 0;

  const porCat = activeCategories.map((c) => {
    const g = sum(entries.filter((e) => e.category_id === c.id));
    return { ...c, gastado: g, pct: Number(c.budget) ? (g / Number(c.budget)) * 100 : 0 };
  });
  const alertas = porCat.filter((c) => Number(c.budget) > 0 && c.pct >= 85).sort((a, b) => b.pct - a.pct);
  const porPersona = members.map((m) => ({ ...m, gastado: sum(entries.filter((e) => e.paid_by === m.id)) })).sort((a, b) => b.gastado - a.gastado);

  return (
    <div className="page">
      <div className="pagehead">
        <div>
          <span className="muted small">{family?.name}</span>
          <h1>Hola, {me.display_name}</h1>
        </div>
        <div className="row gap8">
          <div className="avatars">{members.map((m) => <Avatar key={m.id} member={m} />)}</div>
        </div>
      </div>
      <MonthPicker />

      <section className="hero">
        <span className="hero-sub">Gastado en {monthLabel(month)}</span>
        <div className="row gap8 baseline wrap">
          <span className="hero-num">{money(total)}</span>
          {budget > 0 && <span className="hero-sub">de {money(budget)}</span>}
        </div>
        {budget > 0 && <div className="bar dark"><div style={{ width: Math.min(100, pct) + '%', background: pct >= 100 ? '#F5A65B' : '#5FD3B5' }} /></div>}
        <div className="row between hero-sub wrap gap8">
          <span>{budget > 0 ? (total <= budget ? `Quedan ${money(budget - total)}` : `Te pasaste ${money(total - budget)}`) : <Link to="/presupuestos" className="hero-link">Definí presupuestos por categoría</Link>}</span>
          {left !== null && <span>{left} días para fin de mes</span>}
        </div>
      </section>

      {alertas.map((c) => (
        <div key={c.id} className="warnbox">
          <Icon name="warn" size={20} />
          <span><strong>{c.name}</strong> {c.pct >= 100 ? `se pasó del presupuesto (${Math.round(c.pct)}%).` : `ya usó el ${Math.round(c.pct)}% de su presupuesto.`}</span>
        </div>
      ))}

      <div className="homegrid">
        <div className="stack16">
          <PendingRecurring />
          <section className="card flush">
            <div className="row between cardhead">
              <h2 className="cardtitle">Últimos gastos</h2>
              <Link to="/movimientos" className="small strong">Ver todos</Link>
            </div>
            {entries.length === 0 && <p className="muted empty">Todavía no hay gastos este mes. Tocá el + para cargar el primero.</p>}
            {entries.slice(0, 8).map((e) => <ExpenseRow key={e.id + (e.cuota || '')} e={e} />)}
          </section>
        </div>
        <div className="stack16 desktop-only">
          <section className="card stack12">
            <h2 className="cardtitle">Por categoría</h2>
            {porCat.filter((c) => c.gastado > 0 || Number(c.budget) > 0).map((c) => (
              <div key={c.id} className="stack6">
                <div className="row between small"><span className="strong">{c.name}</span><span className="muted">{money(c.gastado)}{Number(c.budget) > 0 && ` de ${money(c.budget)}`}</span></div>
                <Bar pct={Number(c.budget) > 0 ? c.pct : 0} warn={c.pct >= 85} />
              </div>
            ))}
          </section>
          <section className="card stack12">
            <h2 className="cardtitle">Quién gastó</h2>
            {porPersona.map((m) => (
              <div key={m.id} className="row gap12"><Avatar member={m} size={32} /><span className="grow strong">{m.display_name}</span><span className="strong">{money(m.gastado)}</span></div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
