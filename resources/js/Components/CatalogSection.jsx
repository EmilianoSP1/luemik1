// resources/js/Components/CatalogSection.jsx
import './CatalogSection.css';
import { useState, useEffect, useRef } from 'react';
import { Link as InertiaLink } from '@inertiajs/react';
import { FiHeart, FiPlus } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Hover-swap y estilos del card
import HoverSwapImage from './HoverSwapImage';
import './ProductCardHover.css';

const tallasDisponibles = ["XS", "S", "M", "L", "XL"];

const productos = [
  {
    nombre: 'Blassed T-Shirt',
    slug: 'blassed-t-shirt',   // ← ruta de detalle
    precio: '$199',
    img: '/img/catalogo/Blassed.jpg',
    img2: '/img/catalogo/blassing.jpg',
  },
  {
    nombre: 'Blasing',
    slug: 'blasing',
    precio: '$199',
    img: '/img/catalogo/blassing.jpg',
  },
  {
    nombre: 'Fight',
    slug: 'fight',
    precio: '$199',
    desc: 'Jet Black | 2 colores',
    img: '/img/catalogo/fight.jpg',
  },
  {
    nombre: 'sufer T-Shirt',
    slug: 'sufer-tshirt',
    precio: '$199',
    desc: 'Stained Black | 2 colores',
    img: '/img/catalogo/sufer.jpg',
  },
  {
    nombre: 'Angel Oversize',
    slug: 'angel-oversize',
    precio: '$199',
    desc: 'Black | Limitada',
    img: '/img/catalogo/angeloversize.jpg',
  },
  {
    nombre: 'Blessed Saint',
    slug: 'blessed-saint',
    precio: '$199',
    desc: 'Black | Exclusiva',
    img: '/img/catalogo/blessed.jpg',
  },
  {
    nombre: 'Good Vibes',
    slug: 'good-vibes',
    precio: '$145',
    desc: 'White | 2 colores',
    img: '/img/catalogo/goodvibes.jpg',
  },
  {
    nombre: 'Art Graffiti',
    slug: 'art-graffiti',
    precio: '$165',
    desc: 'Black | Edición especial',
    img: '/img/catalogo/graffiti.jpg',
  },
  {
    nombre: 'Old School',
    slug: 'old-school',
    precio: '$150',
    desc: 'Dark Grey | Retro',
    img: '/img/catalogo/oldschool.jpg',
  },
  {
    nombre: 'Sunset Dream',
    slug: 'sunset-dream',
    precio: '$158',
    desc: 'Rose | 2 colores',
    img: '/img/catalogo/sunset.jpg',
  },
  {
    nombre: 'White Letter',
    slug: 'white-letter',
    precio: '$120',
    desc: 'White | Básica',
    img: '/img/catalogo/whiteletter.jpg',
  },
  {
    nombre: 'Minimal Crew',
    slug: 'minimal-crew',
    precio: '$135',
    desc: 'Grey | Simple',
    img: '/img/catalogo/minimal.jpg',
  },
];

export default function CatalogSection({
  addToCart,
  cart,
  showCart,
  setShowCart,
  changeQty,
  removeFromCart,
  closeCart,
  getCartTotal,
  favoritos = [],
  toggleFavorito,
  isFavorito
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const items = gridRef.current.querySelectorAll('.catalogo-item');
    items.forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, y: 60, filter: 'blur(15px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 0.9, delay: i * 0.10, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none none' }
        }
      );
    });
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section className="catalog-section-bg">
      <div className="catalogo-grid" ref={gridRef}>
        {productos.map((prod, i) => (
          <div className="catalogo-item lift-on-hover" key={prod.slug ?? i}>
            <div className="catalogo-img-container">
              {/* Navegación SPA en la MISMA pestaña con Inertia */}
              <InertiaLink
                href={`/producto/${prod.slug ?? prod.id}`}
                className="catalogo-img-link"
                aria-label={`Ver ${prod.nombre}`}
                // opcional: preserva el scroll al cambiar de vista
                // preserveScroll
              >
                <HoverSwapImage
                  src={prod.img}
                  hoverSrc={prod.img2 || prod.hoverImg || (prod.images?.[1] ?? prod.img)}
                  alt={prod.nombre}
                  className="w-full"
                />
              </InertiaLink>

              {/* Favoritos (no navega) */}
              <button
                className={`catalogo-fav${isFavorito && isFavorito(prod) ? ' activo' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorito(prod); }}
                aria-label="Favorito"
                type="button"
              >
                <FiHeart />
              </button>

              {/* Popup tallas (no navega) */}
              <div
                className="catalogo-plus-popup-zone"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  left: 8,           // ← mueve a la IZQUIERDA/DERECHA (negativos permitidos)
                  bottom: 12,        // ← SUBIR/BAJAR
                  display: "flex",
                  alignItems: "center",
                  zIndex: 5
                }}
              >
                <button
                  className="catalogo-plus"
                  tabIndex={-1}
                  aria-label="Añadir talla"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiPlus />
                </button>

                {hoverIdx === i && (
                  <div className="catalogo-tallas-popup glassmorph-popup" onClick={(e) => e.stopPropagation()}>
                    {tallasDisponibles.map(talla => (
                      <button
                        className="catalogo-talla"
                        key={talla}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod, talla);
                          setHoverIdx(null);
                        }}
                        type="button"
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="catalogo-info">
              <div className="catalogo-nombre">{prod.nombre}</div>
              <div className="catalogo-precio">{prod.precio}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
