import React, { useEffect, useRef, useState } from "react";
import { Head } from "@inertiajs/react";
import HeaderLuemik from "../../Components/HeaderLuemik";
import GlassSidebar from "../../Components/GlassSidebar";


export default function SudaderasCatalogo({ user = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [showFavoritos, setShowFavoritos] = useState(false);

  const handleOpenSearch = () => setSearchOpen(v => !v);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Head title="Catálogo · Sudaderas | Luemik" />
      <div className="min-h-screen bg-neutral-950 text-white">
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


        <section className="pt-28 md:pt-32 pb-10 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">SUDADERAS</h1>
          <div className="mt-4 inline-block rounded-md bg-lime-400 px-4 py-2 text-black font-semibold">
            Calidez y estilo
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[4/5] rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="opacity-70">Card #{i}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
