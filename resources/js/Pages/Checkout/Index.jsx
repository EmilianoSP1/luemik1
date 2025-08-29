import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FiShield, FiLock, FiArrowLeft, FiCreditCard } from 'react-icons/fi';

export default function CheckoutIndex({ items = [], total_cents = 0, currency = 'MXN' }) {
  const [loading, setLoading] = useState(false);

  const payNow = async () => {
    try {
      setLoading(true);
      const res = await fetch('/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'No se pudo crear la sesión de pago');
      }
      const data = await res.json();
      window.location.href = data.url; // Redirige a Stripe Checkout
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const mxn = (cents) => (cents / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden">
      <Head title="Checkout" />

      {/* Fondos Urban (degradados suaves + grano sutil) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full blur-[90px] opacity-30"
             style={{ background: 'radial-gradient(closest-side, #7c3aed, transparent 65%)' }} />
        <div className="absolute -bottom-48 -left-40 h-[620px] w-[620px] rounded-full blur-[100px] opacity-30"
             style={{ background: 'radial-gradient(closest-side, #10b981, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.08] mix-blend-soft-light"
             style={{ backgroundImage:
               'repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 12px), repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 12px)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.visit('/')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <FiArrowLeft className="text-white/70" />
            <span className="text-sm">Seguir comprando</span>
          </button>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-white via-white to-emerald-300 bg-clip-text text-transparent">
            Revisar y pagar
          </span>
        </h1>

        {/* Layout dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de artículos */}
          <section className="lg:col-span-2 space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
              {items.length === 0 ? (
                <div className="p-8 text-white/70 text-center">
                  Tu carrito está vacío.
                </div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {items.map((it, idx) => (
                    <li key={idx} className="p-4 md:p-5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-4">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover ring-1 ring-white/15 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/10" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold leading-tight truncate">{it.name}</div>
                          <div className="text-sm text-white/60">Cantidad: {it.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{mxn(it.subtotal_cents)}</div>
                          <div className="text-xs text-white/60">{mxn(it.unit_price_cents)} c/u</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Nota/envío o cupones (visual) */}
            <div className="text-xs md:text-sm text-white/60 px-1">
              * Los métodos de pago se procesan de forma segura en Stripe. El envío y/o detalles extra se confirman después del pago.
            </div>
          </section>

          {/* Resumen / CTA */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-lg">Total</div>
                <div className="text-3xl font-extrabold tracking-tight">{mxn(total_cents)}</div>
              </div>

              <button
                onClick={payNow}
                disabled={items.length === 0 || loading}
                className="group w-full mb-3 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
                           bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-extrabold
                           shadow-[0_10px_30px_rgba(16,185,129,.35)] hover:shadow-[0_12px_36px_rgba(16,185,129,.5)]
                           hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-60 transition"
              >
                <FiCreditCard className="opacity-90 group-hover:translate-x-0.5 transition-transform" />
                {loading ? 'Redirigiendo…' : 'Pagar ahora (Stripe)'}
              </button>

              <button
                onClick={() => router.visit('/')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
                           bg-white/8 hover:bg-white/12 border border-white/10 text-white/90 font-semibold transition"
              >
                <FiArrowLeft className="opacity-80" />
                Seguir comprando
              </button>

              {/* Badges de seguridad */}
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/70">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <FiShield className="text-emerald-300" />
                  <span>3D Secure</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <FiLock className="text-emerald-300" />
                  <span>PCI compliant</span>
                </div>
              </div>

              <p className="text-[11px] leading-5 text-white/55 mt-4">
                El pago se procesa en Stripe. Nosotros no almacenamos datos de tu tarjeta.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
