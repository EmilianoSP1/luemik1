// ——————— Reemplaza SOLO este bloque en resources/js/Pages/Producto/Show.jsx ———————
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import HeaderLuemik from '../../Components/HeaderLuemik';
import Aurora from '../../Components/Aurora/Aurora';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '../../Components/Breadcrumb';

export default function Show({ product, user = { name: "Nombre Usuario" }, laravelVersion, phpVersion }) {
  const title = product?.name || product?.nombre || 'Producto';
  const price = product?.precio || product?.price || '$ —';

  // Fallback de imágenes: usa img y img2 si existen
  const imgs = [
    product?.img || product?.images?.[0],
    product?.img2 || product?.images?.[1],
  ].filter(Boolean);

  const [active, setActive] = useState(0);

  return (
    <>
      <Head title={`${title} | Luemik`} />

      <div className="relative min-h-screen w-full bg-[#0c0a11] text-white overflow-hidden">
        {/* Fondo opcional */}
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.4}
          amplitude={0.7}
          speed={0.2}
          style={{
            height: "900px",
            position: "absolute",
            top: 0, left: 0, width: "100vw",
            zIndex: 0, pointerEvents: "none"
          }}
        />

        {/* Header */}
        <HeaderLuemik
          scrolled={false}
          cart={[]}
          setShowCart={() => {}}
          favoritos={[]}
          setShowFavoritos={() => {}}
          sidebarOpen={false}
          setSidebarOpen={() => {}}
          searchOpen={false}
          setSearchOpen={() => {}}
          handleOpenSearch={() => {}}
          searchRef={{ current: null }}
          showSubmenu={false}
          handlePlayerasClick={() => {}}
          handleSubmenuBlur={() => {}}
          user={user}
        />

        {/* ——— AQUI CAMBIAS EL DISEÑO ——— */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
          {/* Breadcrumb (quítalo si no lo quieres) */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/catalogo">Catálogo</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Galería: imagen principal + miniaturas */}
            <div className="sticky top-28 space-y-4">
              <div className="w-full rounded-2xl overflow-hidden bg-white/5 aspect-[4/5]">
                {/* Imagen activa */}
                <img
                  src={imgs[active] ?? '/img/catalogo/placeholder.jpg'}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Miniaturas (si hay 2+) */}
              {imgs.length > 1 && (
                <div className="flex gap-3">
                  {imgs.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActive(idx)}
                      className={`h-20 w-16 md:h-24 md:w-20 rounded-xl overflow-hidden ring-2 transition
                        ${active === idx ? 'ring-white' : 'ring-transparent hover:ring-white/40'}`}
                      aria-label={`Ver imagen ${idx + 1}`}
                    >
                      <img src={src} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info del producto */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{title}</h1>

              <div className="flex items-baseline gap-4">
                {product?.precioAnterior && (
                  <span className="line-through opacity-60 font-semibold text-xl">
                    {product.precioAnterior}
                  </span>
                )}
                <span className="text-3xl md:text-4xl font-black">{price}</span>
              </div>

              {product?.descripcion && (
                <p className="opacity-90 leading-relaxed">{product.descripcion}</p>
              )}

              {/* Botones */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="px-6 py-3 rounded-xl bg-[#6b4be2] font-bold shadow
                             hover:brightness-110 active:translate-y-px transition"
                >
                  Comprar ahora
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition"
                >
                  Seguir explorando
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-white/40">
          Luemik © {new Date().getFullYear()} — Laravel v{laravelVersion} (PHP v{phpVersion})
        </footer>
      </div>
    </>
  );
}
// ——————— Fin del bloque ———————
