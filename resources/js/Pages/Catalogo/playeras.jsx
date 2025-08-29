// resources/js/Pages/Catalogo/playeras.jsx
import React, { useEffect, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import HeaderLuemik from "../../Components/HeaderLuemik";
import GlassSidebar from "../../Components/GlassSidebar";
import { FiX, FiHeart, FiChevronDown } from "react-icons/fi";
import { createPortal } from "react-dom";
import axios from "axios";

export default function PlayerasCatalogo({ user = null }) {
  // --- Estados Header ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  // Carrito / Favoritos
  const [cart, setCart] = useState([]); // [{nombre,talla,precio,precioNum,img,cantidad,id,product_id}]
  const [showCart, setShowCart] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [showFavoritos, setShowFavoritos] = useState(false);

  // Bloqueo por item/req
  const [pending, setPending] = useState(new Set());
  const setPendingFor = (id, on = true) =>
    setPending((p) => {
      const s = new Set(p);
      on ? s.add(id) : s.delete(id);
      return s;
    });

  const handleOpenSearch = () => setSearchOpen((v) => !v);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Triptych (conservado) ---
  const [hovered, setHovered] = useState(null);
const IMAGENES = [
  { src: "/img/catalogo/playeras/01.jpg", titulo: "Básicas",    subtitulo: "Algodón premium", href: "/catalogo/basicas" },
  { src: "/img/catalogo/playeras/02.jpg", titulo: "Oversize",   subtitulo: "Diseños únicos",  href: "/catalogo/oversize" },
  { src: "/img/catalogo/playeras/03.jpg", titulo: "Turtle Neck",subtitulo: "Secado rápido",   href: "/catalogo/turtle-neck" },
  { src: "/img/catalogo/playeras/04.jpg", titulo: "Acid Wash",  subtitulo: "Acabado vintage", href: "/catalogo/acid-wash" },
];


  /* ===================== LÓGICA DE CARRITO (igual a Welcome) ===================== */
  const mapItems = (items) =>
    items.map((item) => {
      const p = Number(item.unit_price ?? item.product?.precio ?? 0);
      return {
        nombre: item.product?.nombre || "",
        talla: item.size,
        precio: `$${p.toFixed(2)}`,
        precioNum: p,
        img: item.product?.img || "",
        cantidad: item.quantity,
        id: item.id,
        product_id: item.product_id,
      };
    });

  useEffect(() => {
    axios
      .get("/cart")
      .then((res) => {
        if (res.data?.items) setCart(mapItems(res.data.items));
      })
      .catch(() => {});
  }, [user?.id]);

  const addToCart = async (producto, talla = "M") => {
    setShowCart(true);
    try {
      await axios.get("/sanctum/csrf-cookie").catch(() => {});
      let idSeguro = producto?.id;

      if (!idSeguro) {
        const precioNum = Number(producto?.precioNum ?? producto?.precio ?? 0) || 0;
        const resEnsure = await axios.post("/api/products/ensure", {
          nombre: producto?.nombre ?? "Producto sin nombre",
          img: producto?.img ?? null,
          precio: precioNum,
        });
        idSeguro = resEnsure?.data?.id;
      }
      if (!idSeguro) {
        alert("No se pudo obtener el ID del producto.");
        return;
      }

      if (user && user.id) {
        setCart((prev) => {
          const i = prev.findIndex((it) => it.product_id === idSeguro && it.talla === talla);
          if (i === -1) return prev;
          return prev.map((it, idx) => (idx === i ? { ...it, cantidad: it.cantidad + 1 } : it));
        });

        await axios.post("/cart/add", { product_id: idSeguro, size: talla, quantity: 1 });
        const res = await axios.get("/cart");
        if (res.data?.items) setCart(mapItems(res.data.items));
      } else {
        setCart((prev) => {
          const i = prev.findIndex((it) => it.nombre === producto.nombre && it.talla === talla);
          if (i !== -1) return prev.map((it, idx) => (idx === i ? { ...it, cantidad: it.cantidad + 1 } : it));
          const p = Number(producto?.precioNum ?? producto?.precio ?? 0) || 0;
          return [
            ...prev,
            { ...producto, id: idSeguro, product_id: idSeguro, talla, cantidad: 1, precioNum: p, precio: `$${p.toFixed(2)}` },
          ];
        });
      }
    } catch (e) {
      console.error("addToCart error:", e?.response?.status, e?.response?.data || e);
      alert(`No se pudo agregar al carrito.${e?.response?.status ? " (HTTP " + e.response.status + ")" : ""}`);
    }
  };

  const changeQty = async (idx, delta) => {
    const item = cart[idx];
    const newQty = (item.cantidad ?? 1) + delta;

    if (!user || !user.id) {
      setCart((prev) =>
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
    setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, cantidad: Math.max(newQty, 0) } : it)));

    try {
      await axios.get("/sanctum/csrf-cookie").catch(() => {});
      if (newQty <= 0) {
        const res = await axios.post("/cart/remove", { item_id: item.id });
        if (res.data?.items) setCart(mapItems(res.data.items));
      } else {
        const res = await axios.patch(`/cart/items/${item.id}`, { quantity: newQty });
        if (res.data?.items) setCart(mapItems(res.data.items));
      }
    } catch (e) {
      setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, cantidad: prevQty } : it)));
      console.error("changeQty error:", e);
    } finally {
      setPendingFor(idKey, false);
    }
  };

  const removeFromCart = async (index) => {
    const item = cart[index];
    if (user && user.id) {
      try {
        await axios.get("/sanctum/csrf-cookie").catch(() => {});
        const res = await axios.post("/cart/remove", { item_id: item.id });
        if (res.data?.items) setCart(mapItems(res.data.items));
      } catch (e) {
        console.error("remove item error:", e);
      }
    } else {
      setCart((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const closeCart = () => setShowCart(false);
  const getCartTotal = () =>
    cart.reduce((acc, item) => acc + Number(item.precioNum ?? Number(String(item.precio).replace("$", ""))) * item.cantidad, 0);

  // Favoritos
  const toggleFavorito = (producto) => {
    setFavoritos((prev) => {
      const existe = prev.find((p) => p.nombre === producto.nombre);
      if (existe) return prev.filter((p) => p.nombre !== producto.nombre);
      return [...prev, producto];
    });
  };
  const isFavorito = (producto) => favoritos.some((p) => p.nombre === producto.nombre);

  /* ===================== PRODUCTOS (28 items) ===================== */
  const PRODUCTS = [
    { key: "fight", nombre: "Fight", img: "/img/catalogo/playeras/cards/fight.png", precioNum: 199, tags: ["urbanos", "mas-vendidos", "gym"] },
    { key: "blessing", nombre: "Blessing", img: "/img/catalogo/playeras/cards/blessing.png", precioNum: 199, tags: ["artistas", "pareja"] },
    { key: "angel-tears", nombre: "Angel Tears", img: "/img/catalogo/playeras/cards/angel-tears.png", precioNum: 199, tags: ["anime", "japon"] },
    { key: "rebellion", nombre: "Rebellion", img: "/img/catalogo/playeras/cards/rebellion.png", precioNum: 199, tags: ["urbanos"] },
    { key: "neon-skull", nombre: "Neon Skull", img: "/img/catalogo/playeras/cards/neon-skull.png", precioNum: 199, tags: ["videojuegos", "urbanos"] },
    { key: "seraph", nombre: "Seraph", img: "/img/catalogo/playeras/cards/seraph.png", precioNum: 199, tags: ["artistas", "anime"] },
    { key: "chaos-script", nombre: "Chaos Script", img: "/img/catalogo/playeras/cards/chaos-script.png", precioNum: 199, tags: ["urbanos"] },
    { key: "retro-wave", nombre: "Retro Wave", img: "/img/catalogo/playeras/cards/retro-wave.png", precioNum: 199, tags: ["peliculas", "videojuegos"] },
    { key: "oni-mask", nombre: "Oni Mask", img: "/img/catalogo/playeras/cards/oni-mask.png", precioNum: 199, tags: ["japon", "anime"] },
    { key: "white-tiger", nombre: "White Tiger", img: "/img/catalogo/playeras/cards/white-tiger.png", precioNum: 199, tags: ["japon", "gym"] },
    { key: "dragon", nombre: "Dragon", img: "/img/catalogo/playeras/cards/dragon.png", precioNum: 199, tags: ["anime", "japon"] },
    { key: "phoenix", nombre: "Phoenix", img: "/img/catalogo/playeras/cards/phoenix.png", precioNum: 199, tags: ["anime", "artistas"] },
    { key: "cyber-angel", nombre: "Cyber Angel", img: "/img/catalogo/playeras/cards/cyber-angel.png", precioNum: 199, tags: ["videojuegos", "anime"] },
    { key: "raven", nombre: "Raven", img: "/img/catalogo/playeras/cards/raven.png", precioNum: 199, tags: ["urbanos"] },
    { key: "samurai", nombre: "Samurai", img: "/img/catalogo/playeras/cards/samurai.png", precioNum: 199, tags: ["japon", "anime"] },
    { key: "lotus", nombre: "Lotus", img: "/img/catalogo/playeras/cards/lotus.png", precioNum: 199, tags: ["japon"] },
    { key: "lightning", nombre: "Lightning", img: "/img/catalogo/playeras/cards/lightning.png", precioNum: 199, tags: ["videojuegos", "formula"] },
    { key: "eclipse", nombre: "Eclipse", img: "/img/catalogo/playeras/cards/eclipse.png", precioNum: 199, tags: ["peliculas"] },
    { key: "vortex", nombre: "Vortex", img: "/img/catalogo/playeras/cards/vortex.png", precioNum: 199, tags: ["motos", "videojuegos"] },
    { key: "mirage", nombre: "Mirage", img: "/img/catalogo/playeras/cards/mirage.png", precioNum: 199, tags: ["peliculas"] },
    { key: "venom", nombre: "Venom", img: "/img/catalogo/playeras/cards/venom.png", precioNum: 199, tags: ["peliculas", "futbolistas"] },
    { key: "toxic", nombre: "Toxic", img: "/img/catalogo/playeras/cards/toxic.png", precioNum: 199, tags: ["urbanos"] },
    { key: "graffiti", nombre: "Graffiti", img: "/img/catalogo/playeras/cards/graffiti.png", precioNum: 199, tags: ["urbanos", "mas-vendidos"] },
    { key: "static", nombre: "Static", img: "/img/catalogo/playeras/cards/static.png", precioNum: 199, tags: ["urbanos"] },
    { key: "oracle", nombre: "Oracle", img: "/img/catalogo/playeras/cards/oracle.png", precioNum: 199, tags: ["artistas", "nba"] },
    { key: "storm", nombre: "Storm", img: "/img/catalogo/playeras/cards/storm.png", precioNum: 199, tags: ["carros", "nba"] },
    { key: "nocturne", nombre: "Nocturne", img: "/img/catalogo/playeras/cards/nocturne.png", precioNum: 199, tags: ["pareja"] },
    { key: "cipher", nombre: "Cipher", img: "/img/catalogo/playeras/cards/cipher.png", precioNum: 199, tags: ["videojuegos"] },
  ].map((p) => ({ ...p, precio: `$${p.precioNum}`, id: null }));

  // Tallas
  const SIZES = ["XS", "S", "M", "L", "XL"];
  const [selectedSize, setSelectedSize] = useState({}); // { [key]: 'M' }
  const pickSize = (key, sz) => setSelectedSize((prev) => ({ ...prev, [key]: sz }));

  // Móvil: abrir/cerrar bandeja al tocar "+"
  const [openTray, setOpenTray] = useState({}); // { [key]: boolean }
  const toggleTray = (key) => setOpenTray((prev) => ({ ...prev, [key]: !prev[key] }));

  // Desktop: mostrar tallas SOLO si el mouse está sobre el "+" o sobre la bandeja
  const [hoverPlusKey, setHoverPlusKey] = useState(null);
  const [hoverTrayKey, setHoverTrayKey] = useState(null);

  /* ===================== FILTROS ===================== */
  const FILTERS = [
    { key: "mas-vendidos", label: "Más vendidos" },
    { key: "urbanos", label: "Urbanos" },
    {
      key: "vehiculos",
      label: "Vehículos",
      children: [
        { key: "motos", label: "Motos" },
        { key: "carros", label: "Carros" },
      ],
    },
    { key: "artistas", label: "Artistas" },
    {
      key: "jugadores",
      label: "Jugadores",
      children: [
        { key: "nba", label: "NBA" },
        { key: "futbolistas", label: "Futbolistas" },
        { key: "formula", label: "Fórmula" },
      ],
    },
    { key: "pareja", label: "Pareja" },
    { key: "peliculas", label: "Películas" },
    { key: "anime", label: "Anime" },
    { key: "japon", label: "Japón" },
    { key: "gym", label: "Gym" },
    { key: "videojuegos", label: "VideoJuegos" },
  ];

  const [activeFilters, setActiveFilters] = useState(new Set());
  const [openDropdownKey, setOpenDropdownKey] = useState(null); // key del filtro abierto (con hijos)
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });

  const toggleFilter = (key) => {
    setActiveFilters((prev) => {
      const s = new Set(prev);
      if (s.has(key)) s.delete(key);
      else s.add(key);
      return s;
    });
  };

  const handleFilterClick = (f, evt) => {
    if (f.children?.length) {
      const rect = evt.currentTarget.getBoundingClientRect();
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const left = Math.max(8, Math.min(vw - 260, rect.left));
      const top = rect.bottom + 8;
      setDropdownPos({ left, top });
      setOpenDropdownKey((prev) => (prev === f.key ? null : f.key));
    } else {
      setOpenDropdownKey(null);
      toggleFilter(f.key);
    }
  };

  const isActive = (key) => activeFilters.has(key);

  const filteredProducts = PRODUCTS.filter((p) => {
    if (activeFilters.size === 0) return true;
    const tags = p.tags ?? [];
    for (const f of activeFilters) {
      if (tags.includes(f)) return true;
    }
    return false;
  });

  /* ===================== VARIANTES ===================== */
  const cardVariants = {
    initial: { opacity: 0, y: 18, filter: "blur(6px)" },
    in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 } },
    hover: { y: -4, transition: { type: "spring", stiffness: 280, damping: 22 } },
  };

  return (
    <>
      <Head title="Catálogo · Playeras | Luemik" />
      <div className="relative min-h-screen bg-neutral-950 text-white">
        {/* Header */}
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
          user={user}
          light={false}
        />

        <GlassSidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} light={false} />

        {/* Hero */}
        <section className="pt-28 md:pt-32 pb-6 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">T SHOP</h1>
          <div className="mt-4 inline-block rounded-md bg-lime-400 px-4 py-2 text-black font-semibold">Playeras para todos</div>
        </section>

        {/* Triptych (conservado) */}
        <section className="px-4 md:px-8 pb-10" onMouseLeave={() => setHovered(null)}>
          <div className="mx-auto max-w-7xl flex gap-4 md:gap-6 h-[68vh] md:h-[72vh] max-h-[720px]">
            {IMAGENES.map((card, idx) => {
              const isActiveCard = hovered === idx;
              const isDim = hovered !== null && hovered !== idx;
              return (
                <motion.div
                  key={idx}
                  className="relative overflow-hidden rounded-3xl cursor-pointer flex-1"
                  onMouseEnter={() => setHovered(idx)}
                  onFocus={() => setHovered(idx)}
                  initial={false}
                  animate={{ flexGrow: isActiveCard ? 1.6 : 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 16 }}
                >
                  <Link href={card.href} className="block h-full w-full">
                    <motion.img
                      src={card.src}
                      alt={card.titulo}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={false}
                      animate={{
                        scale: isActiveCard ? 1.08 : isDim ? 0.98 : 1.0,
                        filter: isActiveCard ? "brightness(1.05)" : isDim ? "brightness(0.7)" : "brightness(0.9)",
                      }}
                      transition={{ type: "spring", stiffness: 140, damping: 18 }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="inline-block rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-black">{card.subtitulo}</div>
                      <h3 className="mt-3 text-2xl md:text-3xl font-extrabold drop-shadow">{card.titulo}</h3>
                      <motion.span
                        className="mt-2 inline-block text-sm md:text-base"
                        initial={false}
                        animate={{ opacity: isActiveCard ? 1 : 0.0, y: isActiveCard ? 0 : 8 }}
                        transition={{ duration: 0.25 }}
                      >
                        Ver colección →
                      </motion.span>
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-3xl ring-2"
                      initial={false}
                      animate={{ opacity: isActiveCard ? 1 : 0 }}
                      style={{ borderColor: "rgba(255,255,255,0.5)" }}
                      transition={{ duration: 0.2 }}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ===================== BARRA DE FILTROS ===================== */}
        <section className="px-4 md:px-8 pb-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white/90">Explora por categoría</h3>
              <button
                onClick={() => setActiveFilters(new Set())}
                className="text-xs md:text-sm text-white/60 hover:text-white/90 transition underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="relative">
              {/* importante: overflow-y-visible para que el dropdown no se recorte */}
              <div
                className="flex gap-2 overflow-x-auto overflow-y-visible no-scrollbar py-1"
                style={{ overscrollBehaviorX: "contain", touchAction: "pan-y" }}
              >
                {FILTERS.map((f) => {
                  const active = isActive(f.key);
                  const isOpen = openDropdownKey === f.key && !!f.children?.length;

                  return (
                    <div className="relative" key={f.key}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => handleFilterClick(f, e)}
                        className={[
                          "px-3.5 h-9 rounded-xl border backdrop-blur-sm text-sm font-semibold flex items-center gap-1.5 transition",
                          active
                            ? "bg-white text-black border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
                            : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10",
                        ].join(" ")}
                        title={f.label}
                      >
                        <span>{f.label}</span>
                        {f.children?.length ? (
                          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex">
                            <FiChevronDown />
                          </motion.span>
                        ) : null}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Portal del dropdown (vertical, fuera del contenedor con scroll) */}
        {openDropdownKey &&
          (() => {
            const parent = FILTERS.find((x) => x.key === openDropdownKey);
            if (!parent?.children?.length) return null;

            return createPortal(
              <AnimatePresence>
                <motion.div
                  key={openDropdownKey}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "fixed",
                    left: dropdownPos.left,
                    top: dropdownPos.top,
                    zIndex: 1000,
                  }}
                >
                  <div className="rounded-xl border border-white/10 bg-[#17131d]/95 backdrop-blur-md p-2 shadow-2xl min-w-[220px]">
                    <div className="flex flex-col gap-2">
                      {parent.children.map((c) => {
                        const childActive = isActive(c.key);
                        return (
                          <button
                            key={c.key}
                            onClick={() => {
                              toggleFilter(c.key);
                              setOpenDropdownKey(null);
                            }}
                            className={[
                              "px-3 h-9 rounded-lg text-sm font-semibold text-left transition w-full",
                              childActive ? "bg-white text-black" : "bg-white/5 hover:bg-white/10 text-white/80",
                            ].join(" ")}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* backdrop transparente para cerrar al hacer clic fuera */}
                <motion.div
                  key="dropdown-backdrop"
                  className="fixed inset-0 z-[999]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.01 }}
                  exit={{ opacity: 0 }}
                  style={{ background: "transparent" }}
                  onClick={() => setOpenDropdownKey(null)}
                />
              </AnimatePresence>,
              document.body
            );
          })()}

        {/* ===================== GRILLA (28, 4 por fila) ===================== */}
        <section className="px-4 md:px-8 pb-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Playeras</h2>
              <Link href="/catalogo" className="text-white/70 hover:text-white transition">
                Ver todo →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((p) => {
                const sel = selectedSize[p.key] ?? "M";
                const precioActual = Number(p.precioNum ?? p.precio ?? 0);
                const precioAntes = Number(p.precioAntesNum ?? p.precioAntes ?? precioActual * 1.3);
                const isOpen = !!openTray[p.key];
                const showTray = isOpen || hoverPlusKey === p.key || hoverTrayKey === p.key;

                return (
                  <motion.article
                    key={p.key}
                    variants={cardVariants}
                    initial="initial"
                    whileInView="in"
                    viewport={{ once: true, amount: 0.25 }}
                    whileHover="hover"
                    className="relative rounded-2xl overflow-visible"
                  >
                    {/* Imagen */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                      <img
                        src={p.img}
                        alt={p.nombre}
                        className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-[1.02]"
                      />

                      {/* Corazón */}
                      <button
                        type="button"
                        onClick={() => toggleFavorito(p)}
                        className="absolute top-2 right-2 h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-black/55 transition"
                        aria-label="Favorito"
                        title="Favorito"
                      >
                        <FiHeart className={`text-white ${isFavorito(p) ? "fill-white" : "fill-transparent"}`} size={18} />
                      </button>

                      {/* Zona de + y tallas */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                        {/* + */}
                        <button
                          type="button"
                          onMouseEnter={() => setHoverPlusKey(p.key)}
                          onMouseLeave={() => setHoverPlusKey((k) => (k === p.key ? null : k))}
                          onClick={() => toggleTray(p.key)} // móvil
                          className="h-10 w-10 rounded-xl bg-white text-black font-black text-2xl leading-none flex items-center justify-center shadow-md active:scale-95 transition"
                          aria-label="Seleccionar talla"
                          title={`Seleccionar talla (${sel})`}
                        >
                          +
                        </button>

                        {/* Tallas */}
                        <div
                          className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar"
                          onMouseEnter={() => setHoverTrayKey(p.key)}
                          onMouseLeave={() => setHoverTrayKey((k) => (k === p.key ? null : k))}
                        >
                          <div
                            className={[
                              "flex gap-2 bg-[#17131d]/85 border border-white/10 rounded-2xl backdrop-blur-md px-2 py-1.5 transition-all",
                              showTray
                                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                                : "opacity-0 scale-95 translate-y-1 pointer-events-none",
                            ].join(" ")}
                          >
                            {SIZES.map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  pickSize(p.key, sz);
                                  addToCart(p, sz);
                                  setOpenTray((prev) => ({ ...prev, [p.key]: false }));
                                }}
                                className={`px-3 h-8 rounded-xl text-[11px] md:text-xs font-bold tracking-wide transition ${
                                  sel === sz ? "bg-white text-black" : "bg-white/5 text-white/80 hover:bg-white/10"
                                }`}
                                title={`Agregar ${sz}`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info — sin fondo alrededor */}
                    <div className="px-1 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm md:text-base font-extrabold">{p.nombre}</h3>
                        <span className="text-sm md:text-base font-bold text-white/90">
                          ${Number(p.precioNum ?? p.precio).toFixed(0)}
                        </span>
                      </div>

                      {/* Precios: anterior tachado (gris) + actual */}
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-[11px] md:text-xs text-white/40 line-through">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(precioAntes)} MXN
                        </span>

                        <span className="text-[12px] md:text-sm text-white/90 font-extrabold">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(precioActual)} MXN
                        </span>
                      </div>

                      <div className="mt-3 h-[1px] w-full bg-white/10" />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== SIDEBAR CARRITO ===================== */}
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
                className="fixed top-0 right-0 h-full z-[210]"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                style={{
                  width: "370px",
                  maxWidth: "96vw",
                  boxShadow: "-20px 0 48px 0 #0009",
                  borderTopLeftRadius: "32px",
                  borderBottomLeftRadius: "32px",
                  background: "rgba(26,22,34,0.60)",
                  backdropFilter: "blur(24px) saturate(1.8)",
                  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
                  border: "1.5px solid rgba(255,255,255,0.10)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <button
                  className="cart-close"
                  onClick={closeCart}
                  aria-label="Cerrar"
                  style={{
                    position: "absolute",
                    right: 18,
                    top: 18,
                    fontSize: 30,
                    background: "none",
                    border: "none",
                    color: "#fff",
                    zIndex: 5,
                    cursor: "pointer",
                    opacity: 0.8,
                  }}
                >
                  <FiX />
                </button>
                <h3 style={{ margin: "32px 0 24px 36px", fontWeight: 800, fontSize: 26, letterSpacing: 0.2 }}>Tu carrito</h3>
                <div style={{ flex: 1, overflowY: "auto", padding: "0 0 0 36px" }}>
                  {cart.length === 0 ? (
                    <div style={{ color: "#ccc", marginTop: 30, fontSize: 18 }}>¡El carrito está vacío!</div>
                  ) : (
                    cart.map((item, idx) => (
                      <div
                        className="cart-item"
                        key={item.id ?? `${item.product_id}-${item.talla}-${idx}`}
                        style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}
                      >
                        <img src={item.img} alt={item.nombre} className="cart-img" style={{ width: 60, borderRadius: 10 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div className="cart-nombre" style={{ fontWeight: 700, fontSize: 17 }}>
                              {item.nombre}
                            </div>
                            <div className="cart-precio" style={{ marginLeft: 8, fontSize: "1.12rem" }}>
                              {item.precio}
                            </div>
                          </div>
                          <div className="cart-talla" style={{ fontSize: 15, opacity: 0.7 }}>{item.talla}</div>
                          <div style={{ display: "flex", alignItems: "center", margin: "7px 0 3px 0", gap: 13 }}>
                            <button
                              disabled={!!item.id && pending.has(item.id)}
                              onClick={() => changeQty(idx, -1)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#fff",
                                fontSize: "1.2rem",
                                padding: "2px 10px",
                                cursor: "pointer",
                                opacity: !!item.id && pending.has(item.id) ? 0.35 : 0.65,
                                fontWeight: "bold",
                              }}
                              aria-label="Menos"
                            >
                              -
                            </button>
                            <span style={{ minWidth: 18, textAlign: "center", fontSize: "1.13rem", fontWeight: 700 }}>
                              {item.cantidad}
                            </span>
                            <button
                              disabled={!!item.id && pending.has(item.id)}
                              onClick={() => changeQty(idx, 1)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#fff",
                                fontSize: "1.2rem",
                                padding: "2px 10px",
                                cursor: "pointer",
                                opacity: !!item.id && pending.has(item.id) ? 0.35 : 0.85,
                                fontWeight: "bold",
                              }}
                              aria-label="Más"
                            >
                              +
                            </button>
                            <span style={{ color: "#b580f6", fontSize: "1.05rem" }}>
                              ${((item.precioNum ?? Number(String(item.precio).replace("$", ""))) * item.cantidad).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          disabled={!!item.id && pending.has(item.id)}
                          onClick={() => removeFromCart(idx)}
                          style={{
                            color: "#f44",
                            background: "none",
                            border: "none",
                            fontSize: "1.45rem",
                            cursor: !!item.id && pending.has(item.id) ? "not-allowed" : "pointer",
                            opacity: !!item.id && pending.has(item.id) ? 0.4 : 1,
                          }}
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ borderTop: "1.2px solid rgba(255,255,255,0.08)", padding: "26px 36px 30px 36px" }}>
                  <div className="cart-total" style={{ fontSize: 21, fontWeight: 700, marginBottom: 12 }}>
                    Total: <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <button
                    className="cart-checkout"
                    onClick={() => {
                      setShowCart(false);
                      router.visit("/checkout");
                    }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 13,
                      background: "#6b4be2",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 19,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 12px 0 #8b7dff52",
                    }}
                  >
                    PAGAR
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Ocultar scrollbars horizontales de chips / tallas */}
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
