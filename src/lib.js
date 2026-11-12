export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MEDIOS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia'];
export const PALETA = ['#0E7C66', '#3B5BA9', '#B45309', '#7A3FA0', '#B42340', '#5B6B66', '#C27C0E', '#8C9A95', '#2F8F9D', '#A3476B'];

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
export const money = (n) => '$ ' + nf.format(Math.round(n || 0));

// Un "mes" es un número: año * 12 + mes (0-11). Fácil de sumar y comparar.
export const monthKey = (dateStr) => {
  const [y, m] = dateStr.split('-').map(Number);
  return y * 12 + (m - 1);
};
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const currentMonth = () => monthKey(todayStr());
export const monthLabel = (k) => `${MESES[k % 12]} ${Math.floor(k / 12)}`;
export const monthShort = (k) => MESES_CORTOS[k % 12];
export const monthStart = (k) => `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}-01`;
export const daysLeft = (k) => {
  if (k !== currentMonth()) return null;
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return last - d.getDate();
};
export const shortDate = (s) => {
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
};

// Lo que cada gasto "pesa" en un mes: si es en cuotas, cada mes cuenta su cuota.
export function entriesForMonth(expenses, k) {
  const out = [];
  for (const e of expenses) {
    const start = monthKey(e.spent_on);
    const n = e.installments || 1;
    if (k >= start && k < start + n) {
      out.push({ ...e, share: Number(e.amount) / n, cuota: n > 1 ? k - start + 1 : null });
    }
  }
  return out.sort((a, b) => (a.spent_on < b.spent_on ? 1 : a.spent_on > b.spent_on ? -1 : (a.created_at < b.created_at ? 1 : -1)));
}

export const sum = (arr) => arr.reduce((t, e) => t + e.share, 0);

export function methodLabel(e) {
  if (e.method === 'Crédito') {
    const n = e.installments || 1;
    return e.cuota ? `Crédito cuota ${e.cuota}/${n}` : n > 1 ? `Crédito ${n} cuotas` : 'Crédito 1 cuota';
  }
  return e.method;
}

export function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export function downloadCSV(filename, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const text = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
