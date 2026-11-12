import { useState } from 'react';
import { supabase } from '../supabase.js';
import { useStore } from '../store.jsx';

export default function Onboarding() {
  const { loadAll } = useStore();
  const [modo, setModo] = useState('crear');
  const [nombre, setNombre] = useState('');
  const [familia, setFamilia] = useState('');
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const { error } = modo === 'crear'
      ? await supabase.rpc('create_family', { p_family_name: familia.trim(), p_display_name: nombre.trim() })
      : await supabase.rpc('join_family', { p_code: codigo.trim(), p_display_name: nombre.trim() });
    setBusy(false);
    if (error) return setMsg(error.message);
    loadAll();
  }

  return (
    <div className="center-screen">
      <form className="card narrow stack16" onSubmit={submit}>
        <h1>Bienvenido</h1>
        <div className="segmented">
          <button type="button" className={modo === 'crear' ? 'on' : ''} onClick={() => setModo('crear')}>Crear mi familia</button>
          <button type="button" className={modo === 'unirme' ? 'on' : ''} onClick={() => setModo('unirme')}>Tengo un código</button>
        </div>
        <label className="field">Tu nombre
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Como te van a ver los demás" />
        </label>
        {modo === 'crear' ? (
          <label className="field">Nombre de la familia
            <input required value={familia} onChange={(e) => setFamilia(e.target.value)} placeholder="Ej.: Familia Pérez" />
          </label>
        ) : (
          <label className="field">Código de invitación
            <input required value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Te lo pasa quien creó la familia" />
          </label>
        )}
        {msg && <p className="note">{msg}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Un momento…' : modo === 'crear' ? 'Crear familia' : 'Unirme'}</button>
        <button type="button" className="btn link" onClick={() => supabase.auth.signOut()}>Salir</button>
      </form>
    </div>
  );
}
