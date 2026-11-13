import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { supabase } from '../supabase.js';
import { MEDIOS, money, todayStr } from '../lib.js';
import { Avatar, Dot, Icon } from '../ui.jsx';

const CUOTAS = [1, 3, 6, 9, 12, 18, 24];

// Acepta "48.200", "48200", "48.200,50" o "48200.5".
function parseMonto(s) {
  let t = String(s).replace(/[^\d.,]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));

export default function ExpenseForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me, members, activeCategories, expenses, loadAll } = useStore();
  const editing = id ? expenses.find((e) => e.id === id) : null;

  const [monto, setMonto] = useState('');
  const [cat, setCat] = useState(activeCategories[0]?.id || null);
  const [quien, setQuien] = useState(me.id);
  const [medio, setMedio] = useState('Débito');
  const [cuotas, setCuotas] = useState(1);
  const [fecha, setFecha] = useState(todayStr());
  const [nota, setNota] = useState('');
  const [fijo, setFijo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const montoRef = useRef(null);

  // Al abrir un gasto nuevo, el cursor va directo al monto.
  useEffect(() => {
    if (editing) return;
    const el = montoRef.current;
    if (el) { el.focus(); el.select?.(); }
    const t = setTimeout(() => { el?.focus(); document.getElementById('focus-puente')?.remove(); }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!editing) return;
    setMonto(String(Number(editing.amount)).replace('.', ','));
    setCat(editing.category_id);
    setQuien(editing.paid_by);
    setMedio(editing.method);
    setCuotas(editing.installments);
    setFecha(editing.spent_on);
    setNota(editing.note);
    setFijo(!!editing.recurring_key);
  }, [editing?.id]);

  if (id && !editing) return <div className="page"><p className="muted">No encontré ese gasto.</p></div>;

  const valor = parseMonto(monto);
  const n = medio === 'Crédito' ? cuotas : 1;

  async function guardar(e) {
    e.preventDefault();
    if (valor <= 0) return setMsg('Poné un monto.');
    setBusy(true); setMsg('');
    const row = {
      family_id: me.family_id, amount: valor, category_id: cat, paid_by: quien, method: medio,
      installments: n, note: nota.trim(), spent_on: fecha,
      recurring_key: fijo ? (editing?.recurring_key || uuid()) : null
    };
    const { error } = editing
      ? await supabase.from('expenses').update(row).eq('id', editing.id)
      : await supabase.from('expenses').insert(row);
    setBusy(false);
    if (error) return setMsg(error.message);
    await loadAll();
    nav(-1);
  }

  async function borrar() {
    if (!confirm('¿Borrar este gasto?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', editing.id);
    if (error) return setMsg(error.message);
    await loadAll();
    nav(-1);
  }

  return (
    <form className="page formpage" onSubmit={guardar}>
      <div className="formhead">
        <button type="button" className="iconbtn" aria-label="Cerrar" onClick={() => nav(-1)}><Icon name="close" /></button>
        <h1 className="formtitle">{editing ? 'Editar gasto' : 'Nuevo gasto'}</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="amountbox">
        <label htmlFor="monto" className="muted small">{n > 1 ? 'Monto total en pesos' : 'Monto en pesos'}</label>
        <div className="row baseline gap6 center">
          <span className="amount-sign">$</span>
          <input id="monto" className="amount-input" inputMode="decimal" ref={montoRef} placeholder="0"
            style={{ width: `${Math.max(2, monto.length + 1)}ch` }} value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        {n > 1 && valor > 0 && <span className="muted small">{n} cuotas de {money(valor / n)}</span>}
      </div>

      <div className="stack8">
        <span className="label">Categoría</span>
        <div className="chipgrid">
          {activeCategories.map((c) => (
            <button type="button" key={c.id} className={'catchip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>
              <Dot color={c.color} />{c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stack8">
        <span className="label">¿Quién pagó?</span>
        <div className="row gap8 wrap">
          {members.map((m) => (
            <button type="button" key={m.id} className={'pill person' + (quien === m.id ? ' on' : '')} onClick={() => setQuien(m.id)}>
              <Avatar member={m} size={30} />{m.display_name}
            </button>
          ))}
        </div>
      </div>

      <div className="stack8">
        <span className="label">Medio de pago</span>
        <div className="row gap8 wrap">
          {MEDIOS.map((m) => (
            <button type="button" key={m} className={'pill' + (medio === m ? ' on' : '')} onClick={() => setMedio(m)}>{m}</button>
          ))}
        </div>
        {medio === 'Crédito' && (
          <div className="cuotasbox">
            <span>Cuotas</span>
            <div className="row gap6 wrap">
              {CUOTAS.map((q) => (
                <button type="button" key={q} className={'cuota' + (cuotas === q ? ' on' : '')} onClick={() => setCuotas(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid2">
        <label className="field">Fecha
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className="field">Nota
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: Coto, compra semanal" />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={fijo} onChange={(e) => setFijo(e.target.checked)} />
        Es un gasto fijo que se repite todos los meses
      </label>

      {msg && <p className="note">{msg}</p>}
      <div className="formactions">
        {editing && <button type="button" className="btn danger" onClick={borrar}>Borrar</button>}
        <button className="btn primary grow" disabled={busy}>{busy ? 'Guardando…' : 'Guardar gasto'}</button>
      </div>
    </form>
  );
}
