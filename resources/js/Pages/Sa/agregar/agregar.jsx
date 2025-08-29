// resources/js/Pages/Sa/agregar/agregar.jsx
import { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import HeaderAdmin from '@/Pages/Sa/headeradmin.jsx';
import {
  FiSearch, FiPlus, FiTrash2, FiEdit2, FiPrinter, FiDownload, FiX, FiCheck
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const PROVEEDORES_FIJOS = [
  'MAMMON BLANKS',
  'Player Tlax',
  'Say México',
  'ESSENZA SHIRTS MX',
];

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const getCsrf = () => {
  const el = document.querySelector('meta[name="csrf-token"]');
  return el ? el.getAttribute('content') : '';
};

export default function AgregarPanel() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [proveedor, setProveedor] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    sku: '',
    nombre: '',
    categoria: '',
    proveedor: 'MAMMON BLANKS', // por defecto uno de los 4
    talla: '',
    color: '',
    stock: 0,
    precio_compra: '',
    precio_venta: '',
    ubicacion: '',
    notas: '',
  });
  const [errors, setErrors] = useState({});

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, q, categoria, proveedor });
      const res = await fetch(`/sa/api/inventory?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      setItems(json.data || []);
      setPagination({
        current_page: json.current_page ?? page,
        last_page: json.last_page ?? 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-line
  }, []);

  const resetForm = () => {
    setForm({
      sku: '',
      nombre: '',
      categoria: '',
      proveedor: 'MAMMON BLANKS',
      talla: '',
      color: '',
      stock: 0,
      precio_compra: '',
      precio_venta: '',
      ubicacion: '',
      notas: '',
    });
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      ...row,
      precio_compra: row.precio_compra ?? '',
      precio_venta: row.precio_venta ?? '',
    });
    setEditing(row);
    setErrors({});
    setModalOpen(true);
  };

  const save = async () => {
    setErrors({});
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/sa/api/inventory/${editing.id}` : '/sa/api/inventory';

    const res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrf(),
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        ...form,
        stock: Number(form.stock) || 0,
        precio_compra: form.precio_compra === '' ? null : Number(form.precio_compra),
        precio_venta: form.precio_venta === '' ? null : Number(form.precio_venta),
      }),
    });

    if (res.ok) {
      setModalOpen(false);
      await load(pagination.current_page);
    } else if (res.status === 422) {
      const j = await res.json();
      setErrors(j.errors || {});
    }
  };

  const remove = async (row) => {
    if (!confirm(`¿Eliminar "${row.nombre}"?`)) return;
    const res = await fetch(`/sa/api/inventory/${row.id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-CSRF-TOKEN': getCsrf(),
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    if (res.ok) load(pagination.current_page);
  };

  const handleSearch = async () => {
    await load(1);
  };

  const handleDownloadCSV = () => {
    window.open('/sa/api/inventory/export/csv', '_blank');
  };

  const handlePrint = () => {
    const w = window.open('', 'printWin');
    if (!w) return;

    const rows = items
      .map((r) => {
        const pc = r.precio_compra != null ? mxn.format(r.precio_compra) : '';
        const pv = r.precio_venta != null ? mxn.format(r.precio_venta) : '';
        return `
        <tr>
          <td>${r.sku ?? ''}</td>
          <td>${r.nombre ?? ''}</td>
          <td>${r.categoria ?? ''}</td>
          <td>${r.proveedor ?? ''}</td>
          <td>${r.talla ?? ''}</td>
          <td>${r.color ?? ''}</td>
          <td style="text-align:right">${r.stock ?? 0}</td>
          <td style="text-align:right">${pc}</td>
          <td style="text-align:right">${pv}</td>
          <td>${r.ubicacion ?? ''}</td>
        </tr>
      `;
      })
      .join('');

    w.document.write(`
      <html>
        <head>
          <title>Inventario - Luemik</title>
          <meta charset="utf-8" />
          <style>
            @media print { @page { size: A4; margin: 18mm; } }
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial; color: #0f172a; }
            .head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; border-bottom:2px solid #0f172a; padding-bottom:8px; }
            .brand { font-weight:800; font-size:20px; letter-spacing:.5px; }
            .muted { color:#475569; font-size:12px; }
            table { width:100%; border-collapse:collapse; }
            thead th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#334155; border-bottom:1px solid #cbd5e1; padding:8px 6px; }
            tbody td { font-size:13px; padding:8px 6px; border-bottom:1px solid #e2e8f0; }
            .foot { margin-top:14px; font-size:11px; color:#64748b; display:flex; justify-content:space-between; }
          </style>
        </head>
        <body>
          <div class="head">
            <div class="brand">LUEMIK — Inventario</div>
            <div class="muted">${new Date().toLocaleString('es-MX')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Nombre</th><th>Categoría</th><th>Proveedor</th>
                <th>Talla</th><th>Color</th><th>Stock</th><th>Precio compra</th><th>Precio venta</th><th>Ubicación</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="foot">
            <div>Generado por Luemik SA</div>
            <div>Página impresa — Uso interno</div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);

    w.document.close();
  };

  const categorias = useMemo(() => {
    const set = new Set(items.map((i) => i.categoria).filter(Boolean));
    return Array.from(set);
  }, [items]);

  // Combina proveedores fijos + los que haya en la data
  const proveedores = useMemo(() => {
    const set = new Set([
      ...PROVEEDORES_FIJOS,
      ...items.map((i) => i.proveedor).filter(Boolean),
    ]);
    return Array.from(set);
  }, [items]);

  const goPage = (n) => {
    if (n < 1 || n > (pagination.last_page || 1)) return;
    load(n);
  };

  const err = (k) => {
    const e = errors?.[k];
    if (!e) return null;
    return Array.isArray(e) ? e[0] : String(e);
  };

  const marginPreview = useMemo(() => {
    const pc = Number(form.precio_compra || 0);
    const pv = Number(form.precio_venta || 0);
    const diff = pv - pc;
    const pct = pv > 0 ? (diff / pv) * 100 : 0;
    return { diff, pct: Math.round(pct * 10) / 10 };
  }, [form.precio_compra, form.precio_venta]);

  return (
    <>
      <Head title="Inventario (Agregar)" />
      <HeaderAdmin />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Inventario</h1>
              <p className="text-white/70 text-sm">Control total de productos en local.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
              >
                <FiPrinter /> Imprimir
              </button>
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
              >
                <FiDownload /> Descargar
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition"
              >
                <FiPlus /> Agregar
              </button>
            </div>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 text-white/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar por nombre, SKU, color, talla…"
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/50 outline-none border border-white/10 focus:border-white/25"
              />
            </div>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white outline-none border border-white/10 focus:border-white/25"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white outline-none border border-white/10 focus:border-white/25"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
            >
              Aplicar filtros
            </button>
          </motion.div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-white/70 border-b border-white/10">
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Nombre</th>
                    <th className="text-left px-4 py-3">Categoría</th>
                    <th className="text-left px-4 py-3">Proveedor</th>
                    <th className="text-left px-4 py-3">Talla</th>
                    <th className="text-left px-4 py-3">Color</th>
                    <th className="text-right px-4 py-3">Stock</th>
                    <th className="text-right px-4 py-3">P. Compra</th>
                    <th className="text-right px-4 py-3">P. Venta</th>
                    <th className="text-left px-4 py-3">Ubicación</th>
                    <th className="text-right px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`sk-${i}`} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-3 w-16 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-40 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-24 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-28 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-12 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-12 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-3 w-10 bg-white/10 rounded ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-3 w-14 bg-white/10 rounded ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-3 w-14 bg-white/10 rounded ml-auto" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-24 bg-white/10 rounded" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-6 w-20 bg-white/10 rounded ml-auto" />
                        </td>
                      </tr>
                    ))}

                  {!loading &&
                    items.map((row) => (
                      <tr key={row.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-white/90">{row.sku || '—'}</td>
                        <td className="px-4 py-2 text-white">{row.nombre}</td>
                        <td className="px-4 py-2 text-white/90">
                          {row.categoria || '—'}
                        </td>
                        <td className="px-4 py-2 text-white/90">
                          {row.proveedor || '—'}
                        </td>
                        <td className="px-4 py-2 text-white/90">{row.talla || '—'}</td>
                        <td className="px-4 py-2 text-white/90">{row.color || '—'}</td>
                        <td className="px-4 py-2 text-right text-white">
                          {row.stock ?? 0}
                        </td>
                        <td className="px-4 py-2 text-right text-white/90">
                          {row.precio_compra != null
                            ? mxn.format(row.precio_compra)
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-white/90">
                          {row.precio_venta != null
                            ? mxn.format(row.precio_venta)
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-white/90">
                          {row.ubicacion || '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              className="p-2 rounded-lg bg-white/10 hover:bg-white/15"
                              onClick={() => openEdit(row)}
                              title="Editar"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300"
                              onClick={() => remove(row)}
                              title="Eliminar"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!loading && items.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-8 text-center text-white/60"
                      >
                        Sin resultados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 text-white/70">
              <div>
                Página <span className="text-white">{pagination.current_page}</span>{' '}
                de <span className="text-white">{pagination.last_page}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goPage(1)}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 hover:bg-white/15"
                  title="Primera"
                >
                  «
                </button>
                <button
                  onClick={() => goPage(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 hover:bg-white/15"
                >
                  Anterior
                </button>
                <button
                  onClick={() => goPage(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 hover:bg-white/15"
                >
                  Siguiente
                </button>
                <button
                  onClick={() => goPage(pagination.last_page)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 hover:bg-white/15"
                  title="Última"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Crear/Editar */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="w-full max-w-2xl rounded-2xl bg-[#0f0f15] border border-white/10 shadow-xl text-white overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold">
                    {editing ? 'Editar producto' : 'Agregar producto'}
                  </h3>
                  <p className="text-xs text-white/60">Inventario — LUEMIK</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  <FiX />
                </button>
              </div>

              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Columna izquierda */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/60">SKU</label>
                    <input
                      value={form.sku}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, sku: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                      placeholder="LMK-OVS-220-BLA"
                    />
                    {err('sku') && (
                      <p className="text-xs text-red-300 mt-1">{err('sku')}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-white/60">Nombre *</label>
                    <input
                      value={form.nombre}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, nombre: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                      placeholder="Playera Oversize 220g Blanca"
                    />
                    {err('nombre') && (
                      <p className="text-xs text-red-300 mt-1">
                        {err('nombre')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60">Categoría</label>
                      <input
                        value={form.categoria}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, categoria: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                        placeholder="Oversize / Premium / Polo / Sudadera"
                      />
                      {err('categoria') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('categoria')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-white/60">
                        Proveedor *
                      </label>
                      <select
                        required
                        value={form.proveedor}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, proveedor: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                      >
                        <option value="">Selecciona proveedor</option>
                        {PROVEEDORES_FIJOS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      {err('proveedor') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('proveedor')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60">Talla</label>
                      <input
                        value={form.talla}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, talla: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                        placeholder="S / M / L / XL"
                      />
                      {err('talla') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('talla')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-white/60">Color</label>
                      <input
                        value={form.color}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, color: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                        placeholder="Blanco / Negro ..."
                      />
                      {err('color') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('color')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-white/60">Stock</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, stock: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                        placeholder="0"
                      />
                      {err('stock') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('stock')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-white/60">P. compra</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.precio_compra}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            precio_compra: e.target.value,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                        placeholder="145"
                      />
                      {err('precio_compra') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('precio_compra')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-white/60">P. venta</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.precio_venta}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            precio_venta: e.target.value,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                        placeholder="199"
                      />
                      {err('precio_venta') && (
                        <p className="text-xs text-red-300 mt-1">
                          {err('precio_venta')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-white/70">
                    Margen estimado:{' '}
                    <span className="text-white">
                      {mxn.format(
                        Number(form.precio_venta || 0) -
                          Number(form.precio_compra || 0)
                      )}
                    </span>{' '}
                    ({marginPreview.pct}%)
                  </div>

                  <div>
                    <label className="text-xs text-white/60">Ubicación</label>
                    <input
                      value={form.ubicacion}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, ubicacion: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none"
                      placeholder="Almacén A — Estante 3"
                    />
                    {err('ubicacion') && (
                      <p className="text-xs text-red-300 mt-1">
                        {err('ubicacion')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-white/60">Notas</label>
                    <textarea
                      rows={4}
                      value={form.notas}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, notas: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-white/25 outline-none resize-y"
                      placeholder="Detalles adicionales del producto…"
                    />
                    {err('notas') && (
                      <p className="text-xs text-red-300 mt-1">{err('notas')}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600"
                >
                  <FiCheck /> Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
