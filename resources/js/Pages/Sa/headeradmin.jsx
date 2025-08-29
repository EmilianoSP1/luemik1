// resources/js/Pages/Sa/headeradmin.jsx
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
  FiMenu, FiX, FiActivity, FiCreditCard, FiUsers, FiLogOut,
  FiDatabase, FiTruck, FiStar, FiPlus, FiFileText, FiExternalLink, FiHome
} from 'react-icons/fi';

export default function HeaderAdmin() {
  const { props } = usePage();
  // Compatibilidad: auth.user (Jetstream/Breeze) o user directo
  const user = props?.auth?.user || props?.user || null;
  const [open, setOpen] = useState(false);

  // Helper: usa nombre de ruta si Ziggy está disponible; si no, usa fallback
  const r = (name, fallback) => {
    try {
      // global route() provisto por Ziggy (si existe)
      if (typeof route === 'function') return route(name);
    } catch {}
    return fallback;
  };

  const firstName = useMemo(() => {
    if (!user?.name) return 'Usuario';
    return String(user.name).trim().split(' ')[0];
  }, [user]);

  const initials = useMemo(() => {
    if (!user?.name) return 'SA';
    return user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('') || 'SA';
  }, [user]);

  const close = () => setOpen(false);

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    // Breeze/Jetstream: logout POST /logout
    router.post('/logout');
  };

  // Navegación programática (usa el href que recibe)
  const go = (href, target) => {
    if (target === '_blank' || /^https?:\/\//i.test(href)) {
      window.open(href, target || '_self');
      return;
    }
    setOpen(false);
    router.visit(href, { preserveScroll: true });
  };

  // Item reutilizable (usa <button> para controlar onClick)
  const NavItem = ({ href, icon: Icon, children, target, rel }) => (
    <button
      type="button"
      onClick={() => go(href, target)}
      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
      rel={rel}
    >
      {Icon && <Icon className="text-xl shrink-0" />}
      <span>{children}</span>
    </button>
  );

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#0f0f15]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto h-14 px-3 sm:px-4 lg:px-6 flex items-center justify-between text-white">
          {/* Izquierda: botón menú */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={open}
              className="p-2 rounded-lg hover:bg:white/10 hover:bg-white/10 active:scale-95 transition"
            >
              <FiMenu className="text-2xl" />
            </button>
            <Link href={r('sa.dashboard','/sa/dashboard')} className="font-bold tracking-tight">
              Luemik · <span className="text-white/70">Súper Admin</span>
            </Link>
          </div>

          {/* Centro/Derecha: enlaces (desktop) + usuario */}
          <div className="hidden md:flex items-center gap-6">
            {/* 'Estadísticas' no se muestra en header visual */}
            <Link href="/sa/datos" className="text-sm text-white/80 hover:text-white transition">Datos</Link>

            {/* Proveedores -> ahora apunta al nuevo panel de "provedores" */}
            <Link
              href={r('sa.provedores','/sa/provedores')}
              className="text-sm text-white/80 hover:text-white transition"
            >
              Proveedores
            </Link>

            {/* Créditos → abrir en pestaña nueva */}
            <Link
              href="/sa/creditos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/80 hover:text-white transition"
            >
              Créditos
            </Link>

            <Link href="/sa/cotizacion" className="text-sm text-white/80 hover:text-white transition">Cotización</Link>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/80 hover:text-white transition"
            >
              Página
            </Link>

            <div className="h-5 w-px bg:white/15 bg-white/15" />

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center font-semibold">
                {initials}
              </div>
              <span className="text-sm text-white/80">Hola, <span className="font-medium text-white">{firstName}</span></span>
            </div>
          </div>

          {/* Móvil: avatar corto */}
          <div className="md:hidden flex items-center gap-2 text-white">
            <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center font-semibold">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* OVERLAY */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-[#111118] text-white border-r border-white/10
        transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Top */}
        <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{user?.name || 'Súper Admin'}</div>
              <div className="text-xs text-white/60">{user?.email || 'sa@luemik'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="p-2 rounded-lg hover:bg-white/10"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="px-3 py-3 space-y-1">
          <div className="px-2 pb-1 text-xs uppercase tracking-wider text-white/50">Principal</div>

          {/* Inicio (menú de 3 líneas) */}
          <NavItem href={r('sa.dashboard','/sa/dashboard')} icon={FiHome}>Inicio</NavItem>

          {/* Estadísticas SOLO en menú lateral */}
          <NavItem href="/sa/estadisticas" icon={FiActivity}>Estadísticas</NavItem>

          {/* ⚠️ ÚNICO ítem de Pagos en el menú lateral */}
          <NavItem href={r('sa.pagos','/sa/pagos')} icon={FiCreditCard}>Pagos</NavItem>

          {/* Usuarios → dirigimos a Pages/Sa/usuarios/usuarios.jsx */}
          <NavItem href="/sa/usuarios" icon={FiUsers}>Usuarios</NavItem>

          <NavItem
            href="/"
            icon={FiExternalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Página
          </NavItem>

          <div className="px-2 pt-4 pb-1 text-xs uppercase tracking-wider text-white/50">Gestión</div>
          <NavItem href="/sa/datos" icon={FiDatabase}>Datos</NavItem>

          {/* Proveedores -> ahora al nuevo panel de "provedores" */}
          <NavItem href={r('sa.provedores','/sa/provedores')} icon={FiTruck}>Proveedores</NavItem>

          {/* Créditos en pestaña nueva */}
          <NavItem href="/sa/creditos" icon={FiStar} target="_blank">Créditos</NavItem>

          <NavItem href="/sa/cotizacion" icon={FiFileText}>Cotización</NavItem>
          <NavItem href="/sa/agregar" icon={FiPlus}>Agregar</NavItem>

          <div className="pt-5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-left"
            >
              <FiLogOut className="text-xl" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
