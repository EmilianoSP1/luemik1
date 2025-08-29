// resources/js/Pages/Sa/creditos/creditos.jsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import HeaderAdmin from '@/Pages/Sa/headeradmin.jsx';
import axios from 'axios';

import {
  FiSearch, FiFilter, FiRefreshCw, FiDownload, FiPrinter, FiPlus,
  FiChevronDown, FiChevronRight, FiCheckCircle, FiXCircle, FiClock,
  FiAlertTriangle, FiExternalLink, FiCalendar
} from 'react-icons/fi';

/** Formateadores */
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const dt  = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });
const pct = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 2 });

/** Badges por estado */
const stateBadge = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pendiente':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    case 'pagado':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    case 'cancelado':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    case 'vencido':
      return 'bg-red-500/15 text-red-300 border border-red-500/30';
    default:
      return 'bg-white/10 text-white/80 border border-white/20';
  }
};

/** Icono por estado */
const stateIcon = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pendiente': return <FiClock className="inline -mt-0.5" />;
    case 'pagado':    return <FiCheckCircle className="inline -mt-0.5" />;
    case 'cancelado': return <FiXCircle className="inline -mt-0.5" />;
    case 'vencido':   return <FiAlertTriangle className="inline -mt-0.5" />;
    default:          return null;
  }
};

export default function CreditosPage() {
  const { props } = usePage();
  const api = props?.api || '/api/sa/creditos';// puedes pasar api desde web.php si quieres

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [items, setItems]     = useState(() => Array.isArray(props?.initialData) ? props.initialData : []);
  const [q, setQ]             = useState('');
  const [status, setStatus]   = useState('todos');   // todos|pendiente|pagado|cancelado|vencido
  const [tipo, setTipo]       = useState('todos');   // todos|meses|contado
  const [ord, setOrd]         = useState({ key: 'created_at', dir: 'desc' }); // asc|desc
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [expanded, setExpanded] = useState(() => new Set());

  // CancelToken para axios
  const cancelRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      setError('');

      // Cancelar request anterior si existe
      if (cancelRef.current) {
        cancelRef.current.cancel('abort-prev');
      }
      cancelRef.current = axios.CancelToken.source();

      try {
        // Puedes ajustar los params si tu API soporta filtros del servidor
        const resp = await axios.get(api, {
          cancelToken: cancelRef.current.token,
          params: {
            q, status: status === 'todos' ? undefined : status,
            tipo: tipo === 'todos' ? undefined : tipo,
            // page, per_page: si tu API lo soporta
          },
        });

        if (!ignore) {
          const rows = Array.isArray(resp.data?.data) ? resp.data.data
                    : Array.isArray(resp.data) ? resp.data
                    : [];
          setItems(rows);
        }
      } catch (e) {
        if (!ignore && !axios.isCancel(e)) {
          setError(e?.response?.data?.message || e?.message || 'Error al cargar créditos');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => { ignore = true; };
  }, [api]); // carga inicial sobre api; (si quieres refetch al cambiar filtros, agrega deps)

  /** Filtro y ordenamiento en cliente (si tu API no los hace). */
  const filtered = useMemo(() => {
    let rows = [...items];

    // Texto (folio, cliente, notas)
    const text = (q || '').trim().toLowerCase();
    if (text) {
      rows = rows.filter(r => {
        const cliente = (r?.cliente?.nombre || r?.cliente_nombre || '').toLowerCase();
        const folio   = String(r?.folio || r?.id || '').toLowerCase();
        const notas   = (r?.notas || '').toLowerCase();
        return cliente.includes(text) || folio.includes(text) || notas.includes(text);
      });
    }

    // Status
    if (status !== 'todos') {
      rows = rows.filter(r => String(r?.estado || r?.status || '').toLowerCase() === status);
    }

    // Tipo (a meses vs contado)
    if (tipo !== 'todos') {
      rows = rows.filter(r => {
        const isMeses = Boolean(r?.es_meses || r?.a_meses || r?.plan?.length);
        return tipo === 'meses' ? isMeses : !isMeses;
      });
    }

    // Orden
    rows.sort((a, b) => {
      const dir = ord.dir === 'asc' ? 1 : -1;
      const va = getSortValue(a, ord.key);
      const vb = getSortValue(b, ord.key);
      if (va < vb) return -1 * dir;
      if (va > vb) return  1 * dir;
      return 0;
    });

    return rows;
  }, [items, q, status, tipo, ord]);

  /** Paginación local */
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  /** KPIs */
  const kpis = useMemo(() => {
    const sum = (arr, sel) =>
      arr.reduce((acc, r) => acc + (Number(sel(r)) || 0), 0);

    const cartera     = sum(filtered, r => r?.monto_total ?? r?.monto ?? 0);
    const porCobrar   = sum(filtered, r => r?.saldo ?? Math.max((r?.monto_total ?? 0) - (r?.pagado ?? 0), 0));
    const pagado      = sum(filtered, r => r?.pagado ?? 0);
    const vencidosCnt = filtered.filter(r => (r?.estado || '').toLowerCase() === 'vencido').length;

    // tasa promedio (simple) si viene en r.tasa (0.25 => 25%)
    const tasas = filtered.map(r => Number(r?.tasa)).filter(v => !isNaN(v) && isFinite(v));
    const tasaProm = tasas.length ? tasas.reduce((a, b) => a + b, 0) / tasas.length : 0;

    return { cartera, porCobrar, pagado, vencidosCnt, tasaProm };
  }, [filtered]);

  /** Helpers */
  function getSortValue(row, key) {
    switch (key) {
      case 'cliente':
        return (row?.cliente?.nombre || row?.cliente_nombre || '').toLowerCase();
      case 'monto':
        return Number(row?.monto_total ?? row?.monto ?? 0);
      case 'saldo':
        return Number(row?.saldo ?? Math.max((row?.monto_total ?? 0) - (row?.pagado ?? 0), 0));
      case 'estado':
        return (row?.estado || row?.status || '').toLowerCase();
      case 'vence':
        return new Date(row?.vence_at || row?.fecha_vencimiento || 0).getTime();
      case 'created_at':
      default:
        return new Date(row?.created_at || 0).getTime();
    }
  }

  function toggleSort(key) {
    setOrd(prev => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: 'asc' };
    });
  }

  function toggleExpand(id) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  function refresh() {
    // Si tu API acepta filtros por querystring, puedes hacer refetch aquí con esos params
    setLoading(true);
    setError('');
    axios.get(api, { params: { q, status, tipo } })
      .then(resp => {
        const rows = Array.isArray(resp.data?.data) ? resp.data.data
                  : Array.isArray(resp.data) ? resp.data
                  : [];
        setItems(rows);
      })
      .catch(e => setError(e?.response?.data?.message || e?.message || 'Error al recargar'))
      .finally(() => setLoading(false));
  }

  function exportCSV() {
    const cols = [
      'Folio', 'Cliente', 'Monto', 'Pagado', 'Saldo', 'Tasa', 'Plazo',
      'Vence', 'Estado', 'Creado'
    ];

    const lines = [
      cols.join(',')
    ];

    filtered.forEach(r => {
      const folio   = `"${(r?.folio ?? r?.id ?? '').toString().replace(/"/g, '""')}"`;
      const cliente = `"${((r?.cliente?.nombre || r?.cliente_nombre || '')).replace(/"/g, '""')}"`;
      const monto   = Number(r?.monto_total ?? r?.monto ?? 0).toFixed(2);
      const pagado  = Number(r?.pagado ?? 0).toFixed(2);
      const saldo   = Number(r?.saldo ?? Math.max((r?.monto_total ?? 0) - (r?.pagado ?? 0), 0)).toFixed(2);
      const tasa    = (Number(r?.tasa ?? 0) * 100).toFixed(2) + '%';
      const plazo   = (r?.plazo_meses ?? r?.plazo ?? r?.plan?.length ?? 0);
      const vence   = r?.vence_at || r?.fecha_vencimiento || '';
      const estado  = r?.estado || r?.status || '';
      const creado  = r?.created_at || '';

      lines.push([folio, cliente, monto, pagado, saldo, tasa, plazo, vence, estado, creado].join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `creditos_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPage() {
    window.print();
  }

  function goNuevo() {
    router.visit('/sa/creditos/nuevo');
  }

  /** Celda con badge de estado */
  const EstadoBadge = ({ value }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${stateBadge(value)}`}>
      {stateIcon(value)} <span className="capitalize">{value || 'N/D'}</span>
    </span>
  );

  /** Celda con tipo (meses/contado) */
  const TipoChip = ({ row }) => {
    const isMeses = Boolean(row?.es_meses || row?.a_meses || row?.plan?.length);
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border
        ${isMeses
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
          : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
        }`}>
        {isMeses ? 'A meses' : 'Contado'}
      </span>
    );
  };

  /** Detalle expandible: plan de pagos (si existe) */
  const PlanPagos = ({ row }) => {
    const plan = Array.isArray(row?.plan) ? row.plan : [];
    if (!plan.length) {
      return (
        <div className="px-4 pb-4 text-sm text-white/70">
          No hay calendario de pagos registrado para este crédito.
        </div>
      );
    }
    return (
      <div className="px-2 pb-4">
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur">
          <table className="min-w-full text-sm">
            <thead className="text-white/70">
              <tr className="[&>th]:px-3 [&>th]:py-2 border-b border-white/10">
                <th>#</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="text-white/90">
              {plan.map((p, idx) => {
                const est = p?.estado || p?.status || (p?.pagado ? 'pagado' : (p?.vencido ? 'vencido' : 'pendiente'));
                return (
                  <tr key={p?.id ?? idx} className="[&>td]:px-3 [&>td]:py-2 border-b border-white/5">
                    <td>{idx + 1}</td>
                    <td className="whitespace-nowrap">{p?.fecha ? dt.format(new Date(p.fecha)) : '—'}</td>
                    <td className="whitespace-nowrap">{mxn.format(Number(p?.monto ?? 0))}</td>
                    <td className="whitespace-nowrap">{mxn.format(Number(p?.interes ?? 0))}</td>
                    <td className="whitespace-nowrap">{mxn.format(Number(p?.capital ?? 0))}</td>
                    <td className="whitespace-nowrap">{mxn.format(Number(p?.saldo ?? 0))}</td>
                    <td><EstadoBadge value={est} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /** Tabla / Row */
  const Row = ({ row }) => {
    const id     = row?.id ?? row?.folio ?? Math.random().toString(36).slice(2);
    const saldo  = Number(row?.saldo ?? Math.max((row?.monto_total ?? 0) - (row?.pagado ?? 0), 0));
    const vence  = row?.vence_at || row?.fecha_vencimiento;
    const opened = expanded.has(id);

    return (
      <>
        <tr className="hover:bg-white/5 transition">
          <td className="px-3 py-3 text-white/60">
            <button
              className="p-1 rounded hover:bg-white/10"
              onClick={() => toggleExpand(id)}
              title={opened ? 'Ocultar detalle' : 'Ver detalle'}
            >
              {opened ? <FiChevronDown /> : <FiChevronRight />}
            </button>
          </td>
          <td className="px-3 py-3">
            <div className="font-medium text-white">{row?.folio ?? row?.id ?? '—'}</div>
            <div className="text-xs text-white/50">Creado: {row?.created_at ? dt.format(new Date(row.created_at)) : '—'}</div>
          </td>
          <td className="px-3 py-3">
            <div className="font-medium">{(row?.cliente?.nombre || row?.cliente_nombre || '—')}</div>
            {row?.cliente?.telefono && (
              <div className="text-xs text-white/50">{row.cliente.telefono}</div>
            )}
          </td>
          <td className="px-3 py-3 whitespace-nowrap">{mxn.format(Number(row?.monto_total ?? row?.monto ?? 0))}</td>
          <td className="px-3 py-3 whitespace-nowrap">{mxn.format(Number(row?.pagado ?? 0))}</td>
          <td className="px-3 py-3 whitespace-nowrap">{mxn.format(saldo)}</td>
          <td className="px-3 py-3 whitespace-nowrap">{pct.format(Number(row?.tasa ?? 0))}</td>
          <td className="px-3 py-3 whitespace-nowrap text-center">{row?.plazo_meses ?? row?.plazo ?? (row?.plan?.length ?? '—')}</td>
          <td className="px-3 py-3 whitespace-nowrap">{vence ? dt.format(new Date(vence)) : '—'}</td>
          <td className="px-3 py-3"><EstadoBadge value={row?.estado || row?.status} /></td>
          <td className="px-3 py-3">
            <div className="flex items-center gap-2">
              <TipoChip row={row} />
              {/* Detalle en nueva pestaña si tienes ruta de show */}
              {row?.id && (
                <a
                  href={`/sa/creditos/${row.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"
                  title="Abrir detalle en pestaña nueva"
                >
                  <FiExternalLink /> Ver
                </a>
              )}
            </div>
          </td>
        </tr>
        {opened && (
          <tr className="bg-white/5">
            <td colSpan={11} className="pt-1">
              <PlanPagos row={row} />
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <>
      <Head title="Créditos · Súper Admin" />
      <HeaderAdmin />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 text-white">
        {/* Título + acciones */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Créditos</h1>
            <p className="text-white/60 text-sm">Gestiona tu cartera: pendientes, pagados, cancelados y vencidos.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 transition"
              title="Exportar CSV"
            >
              <FiDownload /> CSV
            </button>
            <button
              onClick={printPage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 transition"
              title="Imprimir"
            >
              <FiPrinter /> Imprimir
            </button>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Cartera total" value={mxn.format(kpis.cartera)} />
          <KpiCard label="Por cobrar" value={mxn.format(kpis.porCobrar)} />
          <KpiCard label="Pagado" value={mxn.format(kpis.pagado)} />
          <KpiCard label="Vencidos" value={String(kpis.vencidosCnt)} tone="danger" />
        </section>

        {/* Barra de filtros */}
        <section className="mb-4">
          <div className="rounded-2xl bg-[#0f0f15]/80 backdrop-blur border border-white/10 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-2.5 text-white/50" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por folio, cliente, notas…"
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/[0.08] border border-white/10 outline-none placeholder:text-white/40 focus:ring-2 ring-cyan-500/30"
                />
              </div>

              <div className="flex gap-2">
                <Dropdown
                  label="Estado"
                  icon={<FiFilter />}
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'pendiente', label: 'Pendientes' },
                    { value: 'pagado', label: 'Pagados' },
                    { value: 'cancelado', label: 'Cancelados' },
                    { value: 'vencido', label: 'Vencidos' },
                  ]}
                />
                <Dropdown
                  label="Tipo"
                  icon={<FiFilter />}
                  value={tipo}
                  onChange={setTipo}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'meses', label: 'A meses' },
                    { value: 'contado', label: 'Contado' },
                  ]}
                />
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 transition"
                  title="Actualizar"
                >
                  <FiRefreshCw /> Actualizar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabla */}
        <section className="rounded-2xl bg-[#0f0f15]/80 backdrop-blur border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-white/70 [&>th]:px-3 [&>th]:py-3 border-b border-white/10">
                  <th className="w-10"></th>
                  <Th label="Folio" onClick={() => toggleSort('created_at')} active={ord.key === 'created_at'} dir={ord.dir} />
                  <Th label="Cliente" onClick={() => toggleSort('cliente')} active={ord.key === 'cliente'} dir={ord.dir} />
                  <Th label="Monto" onClick={() => toggleSort('monto')} active={ord.key === 'monto'} dir={ord.dir} className="text-right" />
                  <Th label="Pagado" className="text-right" />
                  <Th label="Saldo" onClick={() => toggleSort('saldo')} active={ord.key === 'saldo'} dir={ord.dir} className="text-right" />
                  <Th label="Tasa" />
                  <Th label="Plazo" />
                  <Th label="Vence" onClick={() => toggleSort('vence')} active={ord.key === 'vence'} dir={ord.dir} />
                  <Th label="Estado" onClick={() => toggleSort('estado')} active={ord.key === 'estado'} dir={ord.dir} />
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading && (
                  <tr>
                    <td colSpan={11} className="p-6">
                      <SkeletonRows />
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={11} className="p-6 text-rose-300">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-6 text-white/60">
                      Sin resultados con los filtros actuales.
                    </td>
                  </tr>
                )}
                {!loading && !error && pageRows.map(row => (
                  <Row key={row?.id ?? row?.folio} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-t border-white/10 bg-white/5">
            <div className="text-sm text-white/60">
              Mostrando <span className="text-white">{pageRows.length}</span> de <span className="text-white">{total}</span> créditos
            </div>
            <div className="flex items-center gap-2">
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-sm outline-none"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / página</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40"
                >
                  Anterior
                </button>
                <div className="text-sm text-white/80">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Ayuda / notas */}
        <section className="mt-6 text-xs text-white/50 flex items-center gap-2">
          <FiCalendar />
          Tip: usa los filtros para ver “A meses” y revisar el calendario de pagos expandiendo cada fila.
        </section>
      </main>
    </>
  );
}

/** ---------- Subcomponentes UI ---------- */

function KpiCard({ label, value, tone }) {
  const toneCls = tone === 'danger'
    ? 'from-red-500/10 to-red-500/0 border-red-500/30'
    : 'from-cyan-500/10 to-cyan-500/0 border-cyan-500/30';

  return (
    <div className={`rounded-2xl border ${toneCls} bg-gradient-to-br p-4 backdrop-blur`}>
      <div className="text-white/60 text-sm">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Dropdown({ label, icon, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white/[0.08] border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm outline-none hover:bg-white/10"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute left-3 top-2.5 text-white/60">{icon}</div>
      <div className="pointer-events-none absolute right-2 top-3 text-white/60">
        <FiChevronDown />
      </div>
    </div>
  );
}

function Th({ label, onClick, active, dir, className = '' }) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none ${className}`}
      title={onClick ? 'Ordenar' : undefined}
    >
      <div className="inline-flex items-center gap-1">
        <span>{label}</span>
        {active && (
          <span className="text-xs text-white/50">{dir === 'asc' ? '▲' : '▼'}</span>
        )}
      </div>
    </th>
  );
}

function SkeletonRows() {
  const Row = () => (
    <div className="h-10 rounded bg-white/10 animate-pulse" />
  );
  return (
    <div className="space-y-2">
      <Row /><Row /><Row /><Row /><Row />
    </div>
  );
}
