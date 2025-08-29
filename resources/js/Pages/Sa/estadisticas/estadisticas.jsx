// resources/js/Pages/Sa/estadisticas/estadisticas.jsx
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis,
  AreaChart, Area
} from 'recharts';
import {
  FiTrendingUp, FiTrendingDown, FiRefreshCw, FiActivity,
  FiClock, FiRadio, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import HeaderAdmin from '../headeradmin.jsx';

// ======================
// Utilidades
// ======================
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const shortNum = (n) => {
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
};

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#10B981', '#F97316'];
const GLASS = 'backdrop-blur-xl bg-white/5 dark:bg-white/5 border border-white/10 shadow-lg';
const LIGHT_BG = 'bg-white/5';

// ======================
// Datos demo (fallback)
// ======================
const demoStats = (() => {
  const months = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'];
  const rand = (min, max) => Math.round(min + Math.random() * (max - min));
  const mensualIn = months.map(m => ({ month: m, total: rand(18000, 45000) }));
  const mensualOut = months.map(m => ({ month: m, total: rand(9000, 27000) }));
  const mensualUsers = months.map(m => ({ month: m, count: rand(25, 180) }));
  return {
    ingresos: {
      total: mensualIn.reduce((a,b) => a + b.total, 0),
      por_metodo: { Efectivo: 38, Tarjeta: 32, Transferencia: 24, Otros: 6 },
      mensual: mensualIn
    },
    egresos: {
      total: mensualOut.reduce((a,b) => a + b.total, 0),
      por_metodo: { Efectivo: 46, Tarjeta: 28, Transferencia: 20, Crédito: 6 },
      mensual: mensualOut
    },
    usuarios: {
      total: mensualUsers.reduce((a,b) => a + b.count, 0),
      mensual: mensualUsers
    },
    updated_at: new Date().toISOString()
  };
})();

// ======================
// Componentes UI
// ======================
function StatBadge({ icon: Icon, label, value, intent = 'neutral' }) {
  const color = intent === 'up'
    ? 'text-emerald-400'
    : intent === 'down'
      ? 'text-rose-400'
      : 'text-indigo-300';
  return (
    <div className={`flex items-center gap-2 text-sm ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="opacity-90">{label}</span>
      <strong className="font-semibold">{value}</strong>
    </div>
  );
}

function Card({ title, subtitle, right, className = '', children }) {
  return (
    <div className={`${GLASS} rounded-2xl p-4 md:p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm uppercase tracking-widest text-white/60">{title}</h3>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function DonutCard({ title, totalLabel = 'total', totalValue, dataObject }) {
  const data = useMemo(() => {
    if (!dataObject) return [];
    const entries = Object.entries(dataObject).filter(([k,v]) => v != null);
    const sum = entries.reduce((a, [,v]) => a + Number(v), 0) || 1;
    return entries.map(([name, value], i) => ({
      name,
      value: Number(value),
      pct: Number(((value / sum) * 100).toFixed(1)),
      color: COLORS[i % COLORS.length]
    }));
  }, [dataObject]);

  return (
    <Card title={title} right={<FiActivity className="text-white/40" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="h-48">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(v) => (typeof v === 'number' ? `${v}%` : v)} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <div className="mb-2">
            <div className="text-xs uppercase tracking-widest text-white/50">{totalLabel}</div>
            <div className="text-2xl font-bold">{shortNum(totalValue)}</div>
          </div>
          <ul className="space-y-1">
            {data.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-white/80">{d.name}</span>
                </div>
                <span className="font-semibold">{d.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function BarStackedCard({ title, data }) {
  return (
    <Card title={title} right={<FiTrendingUp className="text-white/40" />}>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,.6)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,.6)', fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'Usuarios') return [value, name];
                return [mxn.format(value), name];
              }}
              contentStyle={{ background: 'rgba(15,15,23,.9)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }}
              labelStyle={{ color: 'white' }}
            />
            <Legend formatter={(v) => <span className="text-white/80">{v}</span>} />
            <Bar dataKey="Ingresos" stackId="money" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="Egresos" stackId="money" fill={COLORS[3]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="Usuarios" fill={COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AreaCompareCard({ title, data }) {
  return (
    <Card title={title} right={<FiTrendingDown className="text-white/40" />}>
      <div className="h-72">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,.6)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,.6)', fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [mxn.format(value), name]}
              contentStyle={{ background: 'rgba(15,15,23,.9)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }}
              labelStyle={{ color: 'white' }}
            />
            <Legend formatter={(v) => <span className="text-white/80">{v}</span>} />
            <Area type="monotone" dataKey="Ingresos" stroke={COLORS[0]} fill="url(#gradIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="Egresos" stroke={COLORS[3]} fill="url(#gradOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ======================
// Página principal
// ======================
export default function Estadisticas() {
  const { props } = usePage();
  const apiUrl =
    props?.endpoints?.estadisticas ||
    props?.estadisticasApi ||
    '/sa/api/estadisticas';

  const initialStats = props?.stats && Object.keys(props.stats).length ? props.stats : demoStats;

  const [stats, setStats] = useState(initialStats);
  const [realtime, setRealtime] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [range, setRange] = useState('12m'); // '12m' | 'ytd' | '30d'
  const timerRef = useRef(null);
  const updatedAt = stats?.updated_at ? new Date(stats.updated_at) : new Date();

  // Live: Echo (si existe) + Polling
  useEffect(() => {
    let echoChannel = null;
    if (typeof window !== 'undefined' && window?.Echo) {
      echoChannel = window.Echo.channel('stats.updated');
      echoChannel.listen('.StatsUpdated', (payload) => {
        if (payload?.stats) setStats(payload.stats);
      });
    }

    const startPolling = () => {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(async () => {
        if (!realtime) return;
        try {
          const res = await fetch(`${apiUrl}?range=${range}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
          if (res.ok) {
            const data = await res.json();
            if (data?.stats) setStats(data.stats);
            setLastError(null);
          } else {
            setLastError('No se pudo actualizar (HTTP ' + res.status + ')');
          }
        } catch {
          setLastError('Sin conexión o API no disponible.');
        }
      }, 5000);
    };

    if (realtime) startPolling();

    return () => {
      clearInterval(timerRef.current);
      if (echoChannel) {
        try { window.Echo.leave('stats.updated'); } catch {}
      }
    };
  }, [realtime, apiUrl, range]);

  const fetchOnce = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}?range=${range}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (res.ok) {
        const data = await res.json();
        if (data?.stats) setStats(data.stats);
        setLastError(null);
      } else {
        setLastError('No se pudo actualizar (HTTP ' + res.status + ')');
      }
    } catch {
      setLastError('Sin conexión o API no disponible.');
    } finally {
      setLoading(false);
    }
  };

  const monthsFormat = (iso) => {
    const [y, m] = iso.split('-').map(Number);
    const date = new Date(y, (m - 1 || 0), 1);
    return date.toLocaleString('es-MX', { month: 'short' }).replace('.', '');
  };

  const barData = useMemo(() => {
    const inMap = (stats?.ingresos?.mensual || []).reduce((acc, it) => { acc[it.month] = it.total; return acc; }, {});
    const outMap = (stats?.egresos?.mensual || []).reduce((acc, it) => { acc[it.month] = it.total; return acc; }, {});
    const usrMap = (stats?.usuarios?.mensual || []).reduce((acc, it) => { acc[it.month] = it.count; return acc; }, {});
    const months = Array.from(new Set([...Object.keys(inMap), ...Object.keys(outMap), ...Object.keys(usrMap)])).sort();
    const trimmed = (range === '30d') ? months.slice(-2)
      : (range === 'ytd')
        ? months.filter(m => m.startsWith(String(new Date().getFullYear())))
        : months;
    return trimmed.map(m => ({
      label: monthsFormat(m),
      Ingresos: inMap[m] || 0,
      Egresos: outMap[m] || 0,
      Usuarios: usrMap[m] || 0
    }));
  }, [stats, range]);

  const areaData = useMemo(() => {
    return barData.map(it => ({
      label: it.label,
      Ingresos: it.Ingresos,
      Egresos: it.Egresos
    }));
  }, [barData]);

  const normalizeDonut = (obj) => {
    if (!obj) return null;
    const values = Object.values(obj).map(Number);
    const sum = values.reduce((a,b) => a + b, 0);
    if (!sum) return obj;
    if (sum > 95 && sum < 105) return obj; // ya está en %
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = Number(((Number(obj[k]) / sum) * 100).toFixed(1));
    }
    return out;
  };

  const ingresosDonut = normalizeDonut(stats?.ingresos?.por_metodo);
  const egresosDonut  = normalizeDonut(stats?.egresos?.por_metodo);

  const neto = (stats?.ingresos?.total || 0) - (stats?.egresos?.total || 0);
  const tendencia = neto >= 0 ? 'up' : 'down';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Head title="Estadísticas" />
      <HeaderAdmin />

      <main className="mx-auto max-w-7xl px-3 md:px-6 py-6 md:py-8">
        {/* Barra superior */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Estadísticas</h1>
            <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
              <FiClock className="opacity-70" />
              Última actualización: <span className="font-medium">{updatedAt.toLocaleString('es-MX')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`${GLASS} rounded-xl px-3 py-2 flex items-center gap-2`}>
              <FiRadio className={realtime ? 'text-emerald-400' : 'text-rose-400'} />
              <span className="text-sm">{realtime ? 'Tiempo real' : 'Pausa'}</span>
              <button
                onClick={() => setRealtime((v) => !v)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold border ${realtime ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/10'}`}
              >
                {realtime ? 'Desactivar' : 'Activar'}
              </button>
            </div>

            <div className={`${GLASS} rounded-xl px-3 py-2 flex items-center gap-2`}>
              <select
                className="bg-transparent outline-none text-sm"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="12m">Últimos 12 meses</option>
                <option value="ytd">Año en curso</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>

            <button
              onClick={fetchOnce}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10 ${LIGHT_BG} hover:bg-white/10 transition`}
              title="Actualizar"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              <span className="text-sm">{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card title="Ingresos" className="md:col-span-1">
            <div className="text-3xl font-bold">{mxn.format(stats?.ingresos?.total || 0)}</div>
            <div className="mt-3 flex gap-4">
              <StatBadge icon={FiCheckCircle} label="Neto" value={mxn.format(neto)} intent={tendencia === 'up' ? 'up' : 'down'} />
              <StatBadge icon={FiTrendingUp} label="Usuarios" value={shortNum(stats?.usuarios?.total || 0)} intent="neutral" />
            </div>
          </Card>
          <Card title="Egresos" className="md:col-span-1">
            <div className="text-3xl font-bold">{mxn.format(stats?.egresos?.total || 0)}</div>
            <div className="mt-3 flex gap-4">
              <StatBadge icon={FiXCircle} label="Balance" value={mxn.format((stats?.ingresos?.total || 0) - (stats?.egresos?.total || 0))} intent={tendencia === 'up' ? 'up' : 'down'} />
            </div>
          </Card>
          <Card title="Usuarios registrados" className="md:col-span-1">
            <div className="text-3xl font-bold">{shortNum(stats?.usuarios?.total || 0)}</div>
            <div className="mt-3 flex gap-4">
              <StatBadge icon={FiActivity} label="Mes actual" value={shortNum((stats?.usuarios?.mensual || []).slice(-1)[0]?.count || 0)} />
            </div>
          </Card>
          <Card title="Estado" className="md:col-span-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">Operando</span>
            </div>
            {lastError && <p className="mt-2 text-sm text-rose-400">{lastError}</p>}
            {!lastError && <p className="mt-2 text-sm text-white/60">Conexión establecida {realtime ? 'en tiempo real' : 'en pausa'}.</p>}
          </Card>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <DonutCard
              title="Ingresos por método"
              totalLabel="total"
              totalValue={stats?.ingresos?.total || 0}
              dataObject={ingresosDonut}
            />
            <DonutCard
              title="Egresos por método"
              totalLabel="total"
              totalValue={stats?.egresos?.total || 0}
              dataObject={egresosDonut}
            />
          </div>

          <BarStackedCard
            title="Dinámica del año (apilado)"
            data={barData}
          />

          <AreaCompareCard
            title="Comparativa mensual (Ingresos vs Egresos)"
            data={areaData}
          />
        </div>

        {!props?.stats && (
          <p className="mt-6 text-xs text-white/40">
            *Mostrando datos demo. Cuando envíes <code>props.stats</code> desde Laravel/Inertia o expongas <code>{apiUrl}</code>, se actualizará automáticamente.
          </p>
        )}
      </main>
    </div>
  );
}
