import { useState } from 'react';
import { useStore } from '../store.jsx';
import { supabase } from '../supabase.js';
import { PALETA } from '../lib.js';
import { Avatar, Dot, PageHead } from '../ui.jsx';

export default function Family() {
  const { me, family, members, categories, loadAll, session } = useStore();
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
            <h2 className="cardtitle">Categorías</h2>
            {categories.map((c) => (
              <div key={c.id} className={'row gap10 catline' + (c.archived ? ' archived' : '')}>
                <Dot color={c.color} />
                <input className="inline-input grow" aria-label="Nombre de la categoría" defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && run(supabase.from('categories').update({ name: e.target.value.trim() }).eq('id', c.id))} />
                <button type="button" className="btn small" onClick={() => run(supabase.from('categories').update({ archived: !c.archived }).eq('id', c.id))}>
                  {c.archived ? 'Reactivar' : 'Ocultar'}
                </button>
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
