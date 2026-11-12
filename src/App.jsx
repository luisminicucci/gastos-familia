import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store.jsx';
import { configured } from './supabase.js';
import { Icon } from './ui.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import ExpenseForm from './pages/ExpenseForm.jsx';
import Movements from './pages/Movements.jsx';
import Budgets from './pages/Budgets.jsx';
import Summary from './pages/Summary.jsx';
import Family from './pages/Family.jsx';

const NAV = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/movimientos', label: 'Movimientos', icon: 'list' },
  { to: '/resumen', label: 'Resumen', icon: 'chart' },
  { to: '/presupuestos', label: 'Presupuestos', icon: 'budget' },
  { to: '/familia', label: 'Familia', icon: 'family' }
];

export default function App() {
  const { session, me, family, error } = useStore();
  const loc = useLocation();
  const nav = useNavigate();

  if (!configured) {
    return (
      <div className="center-screen"><div className="card narrow">
        <h1>Falta conectar Supabase</h1>
        <p className="muted">Completá la Project URL y la clave anon en <code>src/config.js</code>.</p>
      </div></div>
    );
  }
  if (session === undefined || (session && me === undefined && !error)) {
    return <div className="center-screen"><span className="muted">Cargando…</span></div>;
  }
  if (!session) return <Login />;
  if (me === null) return <Onboarding />;
  if (error && !me) {
    return <div className="center-screen"><div className="card narrow"><h1>No se pudo cargar</h1><p className="muted">{error}</p></div></div>;
  }

  const isForm = loc.pathname.startsWith('/gasto');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandmark">$</span><span>Gastos en Familia</span></div>
        <button type="button" className="btn primary sideadd" onClick={() => nav('/gasto/nuevo')}><Icon name="plus" size={20} />Cargar gasto</button>
        <nav className="sidenav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'sidelink' + (isActive ? ' active' : '')}>
              <Icon name={n.icon} size={20} />{n.label}
            </NavLink>
          ))}
        </nav>
        <span className="sidefoot">{family?.name}</span>
      </aside>

      <main className={'content' + (isForm ? ' noform-nav' : '')}>
        {error && <div className="alert">{error}</div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gasto/nuevo" element={<ExpenseForm />} />
          <Route path="/gasto/:id" element={<ExpenseForm />} />
          <Route path="/movimientos" element={<Movements />} />
          <Route path="/resumen" element={<Summary />} />
          <Route path="/presupuestos" element={<Budgets />} />
          <Route path="/familia" element={<Family />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!isForm && (
        <>
          <button type="button" className="fab" aria-label="Cargar gasto" onClick={() => nav('/gasto/nuevo')}>
            <Icon name="plus" size={28} />
          </button>
          <nav className="bottomnav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'bottomlink' + (isActive ? ' active' : '')}>
                <Icon name={n.icon} size={22} />{n.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
