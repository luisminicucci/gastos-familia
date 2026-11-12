import { useState } from 'react';
import { supabase } from '../supabase.js';

const traducir = (msg) => {
  if (/Invalid login/i.test(msg)) return 'Email o contraseña incorrectos.';
  if (/already registered/i.test(msg)) return 'Ese email ya tiene cuenta. Ingresá con tu contraseña.';
  if (/Password should be/i.test(msg)) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (/Email not confirmed/i.test(msg)) return 'Falta confirmar el email: revisá tu correo.';
  return msg;
};

export default function Login() {
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const fn = modo === 'entrar' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn.call(supabase.auth, { email: email.trim(), password: pass });
    setBusy(false);
    if (error) return setMsg(traducir(error.message));
    if (modo === 'crear' && !data.session) setMsg('Te mandamos un email para confirmar la cuenta. Después volvé y entrá.');
  }

  return (
    <div className="center-screen">
      <form className="card narrow stack16" onSubmit={submit}>
        <div className="brand dark"><span className="brandmark">$</span><span>Gastos en Familia</span></div>
        <h1>{modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</h1>
        <label className="field">Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">Contraseña
          <input type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} />
        </label>
        {msg && <p className="note">{msg}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</button>
        <button type="button" className="btn link" onClick={() => { setModo(modo === 'entrar' ? 'crear' : 'entrar'); setMsg(''); }}>
          {modo === 'entrar' ? '¿Primera vez? Crear cuenta' : 'Ya tengo cuenta'}
        </button>
      </form>
    </div>
  );
}
