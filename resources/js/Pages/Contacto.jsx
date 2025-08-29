import HeaderLuemik from '../Components/HeaderLuemik';
import Beams from '../Components/Beams';
import '../Components/Beams.css';
import { useState, useRef, useEffect } from 'react';
import { FiMail, FiUser, FiMessageCircle } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";

export default function Contacto(props) {
  // Estados del header (como tienes en Welcome)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const searchRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [favoritos, setShowFavoritos] = useState(false);

  // Estados del formulario
  const [form, setForm] = useState({ nombre: "", correo: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  // Handlers de formulario
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // NUEVO handleSubmit funcional:
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/enviar-contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setEnviado(true);
        setForm({ nombre: "", correo: "", mensaje: "" });
        setTimeout(() => setEnviado(false), 2500);
      } else {
        alert("Hubo un error al enviar el mensaje.");
      }
    } catch (err) {
      alert("Error de red al enviar el mensaje.");
      console.error(err);
    }
  };




// CARGA Y LIMPIEZA DEL WIDGET TAWK (solo en esta pantalla)
useEffect(() => {
  // Si ya existe, solo muéstralo (evita duplicados)
  if (window.Tawk_API) {
    try { window.Tawk_API.showWidget?.(); } catch {}
  } else if (!document.getElementById('tawkto-chat-script')) {
    const script = document.createElement('script');
    script.id = 'tawkto-chat-script';
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://embed.tawk.to/687db3958ba34c1920d310e5/1j0lgavqa'; // tu src
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);
  }

  // Cleanup al salir de Contacto
  return () => {
    // 1) Oculta el widget (API oficial)
    try { window.Tawk_API?.hideWidget?.(); } catch {}

    // 2) Remueve TODO lo que Tawk añade al DOM
    setTimeout(() => {
      // scripts
      document
        .querySelectorAll('script#tawkto-chat-script, script[src*="tawk.to"]')
        .forEach((n) => n.parentNode?.removeChild(n));

      // iframes y contenedores
      document
        .querySelectorAll(
          '#tawkchat-container, [id^="tawk_"], iframe[src*="tawk.to"], iframe[title="chat widget"]'
        )
        .forEach((n) => n.parentNode?.removeChild(n));

      // 3) Limpia globals para que no “reviva”
      try { delete window.Tawk_API; } catch {}
      try { delete window.Tawk_LoadStart; } catch {}
    }, 0);
  };
}, []);




  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* FONDO ANIMADO */}
      <div style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        top: 0,
        left: 0,
      }}>
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={0}
        />
      </div>

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
        handleOpenSearch={() => setSearchOpen(true)}
        searchRef={searchRef}
        showSubmenu={showSubmenu}
        handlePlayerasClick={() => setShowSubmenu(prev => !prev)}
        handleSubmenuBlur={() => setShowSubmenu(false)}
        user={props.user || { name: "Nombre Usuario" }}
      />

      {/* CONTENIDO */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "90vh",
          paddingTop: 100,
        }}
      >
        <div
          className="max-w-4xl w-full bg-black/80 rounded-2xl shadow-2xl grid md:grid-cols-2 gap-2 p-7 md:p-12"
          style={{
            backdropFilter: "blur(5px)",
            color: "#fff",
            border: "1.2px solid #3926ff50",
          }}
        >
          {/* FORMULARIO */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit} style={{ minWidth: 230 }}>
            <h2 className="text-3xl font-extrabold mb-3 text-[#fff]">Contáctanos</h2>
            <label className="flex items-center gap-3 bg-[#171426] px-4 py-3 rounded-lg border border-[#221b47]">
              <FiUser size={20} className="text-[#5d53ff]" />
              <input
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                className="w-full bg-transparent border-none outline-none text-white text-base"
                value={form.nombre}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </label>
            <label className="flex items-center gap-3 bg-[#171426] px-4 py-3 rounded-lg border border-[#221b47]">
              <FiMail size={20} className="text-[#5d53ff]" />
              <input
                type="email"
                name="correo"
                placeholder="Correo electrónico"
                className="w-full bg-transparent border-none outline-none text-white text-base"
                value={form.correo}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </label>
            <label className="flex gap-3 bg-[#171426] px-4 py-3 rounded-lg border border-[#221b47]">
              <FiMessageCircle size={20} className="text-[#5d53ff] mt-1" />
              <textarea
                name="mensaje"
                placeholder="Tu mensaje"
                className="w-full bg-transparent border-none outline-none text-white text-base resize-none h-28"
                value={form.mensaje}
                onChange={handleChange}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#3a29ff] text-white font-bold text-lg shadow hover:bg-[#452cff] transition"
              disabled={enviado}
            >
              {enviado ? "¡Enviado!" : "Enviar mensaje"}
            </button>
          </form>

          {/* REDES Y DATOS */}
          <div className="flex flex-col items-center justify-center gap-8 pt-4">
            {/* Redes sociales */}
            <div className="flex gap-6 mb-4">
              <a href="https://www.facebook.com/profile.php?id=61577625993690" target="_blank" rel="noopener noreferrer">
                <div className="bg-[#3a29ff]/90 hover:bg-[#3a29ff] text-white w-11 h-11 flex items-center justify-center rounded-full shadow transition">
                  <FaFacebookF size={23} />
                </div>
              </a>
              <a href="https://instagram.com/luemik_mx/" target="_blank" rel="noopener noreferrer">
                <div className="bg-gradient-to-tr from-[#ff389f] to-[#4e44ff] hover:brightness-110 text-white w-11 h-11 flex items-center justify-center rounded-full shadow transition">
                  <FaInstagram size={23} />
                </div>
              </a>
              <a href="https://www.tiktok.com/@luemik_mx" target="_blank" rel="noopener noreferrer">
                <div className="bg-black hover:bg-[#222] text-white w-11 h-11 flex items-center justify-center rounded-full shadow transition">
                  <FaTiktok size={23} />
                </div>
              </a>
            </div>
            {/* Teléfono y correo */}
            <div className="w-full mt-2 px-2 text-center">
              <div className="text-lg font-bold text-[#fff] mb-1">Contacto directo</div>
              <div className="text-white/90 text-base">
                <span className="font-medium">Tel:</span> 5615593795 <br/> 5578499895<br />
                <span className="font-medium">Correo:</span> <br />
                luemikmx@gmail.com <br />
                mxluemik@hotmail.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
