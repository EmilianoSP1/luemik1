import { Head, Link } from '@inertiajs/react';
import { FiXCircle } from 'react-icons/fi';

export default function Cancel() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white grid place-items-center overflow-hidden px-6">
      <Head title="Pago cancelado" />

      {/* Fondos urbanos */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full blur-[90px] opacity-25"
          style={{ background: 'radial-gradient(closest-side, #ef4444, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(closest-side, #7c3aed, transparent 65%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-soft-light"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 12px), repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 12px)',
          }}
        />
      </div>

      <div className="max-w-lg w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-8 text-center relative shadow-[0_20px_80px_-20px_rgba(0,0,0,.5)]">
        <FiXCircle className="mx-auto text-red-400 mb-3" size={48} />
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Pago cancelado</h1>
        <p className="text-white/80">Puedes intentar nuevamente cuando quieras.</p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/checkout"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            Volver a checkout
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-black font-bold transition"
          >
            Ir al inicio
          </Link>
        </div>

        <p className="text-[11px] leading-5 text-white/55 mt-5">
          Si el problema persiste, revisa tu conexión o intenta con otro método de pago.
        </p>
      </div>
    </div>
  );
}
