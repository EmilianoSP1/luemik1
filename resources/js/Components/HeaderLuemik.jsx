// resources/js/Components/HeaderLuemik.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiShoppingBag, FiSearch, FiMenu, FiX, FiBookmark } from 'react-icons/fi';

export default function HeaderLuemik({
  scrolled,
  cart,
  setShowCart,
  favoritos,
  setShowFavoritos,
  sidebarOpen,
  setSidebarOpen,
  searchOpen,
  setSearchOpen,
  handleOpenSearch,
  searchRef,
  user = null,
  light = false
}) {
  // Toma el usuario global de Inertia si no vino por props
  const pageUser = usePage().props?.auth?.user ?? null;
  const safeUser = user ?? pageUser;

  // ✅ Solo muestra "Panel Admin" si el correo es exactamente el del super admin
  const isSuperAdmin = useMemo(() => {
    if (!safeUser?.email) return false;
    return safeUser.email === 'emiadmindluis@luemik.com';
  }, [safeUser]);

  // href seguro para el dashboard de SA (usa Ziggy si está, si no fallback)
  const dashHref =
    (typeof route === 'function' && route('sa.dashboard')) ||
    '/sa/dashboard';

  const NAV_BASE_WIDTH = 300;
  const NAV_SEARCH_WIDTH = 410;

  const [showCrearMenu, setShowCrearMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCatalogMenu, setShowCatalogMenu] = useState(false);

  const searchContainerRef = useRef(null);
  const userMenuRef = useRef(null);
  const catalogMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (catalogMenuRef.current && !catalogMenuRef.current.contains(event.target)) {
        setShowCatalogMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowCatalogMenu(false);
        setShowCrearMenu(false);
        setSearchOpen(false);
      }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.id === 'btn-catalogo') {
        e.preventDefault();
        setShowCatalogMenu((v) => !v);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navBg = light ? "bg-white/90 border-black/10" : "bg-white/10 border-white/10";
  const textColor = light ? "text-black" : "text-white";
  const hoverColor = light ? "hover:text-[#3a29ff]" : "hover:text-white/80";
  const iconColor = light ? "#181824" : "#fff";
  const badgeBg = light ? "#3a29ff" : "#ff4c8b";
  const loginBtnBg = light ? "bg-[#f8f9fb] text-black" : "";

  // ——— ESPACIADO COMPACTO ———
  const navItem = `px-2 h-9 flex items-center gap-1 rounded-md ${hoverColor} transition`;
  const navBar  = `hidden md:flex items-center gap-3 ml-1 text-[1.08rem] font-medium ${textColor}`;

  // (compat) Aún disponible si lo usabas en otro lado
  const handleLogout = (e) => {
    e.preventDefault();
    router.post('/logout');
    setShowUserMenu(false);
  };

  return (
    <header
      className={`
        fixed top-0 left-0 w-full flex items-center justify-between px-8 pt-5 pb-1 z-[120]
        transition-all duration-300
        ${scrolled
          ? `backdrop-blur-md ${navBg} border-b shadow-md`
          : "bg-transparent border-transparent shadow-none"}
      `}
    >
      {/* LADO IZQUIERDO */}
      <div className="flex items-center gap-3">
        <button className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <FiMenu size={26} color={iconColor} />
        </button>

        <nav className={navBar}>
          <Link href="/" className={navItem}>Inicio</Link>
          <Link href="/contacto" className={navItem}>Contacto</Link>
          <Link href="/droop" className={navItem}>Droop</Link>

          {/* ✅ Panel Admin solo visible para el super admin */}
          {isSuperAdmin && (
            <Link
              href={dashHref}
              className={`${navItem} font-semibold`}
              title="Ir al panel de Super Admin"
              prefetch
            >
              Panel Admin
            </Link>
          )}

          {/* Catálogo (hover/click) */}
          <div
            className="relative"
            ref={catalogMenuRef}
            onMouseEnter={() => setShowCatalogMenu(true)}
            onMouseLeave={() => setShowCatalogMenu(false)}
          >
            <button
              id="btn-catalogo"
              type="button"
              className={navItem}
              aria-haspopup="true"
              aria-expanded={showCatalogMenu}
              onClick={() => setShowCatalogMenu((v) => !v)}
            >
              Catálogo
              <svg className="relative top-[1px]" width="15" height="15" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.293l3.71-3.06a.75.75 0 0 1 1.04 1.08l-4.25 3.5a.75.75 0 0 1-1.04 0l-4.25-3.5a.75.75 0 0 1 .02-1.06z" />
              </svg>
            </button>

            <AnimatePresence>
              {showCatalogMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className={`absolute left-0 top-full mt-1 w-48 rounded-xl shadow-lg border z-40 p-1 flex flex-col
                    ${light ? 'bg-white text-black border-black/10' : 'bg-black/95 text-white border-white/10'}
                  `}
                  role="menu"
                >
                  <Link
                    href="/catalogo/playeras"
                    prefetch
                    onClick={() => setShowCatalogMenu(false)}
                    className="block py-2 px-4 rounded hover:bg-white/10 text-left transition"
                    role="menuitem"
                    style={{ fontWeight: 500 }}
                  >
                    Playeras
                  </Link>
                  <Link
                    href="/catalogo/shorts"
                    prefetch
                    onClick={() => setShowCatalogMenu(false)}
                    className="block py-2 px-4 rounded hover:bg-white/10 text-left transition"
                    role="menuitem"
                    style={{ fontWeight: 500 }}
                  >
                    Shorts
                  </Link>
                  <Link
                    href="/catalogo/sudaderas"
                    prefetch
                    onClick={() => setShowCatalogMenu(false)}
                    className="block py-2 px-4 rounded hover:bg-white/10 text-left transition"
                    role="menuitem"
                    style={{ fontWeight: 500 }}
                  >
                    Sudaderas
                  </Link>
                  <Link
                    href="/catalogo/accesorios"
                    prefetch
                    onClick={() => setShowCatalogMenu(false)}
                    className="block py-2 px-4 rounded hover:bg-white/10 text-left transition"
                    role="menuitem"
                    style={{ fontWeight: 500 }}
                  >
                    Accesorios
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Crear por hover */}
          <div
            className="relative"
            onMouseEnter={() => setShowCrearMenu(true)}
            onMouseLeave={() => setShowCrearMenu(false)}
            style={{ minWidth: 70 }}
          >
            <button
              type="button"
              className={navItem}
              aria-haspopup="true"
              aria-expanded={showCrearMenu}
              tabIndex={0}
              style={{ fontWeight: 500, fontSize: "1.08rem", zIndex: 50, background: "transparent", border: "none" }}
              onClick={() => setShowCrearMenu((v) => !v)}
            >
              Crear
              <svg className="relative top-[1px]" width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.293l3.71-3.06a.75.75 0 0 1 1.04 1.08l-4.25 3.5a.75.75 0 0 1-1.04 0l-4.25-3.5a.75.75 0 0 1 .02-1.06z" />
              </svg>
            </button>
            <AnimatePresence>
              {showCrearMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.16 }}
                  className="absolute left-0 top-full mt-1 w-44 bg-black/95 rounded-xl shadow-lg border border-white/10 z-40 p-1 flex flex-col"
                  style={{ minWidth: 170 }}
                >
                  <Link href="/crear" className="block py-2 px-4 rounded hover:bg-white/10 text-left transition" onClick={() => setShowCrearMenu(false)} style={{ fontWeight: 500 }}>
                    Playera 3D (Beta)
                  </Link>
                  <Link href="/crear2d" className="block py-2 px-4 rounded hover:bg-white/10 text-left transition" onClick={() => setShowCrearMenu(false)} style={{ fontWeight: 500 }}>
                    Playera 2D
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* LOGO CENTRADO */}
      <div className="absolute left-1/2 top-0 flex flex-col items-center -translate-x-1/2 mt-0.5">
        <Link href="/" className="flex flex-col items-center cursor-pointer group select-none">
          <img src="/logo/logo_blanco.png" alt="Logo Luemik" className="h-11 w-12 mx-auto" />
        </Link>
        <span className={`text-2xl font-extrabold mt-0 tracking-wide group-hover:text-[#3a29ff] transition ${textColor}`}>LUEMIK</span>
      </div>

      {/* NAV DERECHO */}
      <motion.nav
        className={`glass-nav flex items-center gap-4 pl-0 pr-4 py-2 rounded-full shadow-lg backdrop-blur-md border ${navBg}`}
        style={{
          width: searchOpen ? NAV_SEARCH_WIDTH : "auto",
          minHeight: 46,
          justifyContent: 'flex-end',
          transition: 'width 0.34s cubic-bezier(.6,-0.03,.67,.98)'
        }}
        aria-label="Menu superior"
      >
        <button
          className={`icon-btn transition-all duration-200 ${searchOpen ? 'opacity-50 pointer-events-none' : ''}`}
          aria-label="Buscar"
          onClick={handleOpenSearch}
          tabIndex={searchOpen ? -1 : 0}
        >
          <FiSearch size={22} color={iconColor} />
        </button>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              ref={searchContainerRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 130, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.38, type: "spring", stiffness: 320, damping: 30 }}
              className="flex items-center ml-2"
              style={{
                overflow: "hidden",
                borderRadius: '2rem',
                background: light ? '#f8f9fb' : 'rgba(30,22,40,0.33)',
                boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
                border: '1.2px solid rgba(255,255,255,0.08)'
              }}
            >
              <input
                ref={searchRef}
                type="text"
                className="search-input px-3 py-2"
                placeholder="Buscar..."
                style={{
                  background: "transparent",
                  color: light ? "#222" : "#fff",
                  width: 130,
                  outline: "none",
                  border: "none"
                }}
              />
              <button className="close-btn mr-1" style={{ color: iconColor }} onClick={() => setSearchOpen(false)}>
                <FiX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {(safeUser && safeUser.id) ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex items-center gap-2 transition group"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              aria-controls="user-menu-dropdown"
              style={{ background: 'transparent', padding: 0, borderRadius: 0 }}
            >
              <FiUser size={22} color={iconColor} />
            </button>

            {showUserMenu && (
              <div
                id="user-menu-dropdown"
                role="menu"
                className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-50 flex flex-col
                  ${light ? 'bg-white text-black border-black/10' : 'bg-black/95 text-white border-white/10'}
                `}
                style={{ minWidth: 160 }}
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  className="block px-4 py-2 hover:bg-white/10 rounded-t transition"
                  onClick={() => setShowUserMenu(false)}
                >
                  Perfil
                </Link>

                {/* Logout a prueba de 419: FORM con _token */}
                <form method="POST" action="/logout" className="px-4 py-2 rounded-b">
                  <input
                    type="hidden"
                    name="_token"
                    value={document.querySelector('meta[name=csrf-token]')?.content || ''}
                  />
                  <button
                    type="submit"
                    role="menuitem"
                    className="w-full text-left text-red-400 hover:bg_white/10 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={`login-btn ${loginBtnBg}`}>Login</Link>
        )}

        <button className="icon-btn relative" aria-label="Bolsa" onClick={() => setShowCart(true)}>
          <FiShoppingBag size={22} color={iconColor} />
          {cart && cart.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                background: badgeBg,
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "999px",
                fontSize: "0.78rem",
                padding: "0.6px 6px",
                lineHeight: 1,
                boxShadow: "0 1px 5px #0004"
              }}
            >
              {cart.length}
            </span>
          )}
        </button>

        <button className="icon-btn" aria-label="Favoritos" onClick={() => setShowFavoritos(true)}>
          <FiBookmark size={22} color={iconColor} />
        </button>
      </motion.nav>
    </header>
  );
}
