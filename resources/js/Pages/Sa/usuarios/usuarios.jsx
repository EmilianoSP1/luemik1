import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HeaderAdmin from '../headeradmin.jsx';
import {
  FiSearch, FiRefreshCw, FiDownload, FiTrash2, FiUserCheck, FiUserX,
  FiUsers, FiFilter, FiAlertTriangle, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

// ============================
// Utils
// ============================
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const debounce = (fn, delay = 500) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

// ============================
// Badges
// ============================
function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-300 border border-rose-400/30">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Inactivo
    </span>
  );
}

// ============================
/* Simple modal confirm */
// ============================
function ConfirmModal({ open, title, message, confirmText = 'Confirmar', onConfirm, onClose, danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101018] text-white shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          {danger ? <FiAlertTriangle className="text-amber-400" /> : <FiFilter className="text-indigo-300" />}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="p-4 text-white/80 text-sm">{message}</div>
        <div className="p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10">Cancelar</button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded-lg border ${danger ? 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20' : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================
// Paginador
// ============================
function Paginator({ meta, onPage }) {
  if (!meta) return null;
  const { current_page, last_page } = meta;
  return (
    <div className="flex items-center justify-between text-sm text-white/70">
      <div>Página <span className="font-semibold text-white">{current_page}</span> de <span className="font-semibold text-white">{last_page}</span></div>
      <div className="flex items-center gap-2">
        <button
          disabled={current_page <= 1}
          onClick={() => onPage(current_page - 1)}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40"
        >
          <FiChevronLeft />
        </button>
        <button
          disabled={current_page >= last_page}
          onClick={() => onPage(current_page + 1)}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

// ============================
// Main
// ============================
export default function Usuarios() {
  const { props } = usePage();
  const apiBase = props?.api || '/sa/api/users';

  // Filtros/estado (rol y fechas eliminados)
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name'); // por defecto por nombre
  const [dir, setDir] = useState('asc');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Datos
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Selección / modales
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, action: null, payload: null, text: '', danger: false });

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (sort) p.set('sort', sort);
    if (dir) p.set('dir', dir);
    p.set('per_page', perPage);
    p.set('page', page);
    return p.toString();
  }, [q, status, sort, dir, perPage, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`${apiBase}?${queryString}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(json?.data || []);
      setMeta(json?.meta || null);
    } catch (e) {
      setErr('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [apiBase, queryString]);

  // debounce búsqueda
  const debounced = useRef(debounce((value) => {
    setPage(1);
    setQ(value);
  }, 500)).current;

  useEffect(() => { load(); }, [load]);

  const toggleAll = (checked) => {
    setSelected(checked ? rows.map(r => r.id) : []);
  };
  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const changeSort = (col) => {
    if (sort === col) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setDir('asc'); }
  };

  const postJSON = async (url, method = 'POST', body = {}) => {
    const res = await fetch(url, {
      method,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrf(),
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(body),
    });
    return res;
  };

  const doToggle = async (id) => {
    const res = await postJSON(`${apiBase}/${id}/toggle`, 'PUT');
    if (res.ok) await load();
  };

  const doDelete = async (id) => {
    const res = await postJSON(`${apiBase}/${id}`, 'DELETE');
    if (res.ok) {
      setSelected(s => s.filter(x => x !== id));
      await load();
    }
  };

  const doBulk = async (action) => {
    const res = await postJSON(`${apiBase}/bulk`, 'POST', { action, ids: selected });
    if (res.ok) {
      setSelected([]);
      await load();
    }
  };

  const exportCsv = (onlySelected = false) => {
    const s = new URLSearchParams(queryString);
    if (onlySelected && selected.length) s.set('ids', selected.join(','));
    window.open(`${apiBase}/export?${s.toString()}`, '_blank');
  };

  const anySelected = selected.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Head title="Usuarios" />
      <HeaderAdmin />

      <main className="mx-auto max-w-7xl px-3 md:px-6 py-6 md:py-8">
        {/* Top bar */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <FiUsers className="opacity-70" /> Usuarios
            </h1>
            <p className="text-white/60 text-sm">Gestión de cuentas registradas en Luemik.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10"
              title="Refrescar"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              <span>Refrescar</span>
            </button>
            <button
              onClick={() => exportCsv(false)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10"
              title="Exportar CSV"
            >
              <FiDownload /> <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Filtros (rol y fechas eliminados) */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
              <FiSearch className="text-white/60" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                onChange={(e) => debounced(e.target.value)}
                className="w-full bg-transparent py-2.5 outline-none placeholder:text-white/40"
              />
            </div>
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 outline-none"
            >
              <option value="">Estado (todos)</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="unverified">Sin verificar</option>
            </select>
          </div>
        </div>

        {/* Barra de acciones masivas */}
        {anySelected && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-sm text-white/70">{selected.length} seleccionado(s)</div>
            <div className="h-4 w-px bg-white/15" />
            <button onClick={() =>
              setConfirm({ open: true, action: 'activate', payload: null, text: `Activar ${selected.length} usuario(s)`, danger: false })
            } className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300">
              <FiUserCheck /> Activar
            </button>
            <button onClick={() =>
              setConfirm({ open: true, action: 'deactivate', payload: null, text: `Desactivar ${selected.length} usuario(s)`, danger: false })
            } className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300">
              <FiUserX /> Desactivar
            </button>
            <button onClick={() => exportCsv(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10">
              <FiDownload /> Exportar selección
            </button>
            <button onClick={() =>
              setConfirm({ open: true, action: 'delete', payload: null, text: `Eliminar ${selected.length} usuario(s)`, danger: true })
            } className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300">
              <FiTrash2 /> Eliminar
            </button>
          </div>
        )}

        {/* Tabla */}
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-white/60">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => toggleAll(e.target.checked)}
                      checked={rows.length > 0 && selected.length === rows.length}
                      className="accent-indigo-500"
                    />
                  </th>
                  {[
                    {key:'name',  label:'Nombre'},
                    {key:'email', label:'Correo'},
                  ].map(col => (
                    <th key={col.key} className="px-3 py-3 cursor-pointer select-none" onClick={() => changeSort(col.key)}>
                      <div className="inline-flex items-center gap-1">
                        <span>{col.label}</span>
                        {sort === col.key && <span className="text-white/70">{dir === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-12 text-center text-white/60">Sin resultados.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={5} className="px-3 py-12 text-center text-white/60">
                    <span className="inline-flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Cargando...</span>
                  </td></tr>
                )}
                {!loading && rows.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="accent-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-white">{u.name || '—'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-white/80">{u.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge active={u.active} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => doToggle(u.id)}
                          className={`px-2 py-1 rounded-lg border ${u.active ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'}`}
                          title={u.active ? 'Desactivar' : 'Activar'}
                        >
                          {u.active ? <FiUserX /> : <FiUserCheck />}
                        </button>
                        <button
                          onClick={() => setConfirm({ open: true, action: 'delete-one', payload: u.id, text: `Eliminar a ${u.name || u.email}`, danger: true })}
                          className="px-2 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                          title="Eliminar"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer tabla */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-white/10 bg-white/5 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Mostrar:</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Paginator meta={meta} onPage={(p) => setPage(p)} />
          </div>
        </div>

        {/* error */}
        {err && <div className="mt-3 text-sm text-rose-300">{err}</div>}
      </main>

      {/* Confirm modal */}
      <ConfirmModal
        open={confirm.open}
        title="Confirmación"
        message={confirm.text}
        danger={confirm.danger}
        confirmText="Sí, continuar"
        onClose={() => setConfirm({ open: false, action: null, payload: null, text: '', danger: false })}
        onConfirm={async () => {
          const a = confirm.action;
          const id = confirm.payload;
          setConfirm({ open: false, action: null, payload: null, text: '', danger: false });
          await sleep(50);
          if (a === 'delete-one' && id) await doDelete(id);
          if (a === 'delete') await doBulk('delete');
          if (a === 'activate') await doBulk('activate');
          if (a === 'deactivate') await doBulk('deactivate');
        }}
      />
    </div>
  );
}
