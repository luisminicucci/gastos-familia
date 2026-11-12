import { useStore } from './store.jsx';
import { currentMonth, initials, monthLabel } from './lib.js';

const paths = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
  chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
  budget: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  family: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  warn: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>,
  repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>
};

export function Icon({ name, size = 24, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {paths[name]}
    </svg>
  );
}

export function Avatar({ member, size = 36 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: member?.color || '#8C9A95', fontSize: size * 0.4 }}>
      {initials(member?.display_name)}
    </span>
  );
}

export function Dot({ color }) {
  return <span className="dot" style={{ background: color || '#8C9A95' }} />;
}

export function Bar({ pct, warn }) {
  return (
    <div className="bar"><div style={{ width: Math.min(100, Math.max(0, pct)) + '%', background: warn ? 'var(--warn)' : 'var(--accent)' }} /></div>
  );
}

export function MonthPicker() {
  const { month, setMonth } = useStore();
  return (
    <div className="monthpicker">
      <button type="button" className="iconbtn" aria-label="Mes anterior" onClick={() => setMonth(month - 1)}><Icon name="left" size={20} /></button>
      <span>{monthLabel(month)}</span>
      <button type="button" className="iconbtn" aria-label="Mes siguiente" onClick={() => setMonth(month + 1)} disabled={month >= currentMonth() + 12}><Icon name="right" size={20} /></button>
    </div>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="pagehead">
      <div>
        {sub && <span className="muted small">{sub}</span>}
        <h1>{title}</h1>
      </div>
      {children && <div className="row gap8 wrap">{children}</div>}
    </div>
  );
}
