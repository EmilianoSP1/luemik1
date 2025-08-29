// resources/js/Components/GlassSidebar.jsx
import React, { useState, useRef, useLayoutEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const sidebarVariants = {
  hidden:  { x: -28, opacity: 0, scale: 0.98 },
  visible: { x: 0,   opacity: 1, scale: 1 },
};

const listParent = {
  open:   { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
  closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const listItem = {
  open:   { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 380, damping: 24 } },
  closed: { opacity: 0, y: -6, filter: "blur(2px)", transition: { duration: 0.12 } },
};

export default function GlassSidebar({ open, setOpen, user = null, light = false }) {
  // Usuario global de Inertia si no vino por props
  const pageUser = usePage().props?.auth?.user ?? null;
  const u = user ?? pageUser;

  const shell = light
    ? "bg-white/80 text-black border-black/10"
    : "bg-black/70 text-white border-white/10";

  const close = () => setOpen(false);

  const Item = ({ href, children, method, as }) => (
    <Link
      href={href}
      method={method}
      as={as}
      className="text-left px-3 py-2 rounded hover:bg-white/10 transition"
      onClick={close}
    >
      {children}
    </Link>
  );

  // Estados de secciones
  const [catOpen, setCatOpen] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);

  // Sección plegable con hover y clic (animación suave con grid-rows)
  // --- Sustituye COMPLETO tu HoverSection por este ---
// --- Sustituye COMPLETO tu HoverSection por este ---
// --- Reemplaza COMPLETO tu HoverSection por este ---
const HoverSection = ({ label, isOpen, setIsOpen, children }) => {
  const innerRef = useRef(null);
  const [contentH, setContentH] = useState(0);

  // mide la altura real del contenido (para animar height con precisión)
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setContentH(el.scrollHeight || 0);
    measure();

    // opcional: re-medimos si cambia el tamaño interno
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, isOpen]);

  const toggle = (e) => {
    e.preventDefault();
    setIsOpen((v) => !v);
  };

  return (
    <div className="relative select-none">
      {/* Encabezado: SOLO abre/cierra con clic/tap */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] uppercase opacity-70 hover:opacity-100 transition"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span>{label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
        >
          <FiChevronDown size={16} />
        </motion.span>
      </button>

      {/* Contenedor animado por altura real (sin espacios al cerrar) */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? contentH : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
        className={isOpen ? "" : "pointer-events-none"} // desactiva clics cuando está cerrado
        aria-hidden={!isOpen}
      >
        <div ref={innerRef}>
          <motion.nav
            className="flex flex-col gap-1 pb-1"
            variants={listParent}
            initial={false}
            animate={isOpen ? "open" : "closed"}
          >
            {React.Children.map(children, (child) => (
              <motion.div variants={listItem}>{child}</motion.div>
            ))}
          </motion.nav>
        </div>
      </motion.div>
    </div>
  );
};






  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay por encima del sitio pero debajo del sidebar */}
          <motion.div
            className="fixed inset-0 bg-black/50"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ zIndex: 99998, pointerEvents: "auto" }}
          />

          {/* Sidebar arriba de todo, con padding top para bajar el contenido */}
          <motion.aside
            className={`fixed top-0 left-0 h-full w-[290px] backdrop-blur-xl border-r ${shell} px-4 pt-20 pb-4 glass-sidebar shadow-2xl overflow-y-auto pointer-events-auto`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            role="dialog"
            aria-modal="true"
            style={{ zIndex: 99999 }}
          >
            {/* Encabezado */}
            <div className="mb-6 px-1">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-semibold"
              >
                {u?.name ?? "Invitado"}
              </motion.div>
              <div className="mt-2 h-px bg-white/10" />
            </div>

            {/* Navegación principal */}
            <motion.nav
              className="flex flex-col gap-2 mb-2"
              variants={listParent}
              initial={false}
              animate="open"
            >
              <motion.div variants={listItem}><Item href="/">Inicio</Item></motion.div>
              <motion.div variants={listItem}><Item href="/pedidos">Pedidos</Item></motion.div>
              <motion.div variants={listItem}><Item href="/nosotros">Nosotros</Item></motion.div>
            </motion.nav>

            {/* CATÁLOGO (hover/clic con animación suave) */}
            <HoverSection label="CATÁLOGO" isOpen={catOpen} setIsOpen={setCatOpen}>
              <Item href="/catalogo/playeras">Playeras</Item>
              <Item href="/catalogo/shorts">Shorts</Item>
              <Item href="/catalogo/sudaderas">Sudaderas</Item>
              <Item href="/catalogo/accesorios">Accesorios</Item>
            </HoverSection>

            {/* CREAR (hover/clic con animación suave) */}
            <div className="mt-1" />
            <HoverSection label="CREAR" isOpen={crearOpen} setIsOpen={setCrearOpen}>
              <Item href="/crear">Playera 3D (Beta)</Item>
              <Item href="/crear2d">Playera 2D</Item>
            </HoverSection>

            <div className="mt-4 border-t border-white/10" />

            {u ? (
              <motion.nav
                className="mt-3 flex flex-col gap-1"
                variants={listParent}
                initial={false}
                animate="open"
              >
                <motion.div variants={listItem}><Item href="/profile">Perfil</Item></motion.div>

                {/* Logout robusto con CSRF (conservado) */}
                <motion.div variants={listItem}>
                  <form method="POST" action="/logout" className="mt-1 px-3 py-2">
                    <input
                      type="hidden"
                      name="_token"
                      value={document.querySelector('meta[name=csrf-token]')?.content || ''}
                    />
                    <button
                      type="submit"
                      className="text-left w-full rounded hover:bg-white/10 text-red-400"
                      onClick={() => setOpen(false)}
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </motion.div>
              </motion.nav>
            ) : (
              <motion.nav
                className="mt-3"
                variants={listParent}
                initial={false}
                animate="open"
              >
                <motion.div variants={listItem}><Item href="/login">Login</Item></motion.div>
              </motion.nav>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
