// resources/js/Pages/Sa/Dashboard.jsx
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiActivity,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiCheck
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import HeaderAdmin from './headeradmin';
import React from 'react';

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/* ====================== Helpers de fecha ====================== */
const TZ = 'America/Mexico_City';

const todayStrMX = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  } catch { return new Date().toISOString().slice(0, 10); }
};
const currentMonthStr = () => (todayStrMX().slice(0, 7)); // YYYY-MM

const formatDMY = (yyyy_mm_dd) => {
  try {
    const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(dt);
  } catch { const [y,m,d]=yyyy_mm_dd.split('-'); return `${d}/${m}/${y}`; }
};
const formatWeekday = (yyyy_mm_dd) => {
  try {
    const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const w = new Intl.DateTimeFormat('es-MX',{timeZone:TZ,weekday:'long'}).format(dt);
    return w.charAt(0).toUpperCase() + w.slice(1);
  } catch { return '—'; }
};

/* Suma de meses con zona MX, devuelve YYYY-MM-DD */
const addMonthsMX = (yyyy_mm_dd, months) => {
  try {
    if (!yyyy_mm_dd) return '';
    const inc = Number(months || 0);
    const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    dt.setUTCMonth(dt.getUTCMonth() + inc);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(dt);
  } catch {
    return yyyy_mm_dd;
  }
};
const daysUntil = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return 9999;
  try {
    const [y,m,d]=yyyy_mm_dd.split('-').map(Number);
    const target = new Date(y, m-1, d, 12, 0, 0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return Math.floor((target - today)/(1000*60*60*24));
  } catch { return 9999; }
};

/* ====================== UI base ====================== */
const inputCx = `
  w-full rounded-xl border px-3 py-2 outline-none transition
  bg-white/10 border-white/15 text-white placeholder-white/50
  focus:ring-2 focus:ring-indigo-400/30 focus:border-white/30
  shadow-inner backdrop-blur-sm
`;
const panelCx = `
  rounded-2xl border border-white/10 p-5
  bg-gradient-to-br from-white/10 to-white/5 backdrop-blur
  shadow-[0_10px_30px_rgba(0,0,0,.25)] ring-1 ring-white/5
`;

function UIInput({ type='text', value, onChange, placeholder, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e=>onChange?.(e.target.value)}
      placeholder={placeholder}
      className={inputCx}
      autoComplete="off"
      {...rest}
    />
  );
}

/* SELECT con opciones legibles en el menú nativo */
function UISelect({ value, onChange, children }) {
  // Estiliza <option> (y <optgroup>) para que el desplegable sea negro sobre blanco
  const styledChildren = React.Children.map(children, (child) => {
    if (!child) return child;

    // Si hay optgroups, clonar también sus options
    if (child.type === 'optgroup') {
      const groupKids = React.Children.map(child.props.children, (c) =>
        c && c.type === 'option'
          ? React.cloneElement(c, {
              style: { color: '#111', backgroundColor: '#fff', ...(c.props?.style || {}) }
            })
          : c
      );
      return React.cloneElement(child, {}, groupKids);
    }

    // Options sueltas
    if (child.type === 'option') {
      return React.cloneElement(child, {
        style: { color: '#111', backgroundColor: '#fff', ...(child.props?.style || {}) }
      });
    }
    return child;
  });

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e=>onChange?.(e.target.value)}
        className={`${inputCx} appearance-none pr-10`}
      >
        {styledChildren}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70"
           viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 0 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"/>
      </svg>
    </div>
  );
}

function CurrencyInput({ value, onChange }) {
  return (
    <UIInput
      type="text"
      value={value}
      onChange={onChange}
      placeholder="$0.00"
      inputMode="decimal"
    />
  );
}
/* NUEVO: input para cantidades (sin $) */
function CountInput({ value, onChange }) {
  return (
    <UIInput
      type="number"
      value={value}
      onChange={onChange}
      placeholder="0"
      inputMode="numeric"
    />
  );
}

const MiniStat = ({label,value}) => (
  <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[11px] leading-tight text-center">
    <div className="text-white/70 truncate whitespace-nowrap">{label}</div>
    <div className="font-semibold">{mxn.format(value||0)}</div>
  </div>
);

/* ====================== Catálogos de “Otros/Pedido” (desplegables) ====================== */
const CAT1 = ['Playera', 'Sudadera', 'Short', 'Accesorios', 'Otro'];
const cat2Options = (c1) => {
  if (c1 === 'Playera') {
    return ['Playera Oversize','Playera Regular','Playera despintada','Playera cuello alto','Playera Poliéster'];
  }
  if (c1 === 'Sudadera') {
    return ['Sudadera 400g','Sudadera regular'];
  }
  if (c1 === 'Accesorios') {
    return ['Pulseras','Bolsas'];
  }
  return [];
};
const cat3Options = (c1, c2) => {
  if (c1 === 'Playera' && c2 === 'Playera Oversize') {
    return ['Playera Over 220g','Playera Over 250g','Playera Over 300g'];
  }
  return [];
};

/* ====================== Helpers API (Paso 2) ====================== */
/** Cambia estas rutas si tus endpoints son distintos */
const API_BASE = '/sa/batches';

const csrfToken = () =>
  (typeof document !== 'undefined'
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    : null);

const baseHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken() } : {})
});

async function apiGet(url) {
  const r = await fetch(url, { headers: baseHeaders(), credentials: 'same-origin' });
  if (!r.ok) throw new Error('GET ' + url);
  return await r.json();
}
async function apiPost(url, data) {
  const r = await fetch(url, {
    method: 'POST', headers: baseHeaders(), credentials: 'same-origin', body: JSON.stringify(data)
  });
  const j = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(j?.message || ('POST ' + url));
  return j;
}
async function apiPut(url, data) {
  const r = await fetch(url, {
    method: 'PUT', headers: baseHeaders(), credentials: 'same-origin', body: JSON.stringify(data)
  });
  const j = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(j?.message || ('PUT ' + url));
  return j;
}
async function apiDelete(url) {
  const r = await fetch(url, { method: 'DELETE', headers: baseHeaders(), credentials: 'same-origin' });
  if (r.status === 204) return {}; // puede devolver 204 sin body
  const j = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(j?.message || ('DELETE ' + url));
  return j;
}

/* ======= Adaptadores server <-> cliente ======= */
function serverToCamel(b = {}) {
  return {
    id: b.id,
    date: b.date,
    incSums: b.incSums ?? b.inc_sums ?? {},
    expSums: b.expSums ?? b.exp_sums ?? {},
    incMeta: b.incMeta ?? b.inc_meta ?? {},
    expMeta: b.expMeta ?? b.exp_meta ?? {},
    creditPaidMonths: b.creditPaidMonths ?? b.credit_paid_months ?? [],
    notas: b.notas ?? '',
    expNote: b.expNote ?? b.exp_note ?? '',
    // 👇 NUEVO: traer status/paidAt/stripe ids
    status: b.status ?? 'pending',
    paidAt: b.paidAt ?? null,
    paymentIntentId: b.paymentIntentId ?? null,
    checkoutSessionId: b.checkoutSessionId ?? null,
  };
}

/** Convierte patch/newBatch a snake_case para enviar al backend */
function camelToServer(patch = {}) {
  const out = {};
  if ('id' in patch) out.id = patch.id;
  if ('date' in patch) out.date = patch.date;
  if ('incSums' in patch) out.inc_sums = patch.incSums;
  if ('expSums' in patch) out.exp_sums = patch.expSums;
  if ('incMeta' in patch) out.inc_meta = patch.incMeta;
  if ('expMeta' in patch) out.exp_meta = patch.expMeta;
  if ('creditPaidMonths' in patch) out.credit_paid_months = patch.creditPaidMonths;
  if ('notas' in patch) out.notas = patch.notas;
  if ('expNote' in patch) out.exp_note = patch.expNote;

  // 👇 NUEVO: permitir enviar estos campos cuando aplique
  if ('status' in patch) out.status = patch.status;
  if ('paidAt' in patch) out.paid_at = patch.paidAt;
  if ('paymentIntentId' in patch) out.payment_intent_id = patch.paymentIntentId;
  if ('checkoutSessionId' in patch) out.checkout_session_id = patch.checkoutSessionId;

  return out;
}


/** —— normalizador de batches para evitar null/undefined —— */
function normalizeBatch(b = {}) {
  return {
    id: String(b.id ?? ('B' + Date.now() + Math.random().toString(36).slice(2, 6))),
    date: b.date || todayStrMX(),
    incSums: {
      Otros: 0, Efectivo: 0, Tarjeta: 0, Transferencia: 0,
      ...(b.incSums || {})
    },
    expSums: {
      Efectivo: 0, Tarjeta: 0, Transferencia: 0, Crédito: 0,
      ...(b.expSums || {})
    },
    incMeta: { otros: [], ...(b.incMeta || {}) },
    expMeta: { pedido: [], credito: null, ...(b.expMeta || {}) },
    expNote: b.expNote || '',
    notas: b.notas || '',
    creditPaidMonths: Array.isArray(b.creditPaidMonths) ? b.creditPaidMonths : [],
    // 👇 NUEVO: conservar estos flags en el state
    status: b.status || 'pending',
    paidAt: b.paidAt || null,
  };
}


/* —— batch vacío (anti-fantasma) —— */
const isEmptyBatch = (b = {}) => {
  const inc = b.incSums||{}, exp = b.expSums||{};
  const incSum = (inc.Otros||0)+(inc.Efectivo||0)+(inc.Tarjeta||0)+(inc.Transferencia||0);
  const expSum = (exp.Efectivo||0)+(exp.Tarjeta||0)+(exp.Transferencia||0)+(exp.Crédito||0);
  const otros  = (b.incMeta?.otros||[]).reduce((a,x)=>a+Number(x.cifra||0),0);
  const pedido = (b.expMeta?.pedido||[]).reduce((a,x)=>a+Number(x.cifra||0),0);
  const credito= Number(b.expMeta?.credito?.total||0);
  const hasNotes = !!(b.notas||b.expNote);
  return (incSum+expSum+otros+pedido+credito)===0 && !hasNotes;
};

/** Reconstruye incomeEntries y expenseEntries a partir de batches del servidor (para que los totales funcionen). */
function rebuildEntriesFromBatches(batches) {
  const income = [];
  const expense = [];
  let id = 1;

  for (const raw of (batches || [])) {
    const b = normalizeBatch(raw);
    const d = b.date || todayStrMX();

    const inc = b.incSums || {};
    const exp = b.expSums || {};

    if ((inc.Otros || 0) > 0)         income.push({ id:id++, batchId:b.id, date:d, method:'Otro',          amount:Number(inc.Otros || 0),         note:b.notas || '' });
    if ((inc.Efectivo || 0) > 0)      income.push({ id:id++, batchId:b.id, date:d, method:'Efectivo',      amount:Number(inc.Efectivo || 0),      note:b.notas || '' });
    if ((inc.Tarjeta || 0) > 0)       income.push({ id:id++, batchId:b.id, date:d, method:'Tarjeta',       amount:Number(inc.Tarjeta || 0),       note:b.notas || '' });
    if ((inc.Transferencia || 0) > 0) income.push({ id:id++, batchId:b.id, date:d, method:'Transferencia', amount:Number(inc.Transferencia || 0), note:b.notas || '' });

    if ((exp.Efectivo || 0) > 0)      expense.push({ id:id++, batchId:b.id, date:d, method:'Efectivo',      amount:Number(exp.Efectivo || 0),      note:b.expNote || '' });
    if ((exp.Tarjeta || 0) > 0)       expense.push({ id:id++, batchId:b.id, date:d, method:'Tarjeta',       amount:Number(exp.Tarjeta || 0),       note:b.expNote || '' });
    if ((exp.Transferencia || 0) > 0) expense.push({ id:id++, batchId:b.id, date:d, method:'Transferencia', amount:Number(exp.Transferencia || 0), note:b.expNote || '' });
    if ((exp.Crédito || 0) > 0)       expense.push({ id:id++, batchId:b.id, date:d, method:'Crédito',       amount:Number(exp.Crédito || 0),       note:b.expNote || '' });
  }
  return { income, expense, nextId: id };
}

/* ====================== Página ====================== */
export default function SaDashboard() {
  /* ---- Capturas ---- */
  const [incomeRows, setIncomeRows] = useState([
    {
      date: todayStrMX(),
      efectivo:'',
      transferencia:'',
      tarjeta:'',
      otrosLabel:'',
      otrosMonto:'',
      // “Otros” (ingresos) con subniveles + cifra
      otrosCat1:'', otrosCat2:'', otrosCat3:'', otrosCifra:''
    }
  ]);
  const [expenseRows, setExpenseRows] = useState([
    {
      date: todayStrMX(),
      method:'Efectivo',
      amount:'',
      note:'',
      // NUEVO: “Pedido” (egresos) con subniveles + cifra
      pedidoCat1:'', pedidoCat2:'', pedidoCat3:'', pedidoCifra:'', pedidoOtro:'',
      // NUEVO: datos de crédito
      creditoInicio:'', creditoFin:'', creditoMeses:'',
      creditoFinManual:false
    }
  ]);

  /* ---- Movimientos en memoria (para totales) ---- */
  const [incomeEntries, setIncomeEntries] = useState([]);   // {id, batchId, date, method, amount, note}
  const [expenseEntries, setExpenseEntries] = useState([]); // {id, batchId, date, method, amount, note}
  const idCounter = useRef(1);

  /* ---- Batches (cortes) para la tabla de resumen ---- */
  // batch: {id,date,incSums,expSums,notas, incMeta:{otros:[{ruta,cifra}]}, expMeta:{pedido:[{ruta,cifra}], credito:{inicio,fin,meses,total}}, expNote: string, creditPaidMonths:number[]}
  const [batches, setBatches] = useState([]);
  const [selectedMonth] = useState(currentMonthStr()); // compat
  const [selectedDay, setSelectedDay] = useState(''); // filtro por día (prioritario)

  /* ---- Estado servidor ---- */
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  /* Cargar desde BD al montar */
  useEffect(() => {
    (async () => {
      try {
        setServerLoading(true);
        setServerError('');
        // GET /sa/batches  -> { data:[...] } o [...]
        const res = await apiGet(API_BASE);
        const listRaw = Array.isArray(res) ? res : (res?.data || []);
        const list = listRaw
          .map(serverToCamel)
          .map(normalizeBatch)
          .filter(b => !isEmptyBatch(b)); // anti-fantasma
        setBatches(list);

        // reconstruir entries para totales
        const { income, expense, nextId } = rebuildEntriesFromBatches(list);
        setIncomeEntries(income);
        setExpenseEntries(expense);
        idCounter.current = nextId;
      } catch (e) {
        setServerError('No se pudieron cargar los cortes desde el servidor.');
      } finally {
        setServerLoading(false);
      }
    })();
  }, []);

  /* ---- Métricas de tráfico header ---- */
  const [traffic, setTraffic] = useState({ live: 0, monthly: 0 });
  const [trafficLoading, setTrafficLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/sa/metrics/traffic', {
          credentials: 'same-origin',
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('traffic fetch');
        const data = await res.json();
        if (!cancelled) {
          setTraffic({
            live: Number(data.active ?? data.live ?? 0),
            monthly: Number(data.monthlyUnique ?? data.monthly ?? 0),
          });
          setTrafficLoading(false);
        }
      } catch {
        if (!cancelled) setTrafficLoading(false);
      }
    }
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* ---- Updates de inputs ---- */
  const updateIncome = (i,k,v)=>setIncomeRows(p=>p.map((r,idx)=>idx===i?{...r,[k]:v}:r));

  const setCreditoField = (idx, key, val) => {
    setExpenseRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const next = { ...row, [key]: val };

      // Autocálculo de FIN si método = Crédito y no es fin manual
      if (next.method === 'Crédito' && !next.creditoFinManual) {
        const hasInicio = !!next.creditoInicio;
        const mesesNum = Number(next.creditoMeses || 0);
        if ((key === 'creditoInicio' || key === 'creditoMeses' || key === 'method') && hasInicio && mesesNum > 0) {
          next.creditoFin = addMonthsMX(next.creditoInicio, mesesNum);
        }
      }
      return next;
    }));
  };

  const updateExpense = (idx, key, val) => {
    if (key === 'creditoInicio' || key === 'creditoMeses' || key === 'method') {
      setCreditoField(idx, key, val);
      return;
    }
    if (key === 'creditoFin') {
      // Si el usuario escribe manualmente "Fin", marcamos manual
      setExpenseRows(prev => prev.map((row, i) => {
        if (i !== idx) return row;
        const manual = !!val; // si queda vacío, vuelve a permitir auto
        return { ...row, creditoFin: val, creditoFinManual: manual };
      }));
      return;
    }
    setExpenseRows(p=>p.map((r,idx2)=>idx2===idx?{...r,[key]:val}:r));
  };

  /* ---- Totales tarjetas superiores (base) ---- */
  const incomeTotals = useMemo(()=>{
    const b={total:0,Efectivo:0,Transferencia:0,Tarjeta:0,Otro:0};
    for(const e of incomeEntries){
      b.total+=e.amount;
      if(e.method==='Efectivo') b.Efectivo+=e.amount;
      else if(e.method==='Transferencia') b.Transferencia+=e.amount;
      else if(e.method==='Tarjeta') b.Tarjeta+=e.amount;
      else b.Otro+=e.amount;
    } return b;
  },[incomeEntries]);
  const expenseTotals = useMemo(()=>{
    const b={total:0,Efectivo:0,Transferencia:0,Tarjeta:0,Crédito:0};
    for(const e of expenseEntries){
      b.total+=e.amount;
      if(e.method==='Efectivo') b.Efectivo+=e.amount;
      else if(e.method==='Transferencia') b.Transferencia+=e.amount;
      else if(e.method==='Tarjeta') b.Tarjeta+=e.amount;
      else if(e.method==='Crédito') b.Crédito+=e.amount;
    } return b;
  },[expenseEntries]);

  /* ---- Crédito: saldo restante por batch (meses default=1) ---- */
  const creditOutstanding = (b) => {
    const c = b?.expMeta?.credito;
    const totalBase = Number((c?.total ?? b?.expSums?.Crédito) || 0) || 0;
    if (!totalBase) return 0;
    const meses = Math.max(1, Number(c?.meses || 0));
    const paid = (b.creditPaidMonths || []).length;
    const perMonth = totalBase / meses;
    const remaining = Math.max(totalBase - perMonth * paid, 0);
    return Math.round(remaining * 100) / 100;
  };

  /* ---- Totales de egreso AJUSTADOS (arriba) con crédito restante ---- */
  const expenseTotalsAdjusted = useMemo(()=>{
    let eff=0, tra=0, tar=0, cred=0;
    for(const b of batches){
      eff += Number(b?.expSums?.Efectivo||0);
      tra += Number(b?.expSums?.Transferencia||0);
      tar += Number(b?.expSums?.Tarjeta||0);
      cred += creditOutstanding(b);
    }
    return { total: eff+tra+tar+cred, Efectivo: eff, Transferencia: tra, Tarjeta: tar, Crédito: cred };
  },[batches]);

  const netIncomeTotals = useMemo(()=>{
    const eff = incomeTotals.Efectivo - expenseTotalsAdjusted.Efectivo;
    const tra = incomeTotals.Transferencia - expenseTotalsAdjusted.Transferencia;
    const tar = incomeTotals.Tarjeta - expenseTotalsAdjusted.Tarjeta;
    const otro = incomeTotals.Otro;
    return { total: eff+tra+tar+otro, Efectivo: eff, Transferencia: tra, Tarjeta: tar, Otro: otro };
  },[incomeTotals,expenseTotalsAdjusted]);

  /* ---- Helper: fecha “dominante” del corte ---- */
  const dominantDate = (arr) => {
    if (!arr.length) return todayStrMX();
    const map = new Map();
    for (const d of arr) map.set(d, (map.get(d)||0)+1);
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1] || (a[0]<b[0]?1:-1))[0][0];
  };

  /* ---- Enviar (crea un corte/batch) ---- */
  const commitAll = async () => {
    const newIncome = [];
    const newExpense = [];
    const incSums = { Otros:0, Efectivo:0, Tarjeta:0, Transferencia:0 };
    const expSums = { Efectivo:0, Tarjeta:0, Transferencia:0, Crédito:0 };
    const notas = [];

    // Metadatos
    const incMetaAcc = { otros: [] };
    const expMetaAcc = { pedido: [], credito: null };
    const expNotesAcc = [];

    const batchId = 'B'+Date.now()+Math.random().toString(36).slice(2,6);

    // INGRESOS
    incomeRows.forEach(r => {
      const pushIf = (method, amount, note = '') => {
        const n = Number(String(amount).replace(/[^0-9.\-]/g, ''));
        if (!isNaN(n) && n > 0) {
          newIncome.push({ id:idCounter.current++, batchId, date: r.date || todayStrMX(), method, amount: n, note });
          if (method==='Efectivo') incSums.Efectivo += n;
          else if (method==='Tarjeta') incSums.Tarjeta += n;
          else if (method==='Transferencia') incSums.Transferencia += n;
          else incSums.Otros += n;

          if (method === 'Otro') {
            incMetaAcc.otros.push({ ruta: note, cifra: n });
          }
          if (note) notas.push(note);
        }
      };
      pushIf('Efectivo', r.efectivo);
      pushIf('Transferencia', r.transferencia);
      pushIf('Tarjeta', r.tarjeta);

      // “Otros” categorizado + cifra (ingresos)
      const otrosNotaRuta = [r.otrosLabel, r.otrosCat1, r.otrosCat2, r.otrosCat3]
        .filter(Boolean).join(' / ');
      const otrosMontoFinal = r.otosCifra ?? r.otrosCifra ?? r.otrosMonto; // tolera typo previo
      if (r.otrosCat1 || r.otrosCat2 || r.otrosCat3 || otrosMontoFinal) {
        pushIf('Otro', otrosMontoFinal, otrosNotaRuta);
      }
    });

    // EGRESOS
    expenseRows.forEach(r => {
      const pushExp = (method, amount, note = '') => {
        const n = Number(String(amount).replace(/[^0-9.\-]/g, ''));
        if (!isNaN(n) && n > 0) {
          const notaBase = note?.trim() || '';
          newExpense.push({
            id: idCounter.current++,
            batchId,
            date: r.date || todayStrMX(),
            method: method || 'Efectivo',
            amount: n,
            note: notaBase
          });
          if (method==='Efectivo') expSums.Efectivo += n;
          else if (method==='Tarjeta') expSums.Tarjeta += n;
          else if (method==='Transferencia') expSums.Transferencia += n;
          else if (method==='Crédito') expSums.Crédito += n;
          if (notaBase) notas.push(notaBase);
        }
      };

      // 1) Egreso general (Monto)
      let extraCredito = '';
      if ((r.method || 'Efectivo') === 'Crédito') {
        const partes = [];
        if (r.creditoInicio) partes.push(`Inicio: ${r.creditoInicio}`);
        if (r.creditoFin) partes.push(`Fin: ${r.creditoFin}`);
        if (r.creditoMeses) partes.push(`Meses: ${r.creditoMeses}`);
        if (partes.length) extraCredito = ` [Crédito · ${partes.join(' · ')}]`;

        const montoCreditoN = Number(String(r.amount).replace(/[^0-9.\-]/g,'')) || 0;
        // Metadato para mostrar crédito en el resumen (incluye total del crédito)
        expMetaAcc.credito = {
          inicio: r.creditoInicio || '',
          fin: r.creditoFin || '',
          meses: Number(r.creditoMeses || 0),
          total: montoCreditoN
        };
      }
      pushExp(r.method, r.amount, (r.note || '') + extraCredito);

      // Guardar SOLO la descripción/nota manual para la columna "Descripción / Nota"
      if (r.note?.trim()) expNotesAcc.push(r.note.trim());

      // 2) “Pedido” (desplegable) + metadato (conteo)
      const pedidoRutaParts = ['Pedido'];
      if (r.pedidoCat1) {
        pedidoRutaParts.push(r.pedidoCat1 === 'Otro' ? (r.pedidoOtro?.trim() || 'Otro') : r.pedidoCat1);
      }
      if (r.pedidoCat2) pedidoRutaParts.push(r.pedidoCat2);
      if (r.pedidoCat3) pedidoRutaParts.push(r.pedidoCat3);
      const pedidoRuta = pedidoRutaParts.filter(Boolean).join(' / ');

      const nPedido = Number(String(r.pedidoCifra).replace(/[^0-9.\-]/g, ''));
      if (r.pedidoCat1 || r.pedidoCat2 || r.pedidoCat3 || r.pedidoOtro || (!isNaN(nPedido) && nPedido > 0)) {
        expMetaAcc.pedido.push({ ruta: pedidoRuta, cifra: !isNaN(nPedido) && nPedido > 0 ? nPedido : 0 });
      }
    });

    if (!newIncome.length && !newExpense.length) return;

    const chosenDate = dominantDate([
      ...newIncome.map(x=>x.date),
      ...newExpense.map(x=>x.date),
    ]);

    // Construimos el batch que guardaremos también en BD
    const newBatch = {
      id: batchId,
      date: chosenDate,
      incSums, expSums,
      incMeta: incMetaAcc,
      expMeta: expMetaAcc,
      expNote: [...new Set(expNotesAcc)].join(' • '),
      notas: [...new Set(notas)].join(' • '),
      creditPaidMonths: []
    };

    // Optimista en UI
    setIncomeEntries(prev => [...prev, ...newIncome]);
    setExpenseEntries(prev => [...prev, ...newExpense]);
    setBatches(prev => [...prev, newBatch]);

    // Persistir en BD (en snake_case)
    try {
      const saved = await apiPost(API_BASE, camelToServer(newBatch));
      const serverId = saved?.id || saved?.data?.id;
      if (serverId && serverId !== batchId) {
        setBatches(prev => prev.map(b => b.id === batchId ? { ...b, id: serverId } : b));
        setIncomeEntries(prev => prev.map(e => e.batchId === batchId ? { ...e, batchId: serverId } : e));
        setExpenseEntries(prev => prev.map(e => e.batchId === batchId ? { ...e, batchId: serverId } : e));
      }
    } catch (e) {
      console.error(e);
      setServerError('No se pudo guardar el corte en el servidor.');
    }

    // limpia inputs
    setIncomeRows([{
      date: todayStrMX(),
      efectivo: '', transferencia: '', tarjeta: '',
      otrosLabel: '', otrosMonto: '',
      otrosCat1: '', otrosCat2: '', otrosCat3: '', otrosCifra: ''
    }]);

    setExpenseRows([{
      date: todayStrMX(),
      method: 'Efectivo',
      amount: '', note: '',
      pedidoCat1: '', pedidoCat2: '', pedidoCat3: '', pedidoCifra: '', pedidoOtro:'',
      creditoInicio: '', creditoFin: '', creditoMeses: '', creditoFinManual: false
    }]);
  };

  /* ====================== Filtro: por día (prioridad) o por mes ====================== */
  const filteredBatches = useMemo(() => {
    let arr = batches.filter(b => !isEmptyBatch(b)); // anti-fantasma adicional
    if (selectedDay) {
      arr = arr.filter(b => b.date === selectedDay);
    } else if (selectedMonth) {
      arr = arr.filter(b => String(b.date).startsWith(selectedMonth));
    }
    return arr.sort((a,b)=>(a.date<b.date?1:-1));
  }, [batches, selectedDay, selectedMonth]);

  /* ====================== Acciones (Ingreso/Egreso) ====================== */
  const [editingIncomeFor, setEditingIncomeFor] = useState(null);  // batchId
  const [editingExpenseFor, setEditingExpenseFor] = useState(null); // batchId
  const [editData, setEditData] = useState({ inc:{}, exp:{}, nota:'' });

  const openIncomeEditor = (batch) => {
    setEditingExpenseFor(null);
    setEditingIncomeFor(batch.id);
    setEditData({
      inc: { ...batch.incSums },
      exp: { ...batch.expSums },
      nota: batch.notas || ''
    });
  };
  const openExpenseEditor = (batch) => {
    setEditingIncomeFor(null);
    setEditingExpenseFor(batch.id);
    setEditData({
      inc: { ...batch.incSums },
      exp: { ...batch.expSums },
      nota: batch.notas || ''
    });
  };
  const cancelEditors = () => {
    setEditingIncomeFor(null);
    setEditingExpenseFor(null);
  };

  const saveIncomeEdit = async () => {
    const id = editingIncomeFor; if (!id) return;

    // Optimista UI
    setIncomeEntries(prev => prev.filter(e=>e.batchId!==id));
    const toAdd = [];
    const pushIf = (methodKey, storeMethod) => {
      const raw = Number(String(editData.inc[methodKey] ?? 0).toString().replace(/[^0-9.\-]/g,''));
      if (!isNaN(raw) && raw>0) {
        toAdd.push({ id:idCounter.current++, batchId:id, date: batches.find(b=>b.id===id)?.date || todayStrMX(), method: storeMethod, amount: raw, note: editData.nota || ''});
      }
    };
    pushIf('Efectivo','Efectivo');
    pushIf('Tarjeta','Tarjeta');
    pushIf('Transferencia','Transferencia');
    pushIf('Otros','Otro');
    setIncomeEntries(prev => [...prev, ...toAdd]);

    const newBatch = {
      incSums: {
        Efectivo: Number(editData.inc.Efectivo||0)||0,
        Tarjeta: Number(editData.inc.Tarjeta||0)||0,
        Transferencia: Number(editData.inc.Transferencia||0)||0,
        Otros: Number(editData.inc.Otros||0)||0
      },
      notas: editData.nota
    };
    setBatches(prev => prev.map(b => b.id!==id ? b : { ...b, ...newBatch }));

    // Persistir en BD (snake_case)
    try {
      await apiPut(`${API_BASE}/${id}`, camelToServer(newBatch));
    } catch (e) {
      console.error(e);
      setServerError('No se pudo actualizar ingresos en el servidor.');
    }

    // Si al dejar ingresos en cero y egresos ya están en cero, borra el corte en BD
    try {
      const existing = batches.find(b=>b.id===id);
      const expZero = !((existing?.expSums?.Efectivo||0) || (existing?.expSums?.Tarjeta||0) || (existing?.expSums?.Transferencia||0) || (existing?.expSums?.Crédito||0));
      const incZero = !((newBatch.incSums.Efectivo||0) || (newBatch.incSums.Tarjeta||0) || (newBatch.incSums.Transferencia||0) || (newBatch.incSums.Otros||0));
      if (incZero && expZero) {
        await apiDelete(`${API_BASE}/${id}`);
      }
    } catch (e) {
      console.error(e);
      // opcional: muestra aviso pero no rompe flujo
    }

    cancelEditors();
  };

  const saveExpenseEdit = async () => {
    const id = editingExpenseFor; if (!id) return;

    // Optimista UI
    setExpenseEntries(prev => prev.filter(e=>e.batchId!==id));
    const toAdd = [];
    const pushIf = (methodKey) => {
      const raw = Number(String(editData.exp[methodKey] ?? 0).toString().replace(/[^0-9.\-]/g,''));
      if (!isNaN(raw) && raw>0) {
        toAdd.push({ id:idCounter.current++, batchId:id, date: batches.find(b=>b.id===id)?.date || todayStrMX(), method: methodKey, amount: raw, note: editData.nota || ''});
      }
    };
    ['Efectivo','Tarjeta','Transferencia','Crédito'].forEach(pushIf);
    setExpenseEntries(prev => [...prev, ...toAdd]);

    const newBatch = {
      expSums: {
        Efectivo: Number(editData.exp.Efectivo||0)||0,
        Tarjeta: Number(editData.exp.Tarjeta||0)||0,
        Transferencia: Number(editData.exp.Transferencia||0)||0,
        Crédito: Number(editData.exp.Crédito||0)||0
      },
      notas: editData.nota
    };
    setBatches(prev => prev.map(b => b.id!==id ? b : { ...b, ...newBatch }));

    // Persistir en BD (snake_case)
    try {
      await apiPut(`${API_BASE}/${id}`, camelToServer(newBatch));
    } catch (e) {
      console.error(e);
      setServerError('No se pudo actualizar egresos en el servidor.');
    }

    // Si egresos quedan en cero y los ingresos ya estaban en cero, borra el corte en BD
    try {
      const existing = batches.find(b=>b.id===id);
      const incZero = !((existing?.incSums?.Efectivo||0) || (existing?.incSums?.Tarjeta||0) || (existing?.incSums?.Transferencia||0) || (existing?.incSums?.Otros||0));
      const expZero = !((newBatch.expSums.Efectivo||0) || (newBatch.expSums.Tarjeta||0) || (newBatch.expSums.Transferencia||0) || (newBatch.expSums.Crédito||0));
      if (incZero && expZero) {
        await apiDelete(`${API_BASE}/${id}`);
      }
    } catch (e) {
      console.error(e);
    }

    cancelEditors();
  };

  const deleteIncomeSide = async (batchId) => {
    if (!confirm('¿Eliminar ingresos de este corte?')) return;

    // Optimista UI
    setIncomeEntries(prev => prev.filter(e=>e.batchId!==batchId));
    setBatches(prev => {
      const nb = prev.map(b => b.id!==batchId ? b : ({...b, incSums:{Otros:0,Efectivo:0,Tarjeta:0,Transferencia:0}, incMeta:{otros:[]}}));
      return nb.filter(b => (b.incSums.Efectivo+b.incSums.Tarjeta+b.incSums.Transferencia+b.incSums.Otros>0) ||
                            (b.expSums.Efectivo+b.expSums.Tarjeta+b.expSums.Transferencia+b.expSums.Crédito>0));
    });
    cancelEditors();

    // Persistir en BD
    try {
      await apiPut(`${API_BASE}/${batchId}`, camelToServer({
        incSums:{Otros:0,Efectivo:0,Tarjeta:0,Transferencia:0},
        incMeta:{otros:[]}
      }));
      // Si el otro lado ya está en cero, borrar corte en BD
      const existing = batches.find(b=>b.id===batchId);
      const expZero = !((existing?.expSums?.Efectivo||0) || (existing?.expSums?.Tarjeta||0) || (existing?.expSums?.Transferencia||0) || (existing?.expSums?.Crédito||0));
      if (expZero) await apiDelete(`${API_BASE}/${batchId}`);
    } catch (e) {
      console.error(e);
      setServerError('No se pudo eliminar el lado de ingresos en el servidor.');
    }
  };

  const deleteExpenseSide = async (batchId) => {
    if (!confirm('¿Eliminar egresos de este corte?')) return;

    // Optimista UI
    setExpenseEntries(prev => prev.filter(e=>e.batchId!==batchId));
    setBatches(prev => {
      const nb = prev.map(b => b.id!==batchId ? b : ({...b, expSums:{Efectivo:0,Tarjeta:0,Transferencia:0,Crédito:0}, expMeta:{pedido:[], credito:null}, creditPaidMonths:[], expNote:''}));
      return nb.filter(b => (b.incSums.Efectivo+b.incSums.Tarjeta+b.incSums.Transferencia+b.incSums.Otros>0) ||
                            (b.expSums.Efectivo+b.expSums.Tarjeta+b.expSums.Transferencia+b.expSums.Crédito>0));
    });
    cancelEditors();

    // Persistir en BD
    try {
      await apiPut(`${API_BASE}/${batchId}`, camelToServer({
        expSums:{Efectivo:0,Tarjeta:0,Transferencia:0,Crédito:0},
        expMeta:{pedido:[], credito:null},
        creditPaidMonths:[],
        expNote:''
      }));
      // Si ingresos ya están en cero, borrar corte en BD
      const existing = batches.find(b=>b.id===batchId);
      const incZero = !((existing?.incSums?.Efectivo||0) || (existing?.incSums?.Tarjeta||0) || (existing?.incSums?.Transferencia||0) || (existing?.incSums?.Otros||0));
      if (incZero) await apiDelete(`${API_BASE}/${batchId}`);
    } catch (e) {
      console.error(e);
      setServerError('No se pudo eliminar el lado de egresos en el servidor.');
    }
  };

/* ====================== Pago de crédito ====================== */
const [payOpenFor, setPayOpenFor] = useState(null);      // despliegue de menú de meses
const [paying, setPaying] = useState({});                // { "batchId:mes": true } para deshabilitar mientras paga

// Pagar un mes (optimista + rollback + sync con server)
const payCreditMonth = async (batchId, monthIndex = 1) => {
  const key = `${batchId}:${monthIndex}`;
  setPayOpenFor(null);

  // 1) Optimista: agrega el mes a la UI
  let prevMonths = null;
  setBatches(prev => prev.map(b => {
    if (b.id !== batchId) return b;
    prevMonths = b.creditPaidMonths || [];
    const set = new Set(prevMonths);
    set.add(monthIndex);
    return { ...b, creditPaidMonths: Array.from(set).sort((a, b) => a - b) };
  }));
  setPaying(p => ({ ...p, [key]: true }));

  try {
    // 2) Llama al endpoint dedicado
    const r = await fetch(`/sa/batches/${batchId}/pay-month`, {
      method: 'PUT',
      headers: baseHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ month: monthIndex }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.message || 'No se pudo pagar el mes');

    // 3) Sincroniza exactamente lo que devolvió el servidor
    setBatches(prev => prev.map(b => (
      b.id === j.id
        ? {
            ...b,
            creditPaidMonths: j.creditPaidMonths || [],
            status: j.status ?? b.status,
            paidAt: j.paidAt ?? b.paidAt,
            expMeta: j.expMeta ?? b.expMeta,
          }
        : b
    )));
  } catch (e) {
    // Rollback si falla
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      return { ...b, creditPaidMonths: prevMonths || [] };
    }));
    setServerError(e.message || 'Error al pagar el mes.');
  } finally {
    setPaying(p => { const cp = { ...p }; delete cp[key]; return cp; });
  }
};

// Revertir pago de un mes (optimista + rollback)
const unpayCreditMonth = async (batchId, monthIndex = 1) => {
  const key = `${batchId}:${monthIndex}`;

  // 1) Optimista: quita el mes en UI
  let prevMonths = null;
  setBatches(prev => prev.map(b => {
    if (b.id !== batchId) return b;
    prevMonths = b.creditPaidMonths || [];
    return { ...b, creditPaidMonths: (prevMonths || []).filter(m => m !== monthIndex) };
  }));
  setPaying(p => ({ ...p, [key]: true }));

  try {
    // 2) Llama al endpoint dedicado
    const r = await fetch(`/sa/batches/${batchId}/unpay-month`, {
      method: 'PUT',
      headers: baseHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ month: monthIndex }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.message || 'No se pudo revertir el pago');

    // 3) Sincroniza con lo del server
    setBatches(prev => prev.map(b => (
      b.id === j.id
        ? {
            ...b,
            creditPaidMonths: j.creditPaidMonths || [],
            status: j.status ?? b.status,
            paidAt: j.paidAt ?? b.paidAt,
            expMeta: j.expMeta ?? b.expMeta,
          }
        : b
    )));
  } catch (e) {
    // Rollback: vuelve a poner el mes
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      const set = new Set(prevMonths || []); set.add(monthIndex);
      return { ...b, creditPaidMonths: Array.from(set).sort((a, b) => a - b) };
    }));
    setServerError(e.message || 'Error al revertir el pago.');
  } finally {
    setPaying(p => { const cp = { ...p }; delete cp[key]; return cp; });
  }
};

// Paga el siguiente mes pendiente
const payCreditNext = async (b) => {
  const total = Math.max(1, Number(b?.expMeta?.credito?.meses || 0));
  if (!total) return;
  const paid = b?.creditPaidMonths || [];
  const next = Array.from({ length: total }, (_, i) => i + 1).find(m => !paid.includes(m));
  if (next) await payCreditMonth(b.id, next);
};

// Paga todos los meses restantes (secuencial para evitar condiciones de carrera)
const payCreditAll = async (b) => {
  const total = Math.max(1, Number(b?.expMeta?.credito?.meses || 0));
  if (!total) return;
  const paid = new Set(b?.creditPaidMonths || []);
  for (let m = 1; m <= total; m++) {
    if (!paid.has(m)) {
      await payCreditMonth(b.id, m);
      paid.add(m);
    }
  }
};

// Mostrar estado (colores) según crédito
const egresoStatusClass = (b) => {
  const c = b?.expMeta?.credito;
  if (!c) return '';
  const meses = Math.max(1, Number(c.meses || 0));
  const paidCount = (b.creditPaidMonths || []).length;

  // Todo pagado
  if (meses > 0 && paidCount >= meses) {
    return 'bg-emerald-700/20 border border-emerald-500/30';
  }

  // Próximo vencimiento
  const nextIndex = Math.min(paidCount + 1, meses);
  const nextDue = meses === 1 ? (c.fin || addMonthsMX(c.inicio, 1)) : addMonthsMX(c.inicio, nextIndex);
  const d = daysUntil(nextDue);

  if (d <= 0) return 'bg-rose-700/20 border border-rose-500/30';
  if (d <= 7) return 'bg-amber-500/20 border border-amber-400/30';
  if (paidCount > 0) return 'bg-sky-700/15 border border-sky-500/25';
  return '';
};









  
  /* ====================== Búsqueda ====================== */
  const [searchText, setSearchText] = useState('');
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const tableScrollRef = useRef(null);
  const topScrollRef = useRef(null);
  const scrollContentWidthRef = useRef(null);

  const norm = (s='') =>
    s.toString().toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu,'');

  const rowMatches = (b, q) => {
    const nq = norm(q);
    if (!nq) return false;
    // notas generales
    if (norm(b.notas||'').includes(nq)) return true;
    if (norm(b.expNote||'').includes(nq)) return true;
    // “Otros” (ingresos)
    if (b?.incMeta?.otros?.some(o=>norm(o.ruta||'').includes(nq))) return true;
    // “Pedido” (egresos)
    if (b?.expMeta?.pedido?.some(p=>norm(p.ruta||'').includes(nq))) return true;
    return false;
  };

  const scrollToBatch = (id) => {
    if (typeof document === 'undefined') return;
    const row = document.querySelector(`[data-bid="${id}"]`);
    const cont = tableScrollRef.current;
    if (row && cont) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const doSearch = (qStr) => {
    const q = (qStr ?? searchText).trim();
    if (!q) return;
    const list = filteredBatches;
    const found = list.find(b => rowMatches(b, q));
    if (found) scrollToBatch(found.id);
  };

  /* ====================== Scroll superior sincronizado (oculto) ====================== */
  useEffect(()=>{
    const top=topScrollRef.current, cont=tableScrollRef.current; if(!top||!cont) return;
    const onTop=()=>{ cont.scrollLeft=top.scrollLeft; };
    const onCont=()=>{ top.scrollLeft=cont.scrollLeft; };
    top.addEventListener('scroll',onTop); cont.addEventListener('scroll',onCont);
    const syncWidth=()=>{
      const table=cont.querySelector('table');
      if(table&&scrollContentWidthRef.current){
        scrollContentWidthRef.current.style.width=table.scrollWidth+'px';
      }
    };
    syncWidth(); window.addEventListener('resize',syncWidth);
    return ()=>{ top.removeEventListener('scroll',onTop); cont.removeEventListener('scroll',onCont); window.removeEventListener('resize',syncWidth); };
  },[filteredBatches.length, editingIncomeFor, editingExpenseFor]);

  const panelMotion = { initial:{opacity:0,y:12,scale:.98}, animate:{opacity:1,y:0,scale:1,transition:{duration:.45,ease:[0.22,1,0.36,1]}} };

  /* ====================== Render ====================== */
  return (
    <>
      <Head title="SA · Dashboard" />
      <HeaderAdmin />

      <main className="min-h-screen bg-[#0b0b10] text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6 space-y-8">

          {/* Métricas de tráfico */}
          <section className="flex justify-center">
            <div className="flex flex-wrap items-center gap-4">
              <TrafficPill icon={<FiActivity className="h-4 w-4" />} label="Activos en sitio (en vivo)" value={traffic.live} loading={trafficLoading} />
              <TrafficPill icon={<FiUsers className="h-4 w-4" />} label="Únicos del mes" value={traffic.monthly} loading={trafficLoading} />
            </div>
          </section>

          {/* Mostrar error del servidor si hay */}
          {serverError && (
            <div className="max-w-7xl mx-auto">
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 px-4 py-3">
                {serverError}
              </div>
            </div>
          )}

          {/* Tarjetas de totales */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div {...panelMotion} className={panelCx}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold flex items-center gap-2"><FiTrendingUp /> Ingresos (neto)</h2>
                <div className="text-sm text-white/60">Total: <span className="font-semibold text-white">{mxn.format(netIncomeTotals.total)}</span></div>
              </div>
              <div className="text-[11px] text-white/50 mb-4">Ingresos − Egresos por método (Efectivo, Transferencia, Tarjeta)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <CardStat label="Efectivo" value={netIncomeTotals.Efectivo}/>
                <CardStat label="Transferencia" value={netIncomeTotals.Transferencia}/>
                <CardStat label="Tarjeta" value={netIncomeTotals.Tarjeta}/>
                <CardStat label="Otro" value={netIncomeTotals.Otro}/>
              </div>
            </motion.div>

            <motion.div {...panelMotion} className={panelCx}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><FiTrendingDown /> Egresos</h2>
                {/* Total ajustado con crédito restante */}
                <div className="text-sm text-white/60">Total: <span className="font-semibold text-white">{mxn.format(expenseTotalsAdjusted.total)}</span></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <CardStat label="Efectivo" value={expenseTotalsAdjusted.Efectivo}/>
                <CardStat label="Transferencia" value={expenseTotalsAdjusted.Transferencia}/>
                <CardStat label="Tarjeta" value={expenseTotalsAdjusted.Tarjeta}/>
                {/* Crédito ajustado (restante) */}
                <CardStat label="Crédito" value={expenseTotalsAdjusted.Crédito}/>
              </div>
            </motion.div>
          </section>

          {/* CAPTURAS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Ingresos */}
            <motion.div {...panelMotion} className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white/90">Ingreso — captura</h3>
              </div>
              <div className="px-5 py-5">
                {incomeRows.map((r, idx)=>(
                  <div key={idx} className="grid gap-4">
                    <div>
                      <label className="block mb-1 text-sm text-white/80"><FiCalendar className="inline mr-1 -mt-1"/> Fecha</label>
                      <UIInput type="date" value={r.date||todayStrMX()} onChange={v=>updateIncome(idx,'date',v)}/>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-white/80">Efectivo</label>
                      <CurrencyInput value={r.efectivo} onChange={v=>updateIncome(idx,'efectivo',v)}/>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-white/80">Transferencia</label>
                      <CurrencyInput value={r.transferencia} onChange={v=>updateIncome(idx,'transferencia',v)}/>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-white/80">Tarjeta</label>
                      <CurrencyInput value={r.tarjeta} onChange={v=>updateIncome(idx,'tarjeta',v)}/>
                    </div>

                    {/* DESCRIPCIÓN LIBRE */}
                    <div>
                      <label className="block mb-1 text-sm text-white/80">Otros (concepto)</label>
                      <UIInput
                        value={r.otrosLabel}
                        onChange={v=>updateIncome(idx,'otrosLabel',v)}
                        placeholder="Descripción"
                      />
                    </div>

                    {/* “Otros” (ingresos) + cifra */}
                    <div className="grid gap-3">
                      <div>
                        <label className="block mb-1 text-sm text-white/80">Otros</label>
                        <UISelect
                          value={r.otrosCat1}
                          onChange={(v)=>{
                            updateIncome(idx,'otrosCat1',v);
                            updateIncome(idx,'otrosCat2','');
                            updateIncome(idx,'otrosCat3','');
                          }}
                        >
                          <option value="">Selecciona…</option>
                          {CAT1.filter(x=>x!=='Otro').map(o => <option key={o} value={o}>{o}</option>)}
                        </UISelect>
                      </div>

                      {cat2Options(r.otrosCat1).length > 0 && (
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Subcategoría</label>
                          <UISelect
                            value={r.otrosCat2}
                            onChange={(v)=>{
                              updateIncome(idx,'otrosCat2',v);
                              if (!(r.otrosCat1 === 'Playera' && v === 'Playera Oversize')) {
                                updateIncome(idx,'otrosCat3','');
                              }
                            }}
                          >
                            <option value="">Selecciona…</option>
                            {cat2Options(r.otrosCat1).map(o => <option key={o} value={o}>{o}</option>)}
                          </UISelect>
                        </div>
                      )}

                      {cat3Options(r.otrosCat1, r.otrosCat2).length > 0 && (
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Detalle</label>
                          <UISelect
                            value={r.otrosCat3}
                            onChange={(v)=>updateIncome(idx,'otrosCat3',v)}
                          >
                            <option value="">Selecciona…</option>
                            {cat3Options(r.otrosCat1, r.otrosCat2).map(o => <option key={o} value={o}>{o}</option>)}
                          </UISelect>
                        </div>
                      )}

                      <div>
                        <label className="block mb-1 text-sm text-white/80">Cifra</label>
                        <CountInput
                          value={r.otrosCifra}
                          onChange={v=>updateIncome(idx,'otrosCifra',v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Egresos */}
            <motion.div {...panelMotion} className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white/90">Egreso — captura</h3>
              </div>
              <div className="px-5 py-5">
                {expenseRows.map((r, idx)=>(
                  <div key={idx} className="grid gap-4">
                    <div>
                      <label className="block mb-1 text-sm text-white/80"><FiCalendar className="inline mr-1 -mt-1"/> Fecha</label>
                      <UIInput type="date" value={r.date||todayStrMX()} onChange={v=>updateExpense(idx,'date',v)}/>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-white/80">Método</label>
                      <UISelect
                        value={r.method}
                        onChange={v=>updateExpense(idx,'method',v)}
                      >
                        <option>Efectivo</option>
                        <option>Transferencia</option>
                        <option>Tarjeta</option>
                        <option>Crédito</option>
                      </UISelect>
                    </div>

                    {/* Si es Crédito, mostrar fechas y meses (con cálculo automático de Fin) */}
                    {r.method === 'Crédito' && (
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Inicio del crédito</label>
                          <UIInput
                            type="date"
                            value={r.creditoInicio}
                            onChange={v=>updateExpense(idx,'creditoInicio',v)}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Fin del crédito</label>
                          <UIInput
                            type="date"
                            value={r.creditoFin}
                            onChange={v=>updateExpense(idx,'creditoFin',v)}
                          />
                          <div className="mt-1 text-[11px] text-white/50">
                            {r.creditoFinManual
                              ? 'Fin establecido manualmente.'
                              : 'Se calcula automáticamente con Inicio + Meses.'}
                          </div>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Meses</label>
                          <UIInput
                            type="number"
                            value={r.creditoMeses}
                            onChange={v=>updateExpense(idx,'creditoMeses',v)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block mb-1 text-sm text-white/80">Monto</label>
                      <CurrencyInput value={r.amount} onChange={v=>updateExpense(idx,'amount',v)}/>
                    </div>

                    {/* Pedido */}
                    <div className="grid gap-3">
                      <div>
                        <label className="block mb-1 text-sm text-white/80">Pedido</label>
                        <UISelect
                          value={r.pedidoCat1}
                          onChange={(v)=>{
                            updateExpense(idx,'pedidoCat1',v);
                            updateExpense(idx,'pedidoCat2','');
                            updateExpense(idx,'pedidoCat3','');
                            if (v !== 'Otro') updateExpense(idx,'pedidoOtro','');
                          }}
                        >
                          <option value="">Selecciona…</option>
                          {CAT1.map(o => <option key={o} value={o}>{o}</option>)}
                        </UISelect>
                      </div>

                      {r.pedidoCat1 === 'Otro' && (
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Especificar (Otro)</label>
                          <UIInput
                            value={r.pedidoOtro}
                            onChange={(v)=>updateExpense(idx,'pedidoOtro',v)}
                            placeholder="Escribe el concepto"
                          />
                        </div>
                      )}

                      {cat2Options(r.pedidoCat1).length > 0 && (
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Subcategoría</label>
                          <UISelect
                            value={r.pedidoCat2}
                            onChange={(v)=>{
                              updateExpense(idx,'pedidoCat2',v);
                              if (!(r.pedidoCat1 === 'Playera' && v === 'Playera Oversize')) {
                                updateExpense(idx,'pedidoCat3','');
                              }
                            }}
                          >
                            <option value="">Selecciona…</option>
                            {cat2Options(r.pedidoCat1).map(o => <option key={o} value={o}>{o}</option>)}
                          </UISelect>
                        </div>
                      )}

                      {cat3Options(r.pedidoCat1, r.pedidoCat2).length > 0 && (
                        <div>
                          <label className="block mb-1 text-sm text-white/80">Detalle</label>
                          <UISelect
                            value={r.pedidoCat3}
                            onChange={(v)=>updateExpense(idx,'pedidoCat3',v)}
                          >
                            <option value="">Selecciona…</option>
                            {cat3Options(r.pedidoCat1, r.pedidoCat2).map(o => <option key={o} value={o}>{o}</option>)}
                          </UISelect>
                        </div>
                      )}

                      <div>
                        <label className="block mb-1 text-sm text-white/80">Cifra</label>
                        <CountInput
                          value={r.pedidoCifra}
                          onChange={v=>updateExpense(idx,'pedidoCifra',v)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-white/80">Descripción / Nota</label>
                      <UIInput value={r.note} onChange={v=>updateExpense(idx,'note',v)} placeholder="Descripción / referencia"/>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-6 flex justify-center">
                <motion.button
                  onClick={commitAll}
                  whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                  className="relative inline-flex items-center justify-center px-8 py-3 rounded-2xl font-semibold
                             bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 text-white shadow-lg
                             focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40"
                >
                  <span className="absolute inset-0 rounded-2xl blur-xl opacity-60" />
                  <span className="relative">{serverLoading ? 'Guardando…' : 'Enviar'}</span>
                </motion.button>
              </div>
            </motion.div>
          </section>

          {/* Filtro de DÍA + BUSCADOR */}
          <section className="flex flex-wrap items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <label className="text-sm text-white/70">Día:</label>
              <input
                type="date"
                value={selectedDay}
                onChange={(e)=>setSelectedDay(e.target.value)}
                className="rounded-lg bg-white/10 border border-white/15 text-white px-3 py-1 outline-none"
                max={todayStrMX()}
              />
              {selectedDay && (
                <button
                  onClick={()=>setSelectedDay('')}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Quitar filtro
                </button>
              )}
            </div>

            {/* Buscador libre */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <input
                value={searchText}
                onChange={e=>setSearchText(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') doSearch(); }}
                placeholder="Buscar descripción / otros / pedido…"
                className="bg-transparent outline-none text-sm text-white placeholder-white/50"
              />
              <button onClick={()=>doSearch()} className="text-xs px-2 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600">Buscar</button>
            </div>

            {/* Menú de categorías */}
            <div className="relative">
              <button
                onClick={()=>setCatMenuOpen(v=>!v)}
                className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
              >
                Categorías
              </button>
              {catMenuOpen && (
                <div className="absolute z-10 mt-1 w-40 rounded-lg border border-white/10 bg-[#15151c] shadow p-1">
                  {['Playera','Sudadera','Short','Accesorios'].map(opt=>(
                    <button
                      key={opt}
                      onClick={()=>{ setCatMenuOpen(false); setSearchText(opt); doSearch(opt); }}
                      className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Scroll superior (oculto para eliminar barra horizontal) */}
          <div id="scrollbar-superior" ref={topScrollRef} className="hidden">
            <div id="scrollbar-superior-content" ref={scrollContentWidthRef} style={{width:1800,height:1}}/>
          </div>

          {/* Tabla de RESUMEN por cortes (compacta, sin scroll horizontal) */}
          <section
            id="tabla-movimientos"
            ref={tableScrollRef}
            className="max-w-7xl mx-auto bg-white/5 border border-white/10 rounded-2xl overflow-x-hidden"
          >
            <table className="w-full table-fixed text-xs divide-y divide-white/10">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[36%]" />
                <col className="w-[90px]" />
                <col className="w-[36%]" />
                <col className="w-[20%]" />
                <col className="w-[110px]" />
              </colgroup>
              <thead className="bg-white/5 text-white/80 uppercase">
                <tr className="tracking-wide">
                  <Th className="text-center">Fecha</Th>
                  <Th className="text-center">Ingresos</Th>
                  <Th className="text-center">Acción (Ing.)</Th>
                  <Th className="text-center">Egresos</Th>
                  <Th className="text-center">Descripción / Nota</Th>
                  <Th className="text-center">Acción (Egr.)</Th>
                </tr>
              </thead>

              <tbody className="text-white">
                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-white/60">
                      {serverLoading ? 'Cargando…' : 'No hay movimientos para la selección.'}
                    </td>
                  </tr>
                )}

                {filteredBatches.map((b) => {
                  const incS = b?.incSums || {};
                  const expS = b?.expSums || {};
                  const hasInc = ((incS.Efectivo||0)+(incS.Tarjeta||0)+(incS.Transferencia||0)+(incS.Otros||0)) > 0;
                  const hasExp = ((expS.Efectivo||0)+(expS.Tarjeta||0)+(expS.Transferencia||0)+(expS.Crédito||0)) > 0;

                  const editInc = editingIncomeFor===b.id;
                  const editExp = editingExpenseFor===b.id;
                  const egresoCx = egresoStatusClass(b);

                  const mesesCount = Math.max(1, Number(b?.expMeta?.credito?.meses || 0));
                  const paidCount = (b.creditPaidMonths || []).length;
        const fullyPaid = (b.status === 'paid') ||
                  ((expS?.Crédito || 0) > 0 && mesesCount > 0 && paidCount >= mesesCount);

                  return (
                    <React.Fragment key={b.id}>
                      <tr data-bid={b.id} className="hover:bg-white/5 border-t border-white/10 align-top">
                        {/* Fecha */}
                        <Td className="text-center align-middle">{formatDMY(b.date)}</Td>

                        {/* Ingresos */}
                        <Td className="align-middle">
                          <div className="flex flex-col items-center justify-center gap-2 py-1">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 justify-items-center">
                              <MiniStat label="Otros" value={incS.Otros}/>
                              <MiniStat label="Efectivo" value={incS.Efectivo}/>
                              <MiniStat label="Tarjeta" value={incS.Tarjeta}/>
                              <MiniStat label="Transferencia" value={incS.Transferencia}/>
                            </div>
                            {b?.incMeta?.otros?.length ? (
                              <div className="text-[11px] text-white/70 space-y-1 text-center">
                                {b.incMeta.otros.map((o, i) => (
                                  <div key={i} className="inline-flex flex-wrap gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">{o.ruta || 'Otros'}</span>
                                    <span className="opacity-80">— {Number(o.cifra||0).toLocaleString('es-MX')}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </Td>

                        {/* Acción (Ing.) */}
                        <Td className="align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => editInc ? cancelEditors() : openIncomeEditor(b)}
                              className={`p-1.5 rounded-lg ${hasInc ? 'bg-indigo-600/80 hover:bg-indigo-600' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
                              title={hasInc ? (editInc ? 'Cerrar edición ingreso' : 'Editar ingreso de este corte') : 'Sin ingresos'}
                              disabled={!hasInc}
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteIncomeSide(b.id)}
                              className={`p-1.5 rounded-lg ${hasInc ? 'bg-rose-600/80 hover:bg-rose-600' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
                              title={hasInc ? 'Eliminar ingresos de este corte' : 'Sin ingresos'}
                              disabled={!hasInc}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Td>

                        {/* Egresos */}
                        <Td className={`align-top rounded-lg ${egresoCx}`}>
                          <div className="flex flex-col items-center justify-center gap-2 py-1">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 justify-items-center">
                              <MiniStat label="Efectivo" value={expS.Efectivo}/>
                              <MiniStat label="Tarjeta" value={expS.Tarjeta}/>
                              <MiniStat label="Transferencia" value={expS.Transferencia}/>
                              <MiniStat label="Crédito" value={expS.Crédito}/>
                            </div>

                            {b?.expMeta?.credito && (b.expMeta.credito.inicio || b.expMeta.credito.fin || b.expMeta.credito.meses) && (
                              <div className="text-[11px] text-white/85 space-x-2 text-center">
                                <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Crédito</span>
                                {b.expMeta.credito.inicio && <span>Inicio: {formatDMY(b.expMeta.credito.inicio)}</span>}
                                {b.expMeta.credito.fin && <span>Fin: {formatDMY(b.expMeta.credito.fin)}</span>}
                                {b.expMeta.credito.meses ? <span>Meses: {b.expMeta.credito.meses}</span> : null}
                              </div>
                            )}

                            {b?.expMeta?.pedido?.length ? (
                              <div className="text-[11px] text-white/85 space-y-1 text-center">
                                {b.expMeta.pedido.map((p,i)=>(
                                  <div key={i} className="inline-flex flex-wrap gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">{p.ruta || 'Pedido'}</span>
                                    <span className="opacity-80">— {Number(p.cifra||0).toLocaleString('es-MX')}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {(b.creditPaidMonths||[]).length>0 && (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {b.creditPaidMonths.map(m=> (
                                  <span key={m} className="text-[11px] px-2 py-0.5 rounded bg-emerald-700/30 border border-emerald-500/30">
                                    Mes {m} ✓
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Td>

                        {/* Nota */}
                        <Td className="align-top">
                          <div className="text-white/85 whitespace-pre-wrap break-words text-center">
                            {b.expNote || '—'}
                          </div>
                        </Td>

                        {/* Acción (Egr.) + Pagar */}
                        <Td className={`align-middle ${egresoCx ? 'rounded-lg' : ''}`}>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => editExp ? cancelEditors() : openExpenseEditor(b)}
                              className={`p-1.5 rounded-lg ${hasExp ? 'bg-indigo-600/80 hover:bg-indigo-600' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
                              title={hasExp ? (editExp ? 'Cerrar edición egreso' : 'Editar egreso de este corte') : 'Sin egresos'}
                              disabled={!hasExp}
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteExpenseSide(b.id)}
                              className={`p-1.5 rounded-lg ${hasExp ? 'bg-rose-600/80 hover:bg-rose-600' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
                              title={hasExp ? 'Eliminar egresos de este corte' : 'Sin egresos'}
                              disabled={!hasExp}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>

                            {(expS?.Crédito || 0) > 0 && (
                              <div className="relative flex items-center gap-2">
                                {fullyPaid ? (
                                  <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600/90 cursor-default" disabled>
                                    Pagado
                                  </button>
                                ) : mesesCount === 1 ? (
                                <button
  onClick={()=>payCreditMonth(b.id,1)}
  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
    (b.creditPaidMonths||[]).includes(1)
      ? 'bg-emerald-600/90 cursor-default'
      : 'bg-indigo-600/80 hover:bg-indigo-600'
  } ${paying[b.id] ? 'opacity-60 cursor-wait' : ''}`}
  disabled={paying[b.id] || (b.creditPaidMonths||[]).includes(1)}
>
  { (b.creditPaidMonths||[]).includes(1) ? 'Pagado' : (paying[b.id] ? 'Pagando…' : 'Pagar') }
</button>

                                ) : (
                                  <>
                                    {/* NUEVO: pagar siguiente mes automáticamente */}
                                    <button
                                      onClick={()=>payCreditNext(b)}
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600"
                                    >
                                      Pagar
                                    </button>

                                    {/* Menú para elegir un mes específico */}
                                    <button
                                      onClick={()=>setPayOpenFor(payOpenFor===b.id?null:b.id)}
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20"
                                      title="Pagar un mes específico"
                                    >
                                      Meses <FiChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                    {payOpenFor===b.id && (
                                      <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-white/10 bg-[#15151c] shadow-lg p-1">
                                        {Array.from({length:mesesCount}).map((_,i)=>{
                                          const m=i+1;
                                          const paid=(b.creditPaidMonths||[]).includes(m);
                                          return (
                                            <button
                                              key={m}
                                              onClick={()=>!paid && payCreditMonth(b.id,m)}
                                              className={`w-full text-left px-2 py-1 rounded ${paid?'opacity-50 cursor-default bg-white/5':'hover:bg-white/10'}`}
                                            >
                                              Mes {m} {paid && <FiCheck className="inline ml-1" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </Td>
                      </tr>

                      {/* Editor inline – Ingreso */}
                      {editInc && (
                        <tr>
                          <td colSpan={6} className="px-3 py-3 bg-white/5 border-t border-white/10">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                                <h4 className="font-semibold mb-3 text-white/90">Editar ingresos · {formatDMY(b.date)}</h4>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-white/70">Otros</label>
                                    <CurrencyInput
                                      value={editData.inc.Otros ?? 0}
                                      onChange={(v)=>setEditData(d=>({...d, inc: { ...d.inc, Otros: v }}))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/70">Efectivo</label>
                                    <CurrencyInput
                                      value={editData.inc.Efectivo ?? 0}
                                      onChange={(v)=>setEditData(d=>({...d, inc: { ...d.inc, Efectivo: v }}))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/70">Tarjeta</label>
                                    <CurrencyInput
                                      value={editData.inc.Tarjeta ?? 0}
                                      onChange={(v)=>setEditData(d=>({...d, inc: { ...d.inc, Tarjeta: v }}))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/70">Transferencia</label>
                                    <CurrencyInput
                                      value={editData.inc.Transferencia ?? 0}
                                      onChange={(v)=>setEditData(d=>({...d, inc: { ...d.inc, Transferencia: v }}))}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                                <h4 className="font-semibold mb-3 text-white/90">Nota</h4>
                                <UIInput value={editData.nota} onChange={(v)=>setEditData(d=>({...d,nota:v}))} placeholder="Descripción / referencia"/>
                              </div>
                              <div className="md:col-span-2 flex gap-2">
                                <button onClick={saveIncomeEdit} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold">Guardar ingresos</button>
                                <button onClick={cancelEditors} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Cancelar</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Editor inline – Egreso */}
                      {editExp && (
                        <tr>
                          <td colSpan={6} className="px-3 py-3 bg-white/5 border-t border-white/10">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                                <h4 className="font-semibold mb-3 text-white/90">Editar egresos · {formatDMY(b.date)}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-white/70">Efectivo</label>
                                    <CurrencyInput value={editData.exp.Efectivo ?? 0} onChange={(v)=>setEditData(d=>({...d,exp:{...d.exp,Efectivo:v}}))}/>
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/70">Tarjeta</label>
                                    <CurrencyInput value={editData.exp.Tarjeta ?? 0} onChange={(v)=>setEditData(d=>({...d,exp:{...d.exp,Tarjeta:v}}))}/>
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/70">Transferencia</label>
                                    <CurrencyInput value={editData.exp.Transferencia ?? 0} onChange={(v)=>setEditData(d=>({...d,exp:{...d.exp,Transferencia:v}}))}/>
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/70">Crédito</label>
                                    <CurrencyInput value={editData.exp.Crédito ?? 0} onChange={(v)=>setEditData(d=>({...d,exp:{...d.exp,Crédito:v}}))}/>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                                <h4 className="font-semibold mb-3 text-white/90">Nota</h4>
                                <UIInput value={editData.nota} onChange={(v)=>setEditData(d=>({...d,nota:v}))} placeholder="Descripción / referencia"/>
                              </div>
                              <div className="md:col-span-2 flex gap-2">
                                <button onClick={saveExpenseEdit} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold">Guardar egresos</button>
                                <button onClick={cancelEditors} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Cancelar</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>

        </div>
      </main>
    </>
  );
}

/* ---------- Subcomponentes UI ---------- */
function Th({ children, w = '', className = '' }) {
  return <th className={`px-3 py-2 text-left font-semibold ${w} ${className}`}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
function CardStat({ label, value }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-white/10 bg-white/5 p-4 transition">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${value < 0 ? 'text-rose-300' : ''}`}>{mxn.format(value || 0)}</div>
    </motion.div>
  );
}
function TrafficPill({ icon, label, value, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-3 rounded-2xl bg-white/[0.07] border border-white/10 px-5 py-3 backdrop-blur shadow"
    >
      <div className="grid place-items-center h-8 w-8 rounded-xl bg-white/10 text-white">{icon}</div>
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-wide text-white/60">{label}</div>
        {loading
          ? <div className="h-5 w-16 rounded bg-white/10 animate-pulse" />
          : <div className="text-lg font-semibold">{Number(value||0).toLocaleString('es-MX')}</div>}
      </div>
    </motion.div>
  );
}

/* ---------- Scrollbars (compat) + Fix visual de <option> ---------- */
const extraStyles = `
#scrollbar-superior::-webkit-scrollbar{ height:6px; background:#0b0b10; border-radius:8px; }
#scrollbar-superior::-webkit-scrollbar-thumb{ background:rgba(120,120,130,0.38); border-radius:8px; border:1px solid rgba(229,231,235,0.2); }
#tabla-movimientos::-webkit-scrollbar{ height:6px; background:#0b0b10; border-radius:8px; }
#tabla-movimientos::-webkit-scrollbar-thumb{ background:rgba(120,120,130,0.38); border-radius:8px; border:1px solid rgba(229,231,235,0.2); }

/* Asegura que las opciones de los <select> sean legibles en sistemas con menú claro */
select option { color:#111 !important; background:#fff !important; }
`;
if (typeof document!=='undefined' && !document.getElementById('sa-dashboard-inline-styles')){
  const style=document.createElement('style'); style.id='sa-dashboard-inline-styles'; style.innerHTML=extraStyles; document.head.appendChild(style);
}
