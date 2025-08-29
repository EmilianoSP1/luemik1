import { useState } from 'react';
import { FiBookmark } from 'react-icons/fi';

function FavoritosModal({ favoritos, onClose, addToCart, toggleFavorito }) {
  // Estado para talla seleccionada y agregado
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
  const [agregado, setAgregado] = useState({});

  const tallas = ["XS", "S", "M", "L", "XL"];

  // Cierra si da click fuera del modal
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('favoritos-modal-backdrop')) {
      onClose();
    }
  };

  // Cambia la talla seleccionada
  const handleTalla = (nombre, talla) => {
    setTallasSeleccionadas(prev => ({ ...prev, [nombre]: talla }));
  };

  // Animación de “Agregado al carrito”
  const handleAgregar = (prod) => {
    const talla = tallasSeleccionadas[prod.nombre] || tallas[2]; // por defecto "M"
    addToCart(prod, talla);
    setAgregado(prev => ({ ...prev, [prod.nombre]: true }));
    setTimeout(() => setAgregado(prev => ({ ...prev, [prod.nombre]: false })), 1600);
  };

  return (
    <div
      className="favoritos-modal-backdrop"
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(15,13,20,0.84)",
        zIndex: 250,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(6px)"
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          background: "rgba(24,19,32,0.98)",
          borderRadius: "2rem",
          padding: "36px 30px 36px 30px",
          boxShadow: "0 12px 50px #0008",
          maxWidth: "980px",
          width: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          transition: "all 0.2s"
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          style={{
            position: "absolute",
            right: 22,
            top: 18,
            background: "none",
            color: "#fff",
            border: "none",
            fontSize: "2.1rem",
            cursor: "pointer",
            opacity: 0.92,
            zIndex: 10
          }}
          onClick={onClose}
        >
          ×
        </button>
        <h2 style={{
          fontWeight: 800,
          fontSize: 30,
          marginBottom: 28,
          letterSpacing: 0.3,
          textAlign: "center"
        }}>
          Tus Favoritos
        </h2>
        {favoritos.length === 0 ? (
          <p style={{ color: "#ccc", fontSize: 19, marginTop: 44, textAlign: "center" }}>
            No tienes productos favoritos todavía.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "30px 20px"
            }}
          >
            {favoritos.map((prod, i) => (
              <div
                key={prod.nombre + i}
                style={{
                  background: "rgba(28,21,37,0.93)",
                  borderRadius: "1.3rem",
                  boxShadow: "0 3px 18px 0 rgba(24,0,48,0.10)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 0,
                  minWidth: 220,
                  maxWidth: 290,
                  margin: "0 auto"
                }}
              >
                <div style={{ width: "100%", position: "relative" }}>
                  <img
                    src={prod.img}
                    alt={prod.nombre}
                    style={{
                      width: "100%",
                      objectFit: "cover",
                      aspectRatio: "1/1",
                      minHeight: 160,
                      maxHeight: 220,
                      borderRadius: "1.1rem 1.1rem 0 0",
                      background: "#23202b"
                    }}
                  />
                  <button
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 16,
                      background: "rgba(18,15,22,0.82)",
                      border: "none",
                      borderRadius: "50%",
                      padding: 7,
                      color: "#FF4C8B",
                      fontSize: 21,
                      cursor: "pointer",
                      zIndex: 3,
                      boxShadow: "0 1px 5px #0002"
                    }}
                    title="Quitar de favoritos"
                    onClick={() => toggleFavorito(prod)}
                  >
                    <FiBookmark />
                  </button>
                </div>
                <div style={{
                  width: "100%",
                  padding: "17px 0 2px 0",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontSize: "1.12rem",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 6
                  }}>{prod.nombre}</div>
                  <div style={{
                    fontSize: "1.03rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: 8
                  }}>{prod.precio}</div>
                </div>
                {/* Selección de tallas */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 7,
                  margin: "2px 0 6px 0"
                }}>
                  {["XS", "S", "M", "L", "XL"].map(talla => (
                    <button
                      key={talla}
                      style={{
                        background: tallasSeleccionadas[prod.nombre] === talla ? "#3a29ff" : "rgba(56, 54, 74, 0.70)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "0.8rem",
                        padding: "4px 11px",
                        fontSize: "1.01rem",
                        cursor: "pointer",
                        fontWeight: 700,
                        boxShadow: tallasSeleccionadas[prod.nombre] === talla ? "0 2px 10px #4c3cff33" : "none",
                        transition: "all 0.14s"
                      }}
                      onClick={() => handleTalla(prod.nombre, talla)}
                    >
                      {talla}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleAgregar(prod)}
                  disabled={agregado[prod.nombre]}
                  style={{
                    margin: "10px 0 16px 0",
                    background: agregado[prod.nombre] ? "#2dd482" : "#3a29ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.95rem",
                    fontWeight: 700,
                    fontSize: "1.02rem",
                    padding: "9px 19px",
                    cursor: agregado[prod.nombre] ? "default" : "pointer",
                    boxShadow: agregado[prod.nombre] ? "0 1px 10px #35efb33c" : "0 1px 10px #3a29ff24",
                    transition: "all 0.18s"
                  }}
                >
                  {agregado[prod.nombre] ? "Agregado al carrito" : "Agregar al carrito"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritosModal;
