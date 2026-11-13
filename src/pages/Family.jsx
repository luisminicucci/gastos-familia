import { useState } from 'react';
import { useStore } from '../store.jsx';
import { supabase } from '../supabase.js';
import { PALETA } from '../lib.js';
import { Avatar, Dot, PageHead } from '../ui.jsx';

export default function Family() {
  const { me, family, members, categories, rubros, expenses, loadAll, session } = useStore();
  const [nuevoRubro, setNuevoRubro] = useState('');
  const [nombre, setNombre] = useState(me.display_name);
  const [nuevaCat, setNuevaCat] = useState('');
  const [copiado, setCopiado] = useState(false);

  async function run(p) {
    const { error } = await p;
    if (error) alert(error.message); else loadAll();
  }
  const guardarNombre = () => nombre.trim() && nombre !== me.display_name && run(supabase.from('members').update({ display_name: nombre.trim() }).eq('id', me.id));
  const agregarCat = (e) => {
    e.preventDefault();
    if (!nuevaCat.trim()) return;
    run(supabase.from('categories').insert({ family_id: me.family_id, name: nuevaCat.trim(), color: PALETA[categories.length % PALETA.length], sort: categories.length + 1 }));
    setNuevaCat('');
  };
  const agregarRubro = (e) => {
    e.preventDefault();
    if (!nuevoRubro.trim()) return;
    run(supabase.from('rubros').insert({ family_id: me.family_id, name: nuevoRubro.trim(), color: PALETA[(rubros.length + 3) % PALETA.length], sort: rubros.length + 1 }));
    setNuevoRubro('');
  };
  const catUsada = (id) => expenses.some((e) => e.category_id === id);
  const rubroUsado = (id) => categories.some((c) => c.rubro_id === id);
  async function borrarCat(c) {
    // Verifica en la base (incluye gastos más viejos que los que tiene cargados la app).
    const { count, error } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('category_id', c.id);
    if (error) return alert(error.message);
    if (count > 0) return alert(`"${c.name}" tiene ${count} gasto(s) cargados. Podés ocultarla en lugar de borrarla.`);
    if (confirm(`¿Borrar la categoría "${c.name}"?`)) run(supabase.from('categories').delete().eq('id', c.id));
  }
  function borrarRubro(r) {
    if (rubroUsado(r.id)) return alert(`"${r.name}" tiene categorías asignadas. Sacáselas primero u ocultalo.`);
    if (confirm(`¿Borrar el rubro "${r.name}"?`)) run(supabase.from('rubros').delete().eq('id', r.id));
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(family.invite_code); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin permiso */ }
  };

  return (
    <div className="page">
      <PageHead title="Familia" sub={family?.name} />
      <div className="summarygrid">
        <div className="stack16">
          <section className="card stack12">
            <h2 className="cardtitle">Invitar a la familia</h2>
            <p className="muted small">Cada integrante crea su cuenta en la app, elige “Tengo un código” y pone este código:</p>
            <div className="row gap12 wrap">
              <span className="code">{family?.invite_code}</span>
              <button type="button" className="btn" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar código'}</button>
            </div>
          </section>
          <section className="card stack12">
            <h2 className="cardtitle">Integrantes</h2>
            {members.map((m) => (
              <div key={m.id} className="row gap12">
                <Avatar member={m} size={34} />
                {m.id === me.id ? (
                  <label className="grow row gap8"><span className="sr">Tu nombre</span>
                    <input className="inline-input grow" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={guardarNombre} />
                  </label>
                ) : <span className="grow strong">{m.display_name}</span>}
                <div className="row gap4">
                  {PALETA.slice(0, 6).map((c) => (
                    m.id === me.id && <button key={c} type="button" className={'swatch' + (m.color === c ? ' on' : '')} style={{ background: c }} aria-label="Elegir color" onClick={() => run(supabase.from('members').update({ color: c }).eq('id', m.id))} />
                  ))}
                </div>
              </div>
            ))}
          </section>
          <section className="card stack8">
            <h2 className="cardtitle">Instalar en el celular</h2>
            <p className="small"><strong>iPhone:</strong> abrí esta página en Safari, tocá el botón Compartir y elegí “Agregar a pantalla de inicio”.</p>
            <p className="small"><strong>Android:</strong> abrí esta página en Chrome, tocá los tres puntos y elegí “Instalar app” o “Agregar a pantalla principal”.</p>
          </section>
        </div>
        <div className="stack16">
          <section className="card stack8">
            <h2 className="cardtitle">Rubros</h2>
            <p className="muted small">Agrupan categorías para ver totales más generales (ej.: Hogar = Supermercado + Casa + Servicios). Un rubro sin categorías se puede borrar; si tiene, se puede ocultar.</p>
            {rubros.length === 0 && <p className="muted small">Todavía no hay rubros.</p>}
            {rubros.map((r) => (
              <div key={r.id} className={'row gap10 catline' + (r.archived ? ' archived' : '')}>
                <Dot color={r.color} />
                <input className="inline-input grow" aria-label="Nombre del rubro" defaultValue={r.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== r.name && run(supabase.from('rubros').update({ name: e.target.value.trim() }).eq('id', r.id))} />
                <span className="muted small nowrap">{categories.filter((c) => c.rubro_id === r.id && !c.archived).length} cat.</span>
                {rubroUsado(r.id)
                  ? <button type="button" className="btn small" onClick={() => run(supabase.from('rubros').update({ archived: !r.archived }).eq('id', r.id))}>{r.archived ? 'Reactivar' : 'Ocultar'}</button>
                  : <button type="button" className="btn small danger" onClick={() => borrarRubro(r)}>Borrar</button>}
              </div>
            ))}
            <form className="row gap8" onSubmit={agregarRubro}>
              <input className="inline-input grow" placeholder="Nuevo rubro" value={nuevoRubro} onChange={(e) => setNuevoRubro(e.target.value)} aria-label="Nuevo rubro" />
              <button className="btn small primary">Agregar</button>
            </form>
          </section>
          <section className="card stack8">
            <h2 className="cardtitle">Categorías</h2>
            <p className="muted small">Las que nunca se usaron se pueden borrar; las que tienen gastos se ocultan para no perder el historial.</p>
            {categories.map((c) => (
              <div key={c.id} className={'row gap10 catline' + (c.archived ? ' archived' : '')}>
                <Dot color={c.color} />
                <input className="inline-input grow" aria-label="Nombre de la categoría" defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && run(supabase.from('categories').update({ name: e.target.value.trim() }).eq('id', c.id))} />
                {rubros.length > 0 && (
                  <select className="inline-select" aria-label={'Rubro de ' + c.name} value={c.rubro_id || ''}
                    onChange={(e) => run(supabase.from('categories').update({ rubro_id: e.target.value || null }).eq('id', c.id))}>
                    <option value="">Sin rubro</option>
                    {rubros.filter((r) => !r.archived || r.id === c.rubro_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                )}
                {catUsada(c.id)
                  ? <button type="button" className="btn small" onClick={() => run(supabase.from('categories').update({ archived: !c.archived }).eq('id', c.id))}>{c.archived ? 'Reactivar' : 'Ocultar'}</button>
                  : <button type="button" className="btn small danger" onClick={() => borrarCat(c)}>Borrar</button>}
              </div>
            ))}
            <form className="row gap8" onSubmit={agregarCat}>
              <input className="inline-input grow" placeholder="Nueva categoría" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} aria-label="Nueva categoría" />
              <button className="btn small primary">Agregar</button>
            </form>
          </section>
          <section className="card stack8">
            <span className="muted small">Sesión iniciada como {session.user.email}</span>
            <button type="button" className="btn" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
          </section>
        </div>
      </div>
    </div>
  );
}
