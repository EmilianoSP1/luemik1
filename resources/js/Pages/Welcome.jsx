// resources/js/Pages/Welcome.jsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import Aurora from '../Components/Aurora/Aurora';
import { FiX } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import axios from 'axios';

import '../Components/GlassNav.css';
import '../Components/GlassSidebar.css';
import '../Components/ShinyBarGlass.css';
import '../Components/BlurText.css';

import ShinyText from '../Components/ShinyText';
import CircularGallery from '../Components/CircularGallery';
import CatalogSection from '../Components/CatalogSection';
// import BlurText from '../Components/BlurText';
import FavoritosModal from '../Components/FavoritosModal';
import HeaderLuemik from '../Components/HeaderLuemik';
import TextScrollMarquee from '../Components/TextScrollMarquee';
//header
import GlassSidebar from '../Components/GlassSidebar';

export default function Welcome({ laravelVersion, phpVersion, user: userProp = { name: "Nombre Usuario" } }) {
  // ← toma el usuario global (Inertia share) o cae al prop que ya tenías
  const user = usePage().props?.auth?.user ?? userProp;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const searchRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);

  // Carrito
  const [cart, setCart] = useState([]); // [{nombre, talla, precio, precioNum, img, cantidad, id, product_id}]
  const [showCart, setShowCart] = useState(false);

  // Pending por item.id mientras sincroniza (para bloquear botones)
  const [pending, setPending] = useState(new Set());
  const setPendingFor = (id, on = true) =>
    setPending(p => {
      const s = new Set(p);
      on ? s.add(id) : s.delete(id);
      return s;
    });

  // Mapea items del backend
  const mapItems = (items) =>
    items.map(item => {
      const p = Number(item.unit_price ?? item.product?.precio ?? 0);
      return {
        nombre: item.product?.nombre || '',
        talla: item.size,
        precio: `$${p.toFixed(2)}`,
        precioNum: p,
        img: item.product?.img || '',
        cantidad: item.quantity,
        id: item.id,
        product_id: item.product_id
      };
    });

  // Cargar carrito del backend (también cuando cambia el usuario)
  useEffect(() => {
    axios.get('/cart')
      .then(res => { if (res.data?.items) setCart(mapItems(res.data.items)); })
      .catch(() => {});
  }, [user?.id]);

  // Agregar producto (UI optimista + abrir carrito al instante)
  const addToCart = async (producto, talla) => {
    setShowCart(true);

    try {
      await axios.get('/sanctum/csrf-cookie').catch(() => {});

      let idSeguro = producto?.id;
      if (!idSeguro) {
        const precioNum = Number(producto?.precioNum ?? producto?.precio ?? 0) || 0;
        const resEnsure = await axios.post('/api/products/ensure', {
          nombre: producto?.nombre ?? 'Producto sin nombre',
          img: producto?.img ?? null,
          precio: precioNum,
        });
        idSeguro = resEnsure?.data?.id;
      }
      if (!idSeguro) {
        alert('No se pudo obtener el ID del producto.');
        return;
      }

      if (user && user.id) {
        setCart(prev => {
          const i = prev.findIndex(it => it.product_id === idSeguro && it.talla === talla);
          if (i === -1) return prev;
          return prev.map((it, idx) => idx === i ? { ...it, cantidad: it.cantidad + 1 } : it);
        });

        await axios.post('/cart/add', { product_id: idSeguro, size: talla, quantity: 1 });
        const res = await axios.get('/cart');
        if (res.data?.items) setCart(mapItems(res.data.items));
      } else {
        setCart(prev => {
          const i = prev.findIndex(it => it.nombre === producto.nombre && it.talla === talla);
          if (i !== -1) {
            return prev.map((it, idx) => idx === i ? { ...it, cantidad: it.cantidad + 1 } : it);
          }
          const p = Number(producto?.precioNum ?? producto?.precio ?? 0) || 0;
          return [...prev, { ...producto, id: idSeguro, product_id: idSeguro, talla, cantidad: 1, precioNum: p, precio: `$${p.toFixed(2)}` }];
        });
      }
    } catch (e) {
      console.error('addToCart error:', e?.response?.status, e?.response?.data || e);
      alert(`No se pudo agregar al carrito.${e?.response?.status ? ' (HTTP ' + e.response.status + ')' : ''}`);
    }
  };

  // Cambiar cantidad (UI optimista + bloqueo por item)
  const changeQty = async (idx, delta) => {
    const item = cart[idx];
    const newQty = (item.cantidad ?? 1) + delta;

    if (!user || !user.id) {
      setCart(prev =>
        prev.flatMap((it, i) => {
          if (i !== idx) return [it];
          const q = (it.cantidad ?? 1) + delta;
          return q <= 0 ? [] : [{ ...it, cantidad: q }];
        })
      );
      return;
    }

    const prevQty = item.cantidad;
    const idKey = item.id;
    if (!idKey) return;

    setPendingFor(idKey, true);
    setCart(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: Math.max(newQty, 0) } : it));

    try {
      await axios.get('/sanctum/csrf-cookie').catch(() => {});
      if (newQty <= 0) {
        const res = await axios.post('/cart/remove', { item_id: item.id });
        if (res.data?.items) setCart(mapItems(res.data.items));
      } else {
        const res = await axios.patch(`/cart/items/${item.id}`, { quantity: newQty });
        if (res.data?.items) setCart(mapItems(res.data.items));
      }
    } catch (e) {
      setCart(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: prevQty } : it));
      console.error('changeQty error:', e);
    } finally {
      setPendingFor(idKey, false);
    }
  };

  // Eliminar producto
  const removeFromCart = async (index) => {
    const item = cart[index];

    if (user && user.id) {
      try {
        await axios.get('/sanctum/csrf-cookie').catch(() => {});
        const res = await axios.post('/cart/remove', { item_id: item.id });
        if (res.data?.items) setCart(mapItems(res.data.items));
      } catch (e) {
        console.error('remove item error:', e);
      }
    } else {
      setCart(prev => prev.filter((_, i) => i !== index));
    }
  };

  const closeCart = () => setShowCart(false);

  const getCartTotal = () => {
    return cart.reduce((acc, item) =>
      acc + Number(item.precioNum ?? Number(String(item.precio).replace('$', ''))) * item.cantidad, 0);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 200);
  };

  // SUBMENÚ PLAYERAS
  const handlePlayerasClick = () => setShowSubmenu((prev) => !prev);
  const handleSubmenuBlur = () => setTimeout(() => setShowSubmenu(false), 180);

  const sidebarVariants = { hidden: { x: '-100%', opacity: 0 }, visible: { x: 0, opacity: 1 } };

  // FAVORITOS
  const [favoritos, setFavoritos] = useState([]);
  const [showFavoritos, setShowFavoritos] = useState(false);

  const toggleFavorito = (producto) => {
    setFavoritos(prev => {
      const existe = prev.find(p => p.nombre === producto.nombre);
      if (existe) return prev.filter(p => p.nombre !== producto.nombre);
      return [...prev, producto];
    });
  };

  const isFavorito = (producto) => favoritos.some(p => p.nombre === producto.nombre);

  // ---- Variantes (se mantienen para hero/galería) ----
  const fadeUp = {
    hidden: { opacity: 0, y: 28, filter: 'blur(2px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: 'easeOut' } },
  };
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
  const viewportCfg = { once: true, amount: 0.25 };

  return (
    <>
      <Head title="Luemik | Urban Wear" />
      <div className="relative min-h-screen w-full bg-[#0c0a11] text-white overflow-hidden">
        {/* AURORA */}
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.4}
          amplitude={0.7}
          speed={0.2}
          style={{
            height: "950px",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />

        {/* HEADER */}
        <HeaderLuemik
          scrolled={scrolled}
          cart={cart}
          setShowCart={setShowCart}
          favoritos={favoritos}
          setShowFavoritos={setShowFavoritos}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          handleOpenSearch={handleOpenSearch}
          searchRef={searchRef}
          showSubmenu={showSubmenu}
          handlePlayerasClick={handlePlayerasClick}
          handleSubmenuBlur={handleSubmenuBlur}
          user={user}
        />

        {/* SIDEBAR GLASS */}
        {/* SIDEBAR GLASS */}
        <GlassSidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} light={false} />

        {/* =================== HERO (texto izquierda / espacio publicidad derecha) =================== */}
        <main className="relative z-20 max-w-7xl mx-auto px-6 pt-28 pb-10">
          <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportCfg}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          >
            {/* Texto a la izquierda */}
            <motion.div variants={fadeUp} className="text-left">
              <h1 className="text-[44px] leading-[1.05] md:text-7xl font-extrabold tracking-tight mb-6">
                Urban Vibes
              </h1>
              <p className="text-lg md:text-2xl opacity-90 mb-2">
                Street style & Urban clothing.
              </p>
              <p className="text-base md:text-xl opacity-70 mb-8">
                Moda joven. Viste diferente.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="#catalogo"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-bold bg-white text-black hover:opacity-90 transition focus:outline-none"
                >
                  Start Building
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold border border-white/30 hover:border-white/60 text-white/90 transition"
                >
                  Request a demo
                </Link>
              </div>
            </motion.div>

            {/* Lado derecho reservado */}
            <motion.div
              variants={fadeUp}
              className="w-full h-[240px] md:h-[320px] rounded-2xl border border-white/10 bg-white/0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.02) 100%)'
              }}
              aria-hidden="true"
              title="Espacio reservado para imagen/publicidad"
            >
              <div className="w-full h-full rounded-2xl border-2 border-dashed border-white/15"></div>
            </motion.div>
          </motion.section>
        </main>

        {/* =================== GALERÍA =================== */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportCfg}
          className="relative z-20"
          id="galeria"
        >
          <div
            style={{
              width: '100vw',
              minHeight: 340,
              height: 360,
              position: 'relative',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          >
            <CircularGallery
              bend={0}
              textColor="#fff"
              borderRadius={0.08}
              font="bold 30px Figtree"
              scrollSpeed={2}
              scrollEase={0.08}
            />
          </div>
        </motion.section>

        {/* =================== MARQUEE (más pequeño) =================== */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportCfg}
          className="w-full max-w-[1400px] mx-auto py-3 px-4"
        >
          <TextScrollMarquee
            baseVelocity={0.7}
            direction="left"
            className="font-semibold uppercase text-[12px] md:text-sm tracking-[0.12em] opacity-70"
          >
            — LUEMIK — ROPA PERSONALIZADA — ESTILO CALLEJERO — NUEVO DROP — ESCOGE TU ESTILO —
          </TextScrollMarquee>
        </motion.section>

        {/* =================== DIVISOR (LÍNEA ARRIBA + FADE BLANCO SUAVE) =================== */}
        <section className="relative z-20" aria-label="Divisor de sección productos">
          <div
            style={{
              width: '100vw',
              position: 'relative',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="h-[52px] md:h-[60px] rounded-[40px] overflow-hidden relative"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.12)', // línea superior
                background: '#0c0a11', // base oscura (ajústala si tu fondo es otro)
              }}
            >
              {/* Overlay: blanco que se deshace suavemente */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-6 h-[120px] opacity-90"
                style={{
                  background: `
                    radial-gradient(120% 72px at 50% 0,
                      rgba(255,255,255,0.22) 0%,
                      rgba(255,255,255,0.14) 28%,
                      rgba(255,255,255,0.08) 52%,
                      rgba(255,255,255,0.04) 72%,
                      rgba(255,255,255,0.02) 86%,
                      transparent 100%
                    )
                  `,
                  filter: 'blur(10px) saturate(1.05)',
                }}
              />

              {/* (Conservado) contenido previo oculto para no eliminar código */}
              <div className="sr-only">
                <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
                  <h2 className="text-lg md:text-xl font-bold">Catálogo</h2>
                  <Link href="#catalogo" className="underline underline-offset-4">Ver productos</Link>
                </div>
              </div>

              {/* (Conservado) hairline previo pero invisible */}
              <div className="opacity-0 pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-px rounded-full blur" />
            </div>
          </div>
        </section>

        {/* =================== CATÁLOGO (nuevo scroll effect) =================== */}
        <section id="catalogo" className="relative z-20">
          <AnimatedContainer delay={0.1} className="">
            <CatalogSection
              addToCart={addToCart}
              cart={cart}
              showCart={showCart}
              setShowCart={setShowCart}
              changeQty={changeQty}
              removeFromCart={removeFromCart}
              closeCart={closeCart}
              getCartTotal={getCartTotal}
              favoritos={favoritos}
              toggleFavorito={toggleFavorito}
              isFavorito={isFavorito}
            />
          </AnimatedContainer>
        </section>

        {/* MODAL FAVORITOS */}
        {showFavoritos && (
          <FavoritosModal
            favoritos={favoritos}
            onClose={() => setShowFavoritos(false)}
            addToCart={addToCart}
            toggleFavorito={toggleFavorito}
          />
        )}

        {/* SIDEBAR CARRITO */}
        <AnimatePresence>
          {showCart && (
            <>
              <motion.div
                key="cart-backdrop"
                className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={closeCart}
              />
              <motion.div
                key="cart-sidebar"
                className="fixed top-0 right-0 h-full z-[210] cart-sidebar-glass"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                style={{
                  width: '370px',
                  maxWidth: '96vw',
                  boxShadow: '-20px 0 48px 0 #0009',
                  borderTopLeftRadius: '32px',
                  borderBottomLeftRadius: '32px',
                  background: 'rgba(26,22,34,0.60)',
                  backdropFilter: 'blur(24px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                  border: '1.5px solid rgba(255,255,255,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <button
                  className="cart-close"
                  onClick={closeCart}
                  aria-label="Cerrar"
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: 18,
                    fontSize: 30,
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    zIndex: 5,
                    cursor: 'pointer',
                    opacity: 0.8,
                  }}
                >
                  <FiX />
                </button>
                <h3
                  style={{
                    margin: '32px 0 24px 36px',
                    fontWeight: 800,
                    fontSize: 26,
                    letterSpacing: 0.2,
                  }}
                >
                  Tu carrito
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 0 36px' }}>
                  {cart.length === 0 ? (
                    <div style={{ color: '#ccc', marginTop: 30, fontSize: 18 }}>
                      ¡El carrito está vacío!
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div
                        className="cart-item"
                        key={item.id ?? `${item.product_id}-${item.talla}-${idx}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}
                      >
                        <img src={item.img} alt={item.nombre} className="cart-img" style={{ width: 60, borderRadius: 10 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="cart-nombre" style={{ fontWeight: 700, fontSize: 17 }}>
                              {item.nombre}
                            </div>
                            <div className="cart-precio" style={{ marginLeft: 8, fontSize: '1.12rem' }}>
                              {item.precio}
                            </div>
                          </div>
                          <div className="cart-talla" style={{ fontSize: 15, opacity: 0.7 }}>
                            {item.talla}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', margin: '7px 0 3px 0', gap: 13 }}>
                            <button
                              disabled={!!item.id && pending.has(item.id)}
                              onClick={() => changeQty(idx, -1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.2rem',
                                padding: '2px 10px',
                                cursor: 'pointer',
                                opacity: (!!item.id && pending.has(item.id)) ? 0.35 : 0.65,
                                fontWeight: 'bold',
                              }}
                              aria-label="Menos"
                            >
                              -
                            </button>
                            <span style={{ minWidth: 18, textAlign: 'center', fontSize: '1.13rem', fontWeight: 700 }}>
                              {item.cantidad}
                            </span>
                            <button
                              disabled={!!item.id && pending.has(item.id)}
                              onClick={() => changeQty(idx, 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.2rem',
                                padding: '2px 10px',
                                cursor: 'pointer',
                                opacity: (!!item.id && pending.has(item.id)) ? 0.35 : 0.85,
                                fontWeight: 'bold',
                              }}
                              aria-label="Más"
                            >
                              +
                            </button>
                            <span style={{ color: '#b580f6', fontSize: '1.05rem' }}>
                              ${((item.precioNum ?? Number(String(item.precio).replace('$',''))) * item.cantidad).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          disabled={!!item.id && pending.has(item.id)}
                          onClick={() => removeFromCart(idx)}
                          style={{
                            color: '#f44',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.45rem',
                            cursor: (!!item.id && pending.has(item.id)) ? 'not-allowed' : 'pointer',
                            opacity: (!!item.id && pending.has(item.id)) ? 0.4 : 1
                          }}
                        >
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ borderTop: '1.2px solid rgba(255,255,255,0.08)', padding: '26px 36px 30px 36px' }}>
                  <div className="cart-total" style={{ fontSize: 21, fontWeight: 700, marginBottom: 12 }}>
                    Total: <span>${getCartTotal().toFixed(2)}</span>
                  </div>

                  <button
                    className="cart-checkout"
                    onClick={() => { setShowCart(false); router.visit('/checkout'); }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 13, background: '#6b4be2',
                      color: '#fff', fontWeight: 800, fontSize: 19, border: 'none',
                      cursor: 'pointer', boxShadow: '0 2px 12px 0 #8b7dff52'
                    }}
                  >
                    PAGAR
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <footer className="absolute bottom-0 left-0 w-full text-center py-4 text-sm text-white/40 z-20">
          Luemik © {new Date().getFullYear()} — Laravel v{laravelVersion} (PHP v{phpVersion})
        </footer>
      </div>
    </>
  );
}

/* =================== AnimatedContainer (scroll que enviaste) =================== */
function AnimatedContainer({ className = '', delay = 0.1, children }) {
  const prefersReduce = useReducedMotion();
  if (prefersReduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', y: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
