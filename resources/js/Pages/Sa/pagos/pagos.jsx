// resources/js/Pages/Sa/pagos/pagos.jsx
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPlus, FiChevronsRight, FiX, FiTrash2 } from 'react-icons/fi';
import HeaderAdmin from '@/Pages/Sa/headeradmin.jsx';

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function Pagos() {
  const { props } = usePage();
  const { totals, externos, empleados, movs, motivos, methodsIngreso, methodsEgreso, filters } = props;
  const [openExtern, setOpenExtern] = useState(false);

  const r = (name, params, fallback) => {
    try { if (typeof route === 'function') return route(name, params); } catch {}
    return fallback;
  };

  const wanted = ['Efectivo','Transferencia','Tarjeta'];
  const ingBy  = totals?.ingByMethod || {};
  const egBy   = totals?.egByMethod  || {};

  const otrosIngreso = useMemo(() => Object.keys(ingBy)
    .filter(k => !wanted.includes(k) && k !== 'Crédito' && k !== 'Externo')
    .reduce((a,k)=>a + (parseFloat(ingBy[k])||0), 0), [ingBy]);

  const otrosEgreso = useMemo(() => Object.keys(egBy)
    .filter(k => !wanted.includes(k) && k !== 'Crédito' && k !== 'Externo')
    .reduce((a,k)=>a + (parseFloat(egBy[k])||0), 0), [egBy]);

  const netByMethod = useMemo(() => {
    const obj = {};
    for (const m of wanted) {
      const ing = parseFloat(ingBy?.[m] ?? 0) || 0;
      const eg  = parseFloat(egBy?.[m]  ?? 0) || 0;
      obj[m] = +(ing - eg).toFixed(2);
    }
    obj['Otros'] = +((otrosIngreso || 0) - (otrosEgreso || 0)).toFixed(2);
    return obj;
  }, [ingBy, egBy, otrosIngreso, otrosEgreso]);

  const netoTotal = useMemo(() => {
    const ing = parseFloat(totals?.ingresos ?? 0) || 0;
    const eg  = parseFloat(totals?.egresos ?? 0) || 0;
    return +(ing - eg).toFixed(2);
  }, [totals]);

  // ===== Formularios =====
  const ingForm = useForm({
    date: new Date().toISOString().slice(0,10),
    type: 'ingreso',
    amount: '',
    concept: '',
    motivo: 'DTF',
    motivo_extra: '',
    method: 'Efectivo',
  });

  const egrForm = useForm({
    date: new Date().toISOString().slice(0,10),
    type: 'egreso',
    amount: '',
    concept: '',
    motivo: 'Material',
    motivo_extra: '',
    method: 'Efectivo',
  });

  const submitForm = (form) => {
    const url = r('sa.pagos.store', undefined, '/sa/pagos');
    router.post(url, form.data, {
      preserveScroll: true,
      onSuccess: () => {
        form.reset('amount','concept','motivo_extra');
        router.reload({ only: ['externos','movs','totals'] });
        if (form.data.method === 'Externo') setOpenExtern(true);
      }
    });
  };

  // ===== Cargar más =====
  const buildUrl = (limit) => {
    const base = r('sa.pagos', undefined, '/sa/pagos');
    const qs = new URLSearchParams();
    if (filters?.start) qs.set('start', filters.start);
    if (filters?.end)   qs.set('end', filters.end);
    if (limit)          qs.set('limit', String(limit));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };

  const loadMore = (extra = 200) => {
    const current = Number(new URLSearchParams(window.location.search).get('limit') || 200);
    const next = current + extra;
    router.visit(buildUrl(next), { preserveScroll: true, preserveState: true, replace: true });
  };

  // ===== BORRAR (forzado a URL con id) =====
// Forzar URL con id y usar method spoofing
const destroyMovement = (id) => {
  if (!id) return;
  const url = `/sa/pagos/${encodeURIComponent(id)}/delete`;
  router.post(url, {}, {
    preserveScroll: true,
    onSuccess: () => router.reload({ only: ['externos','movs','totals'] }),
  });
};

  // -------- UI helpers --------
  const Tag = ({children}) => (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/60">
      {children}
    </span>
  );

  const Card = ({children, className=''}) => (
    <div className={`rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-4 ${className}`}>
      {children}
    </div>
  );

  const Stat = ({icon:Icon, label, value}) => (
    <Card>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-zinc-400">{label}</div>
          <div className="text-lg font-semibold">{mxn.format(value || 0)}</div>
        </div>
      </div>
    </Card>
  );

  const Pill = ({title, amount}) => (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-sm bg-black/30">
      <div className="text-[11px] text-zinc-400 mb-0.5">{title}</div>
      <div className="font-semibold">{mxn.format(amount || 0)}</div>
    </div>
  );

  return (
    <>
      <Head title="Pagos" />
      <HeaderAdmin />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Panel de Pagos</h1>
            <p className="text-sm text-zinc-400">
              Rango: {filters?.start} → {filters?.end}
            </p>
          </div>

          <button
            type="button"
            onClick={()=>setOpenExtern(v=>!v)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2 text-sm hover:bg-zinc-800/60"
            title="Ver movimientos Externo"
          >
            <FiChevronsRight />
            Externo
          </button>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Stat icon={FiTrendingUp} label="Ingresos" value={totals?.ingresos || 0} />
          <Stat icon={FiTrendingDown} label="Egresos" value={totals?.egresos || 0} />
          <Stat icon={FiDollarSign} label="Neto" value={netoTotal} />
        </div>

        {/* Resumen por método */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Ingresos (neto)</h2>
              <div className="text-sm text-zinc-300">Total: <b>{mxn.format(netoTotal)}</b></div>
            </div>
            <div className="text-xs text-zinc-400 mb-4">
              Ingresos – Egresos por método (Efectivo, Transferencia, Tarjeta). “Crédito” excluido.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {wanted.map(m => <Pill key={m} title={m.toUpperCase()} amount={netByMethod[m] || 0} />)}
              <Pill title="OTROS" amount={netByMethod['Otros'] || 0} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Egresos</h2>
              <div className="text-sm text-zinc-300">Total: <b>{mxn.format(totals?.egresos || 0)}</b></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {wanted.map(m => <Pill key={m} title={m.toUpperCase()} amount={parseFloat(egBy?.[m] ?? 0)} />)}
              <Pill title="OTROS" amount={otrosEgreso} />
            </div>
          </Card>
        </div>

        {/* Formularios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INGRESO */}
          <Card>
            <h2 className="font-semibold mb-4">Agregar Ingreso</h2>
            <form
              onSubmit={(e)=>{ e.preventDefault(); submitForm(ingForm); }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              autoComplete="off"
            >
              <div>
                <label htmlFor="ing-date" className="block text-xs text-zinc-300 mb-1">Fecha</label>
                <input id="ing-date" name="date" type="date"
                  value={ingForm.data.date}
                  onChange={e=>ingForm.setData('date', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="ing-amount" className="block text-xs text-zinc-300 mb-1">Monto a ingresar (MXN)</label>
                <input id="ing-amount" name="amount" type="number" step="0.01" min="0.01" inputMode="decimal"
                  value={ingForm.data.amount}
                  onChange={e=>ingForm.setData('amount', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                  autoComplete="off"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="ing-concept" className="block text-xs text-zinc-300 mb-1">Concepto</label>
                <input id="ing-concept" name="concept" type="text"
                  value={ingForm.data.concept}
                  onChange={e=>ingForm.setData('concept', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                  autoComplete="off"
                  placeholder="Ej. Venta playera oversize"
                />
              </div>

              <div>
                <label htmlFor="ing-motivo" className="block text-xs text-zinc-300 mb-1">Motivo</label>
                <select id="ing-motivo" name="motivo"
                  value={ingForm.data.motivo}
                  onChange={e=>ingForm.setData('motivo', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                >
                  {motivos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="ing-method" className="block text-xs text-zinc-300 mb-1">Forma de ingreso</label>
                <select id="ing-method" name="method"
                  value={ingForm.data.method}
                  onChange={e=>ingForm.setData('method', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                >
                  {methodsIngreso.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {ingForm.data.motivo === 'Otro' && (
                <div className="sm:col-span-2">
                  <label htmlFor="ing-motivo-extra" className="block text-xs text-zinc-300 mb-1">Describe el motivo (Otro)</label>
                  <input id="ing-motivo-extra" name="motivo_extra" type="text"
                    value={ingForm.data.motivo_extra}
                    onChange={e=>ingForm.setData('motivo_extra', e.target.value)}
                    className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                    autoComplete="off"
                  />
                </div>
              )}

              {ingForm.data.method === 'Externo' && (
                <div className="text-xs text-amber-400 sm:col-span-2 -mt-2">
                  * No se sumará a Ingresos. Se listará en el panel “Externo”.
                </div>
              )}

              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium">
                  <FiPlus /> Guardar ingreso
                </button>
              </div>
            </form>
          </Card>

          {/* EGRESO */}
          <Card>
            <h2 className="font-semibold mb-4">Agregar Egreso</h2>
            <form
              onSubmit={(e)=>{ e.preventDefault(); submitForm(egrForm); }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              autoComplete="off"
            >
              <div>
                <label htmlFor="egr-date" className="block text-xs text-zinc-300 mb-1">Fecha</label>
                <input id="egr-date" name="date" type="date"
                  value={egrForm.data.date}
                  onChange={e=>egrForm.setData('date', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="egr-amount" className="block text-xs text-zinc-300 mb-1">Monto a descontar (MXN)</label>
                <input id="egr-amount" name="amount" type="number" step="0.01" min="0.01" inputMode="decimal"
                  value={egrForm.data.amount}
                  onChange={e=>egrForm.setData('amount', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                  autoComplete="off"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="egr-concept" className="block text-xs text-zinc-300 mb-1">Concepto</label>
                <input id="egr-concept" name="concept" type="text"
                  value={egrForm.data.concept}
                  onChange={e=>egrForm.setData('concept', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                  autoComplete="off"
                  placeholder="Ej. Compra de material"
                />
              </div>

              <div>
                <label htmlFor="egr-motivo" className="block text-xs text-zinc-300 mb-1">Motivo</label>
                <select id="egr-motivo" name="motivo"
                  value={egrForm.data.motivo}
                  onChange={e=>egrForm.setData('motivo', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                >
                  {motivos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="egr-method" className="block text-xs text-zinc-300 mb-1">Forma de descuento</label>
                <select id="egr-method" name="method"
                  value={egrForm.data.method}
                  onChange={e=>egrForm.setData('method', e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                >
                  {methodsEgreso.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {egrForm.data.motivo === 'Otro' && (
                <div className="sm:col-span-2">
                  <label htmlFor="egr-motivo-extra" className="block text-xs text-zinc-300 mb-1">Describe el motivo (Otro)</label>
                  <input id="egr-motivo-extra" name="motivo_extra" type="text"
                    value={egrForm.data.motivo_extra}
                    onChange={e=>egrForm.setData('motivo_extra', e.target.value)}
                    className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-sm text-zinc-100"
                    autoComplete="off"
                  />
                </div>
              )}

              {egrForm.data.method === 'Externo' && (
                <div className="text-xs text-amber-400 sm:col-span-2 -mt-2">
                  * No se sumará a Egresos. Se listará en el panel “Externo”.
                </div>
              )}

              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-medium">
                  <FiPlus /> Guardar egreso
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Movimientos de Empleado</h3>
              <Tag>{empleados?.length || 0} items</Tag>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-400">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Monto</th>
                    <th className="py-2 pr-3">Método</th>
                    <th className="py-2 pr-3">Concepto</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados?.map(m => (
                    <tr key={m.id} className="border-t border-white/5">
                      <td className="py-2 pr-3">{m.date}</td>
                      <td className="py-2 pr-3 capitalize">{m.type}</td>
                      <td className="py-2 pr-3">{mxn.format(m.amount)}</td>
                      <td className="py-2 pr-3">{m.method}</td>
                      <td className="py-2 pr-3">{m.concept}</td>
                    </tr>
                  ))}
                  {!empleados?.length && (
                    <tr><td className="py-6 text-zinc-500" colSpan={5}>Sin movimientos de Empleado en el rango.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Últimos movimientos</h3>
              <Tag>{movs?.length || 0} items</Tag>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-400">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Monto</th>
                    <th className="py-2 pr-3">Método</th>
                    <th className="py-2 pr-3">Motivo</th>
                    <th className="py-2 pr-3">Concepto</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {movs?.map(m => (
                    <tr key={m.id} className="border-t border-white/5">
                      <td className="py-2 pr-3">{m.date}</td>
                      <td className="py-2 pr-3 capitalize">{m.type}</td>
                      <td className="py-2 pr-3">{mxn.format(m.amount)}</td>
                      <td className="py-2 pr-3">{m.method}{m.is_external ? ' (Externo)' : ''}</td>
                      <td className="py-2 pr-3">{m.motivo}{m.motivo === 'Otro' && m.motivo_extra ? `: ${m.motivo_extra}` : ''}</td>
                      <td className="py-2 pr-3">{m.concept}</td>
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          onClick={() => destroyMovement(m.id)}
                          className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300"
                          title="Eliminar"
                        >
                          <FiTrash2 /> borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!movs?.length && (
                    <tr><td className="py-6 text-zinc-500" colSpan={7}>Sin movimientos aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={()=>loadMore(200)}
                className="text-sm rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10"
                title="Traer más movimientos"
              >
                Cargar más
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Overlay para cerrar el panel Externo */}
      {openExtern && (
        <div
          onClick={()=>setOpenExtern(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Panel lateral: Externo */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950/95 border-l border-white/10 transition-transform duration-300 z-50 ${openExtern ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h3 className="font-semibold">Movimientos Externo</h3>
          <button onClick={()=>setOpenExtern(false)} className="p-2 rounded-lg hover:bg-white/5" aria-label="Cerrar panel"><FiX /></button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
          <div className="text-sm text-zinc-400 mb-3">
            Todo lo marcado como <b>Externo</b> no afecta Ingresos/Egresos; se lista aquí.
          </div>
          <div className="space-y-3">
            {externos?.map(m => (
              <div key={m.id} className="rounded-xl border border-white/10 p-3 bg-black/30">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-400">{m.date} • <span className="capitalize">{m.type}</span></div>
                  <div className="font-semibold">{mxn.format(m.amount)}</div>
                </div>
                <div className="text-sm">{m.concept}</div>
                <div className="text-xs text-zinc-400 mb-2">Motivo: {m.motivo}{m.motivo === 'Otro' && m.motivo_extra ? `: ${m.motivo_extra}` : ''}</div>

                <button
                  type="button"
                  onClick={() => destroyMovement(m.id)}
                  className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 text-sm"
                  title="Eliminar"
                >
                  <FiTrash2 /> borrar
                </button>
              </div>
            ))}
            {!externos?.length && (
              <div className="text-sm text-zinc-500">Sin movimientos Externo en el rango.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
