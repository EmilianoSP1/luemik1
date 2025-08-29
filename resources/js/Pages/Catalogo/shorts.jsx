import React, { useEffect, useRef, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import HeaderLuemik from "../../Components/HeaderLuemik";
import GlassSidebar from "../../Components/GlassSidebar";

export default function ShortsCatalogo({ user: userProp = null }) {
  const user = usePage().props?.auth?.user ?? userProp;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [showFavoritos, setShowFavoritos] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleOpenSearch = () => setSearchOpen(v => !v);

  return (
    <>
      <Head title="Catálogo · Shorts | Luemik" />
      <div className="relative min-h-screen bg-neutral-950 text-white">
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

        {/* ...tu contenido existente de Shorts... */}
      </div>
    </>
  );
}
