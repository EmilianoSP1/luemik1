import React, { useRef, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

const modeloURL = "/shirt.glb"; // tu archivo GLB en public

// Componente para la playera 3D
function Playera3D({ color, textura }) {
  const { nodes, materials } = useGLTF(modeloURL);

  // Si hay textura, aplicarla como map a material
  if (textura) {
    materials['Material'].map = textura;
    materials['Material'].needsUpdate = true;
  }
  materials['Material'].color.set(color);

  return (
    <group dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tshirt.geometry}
        material={materials['Material']}
        position={[0, 0, 0]}
      />
    </group>
  );
}

// Hook para cargar imagen como textura
function useTexturaImagen(imgUrl) {
  const [textura, setTextura] = useState(null);
  React.useEffect(() => {
    if (!imgUrl) { setTextura(null); return; }
    const loader = new window.THREE.TextureLoader();
    loader.load(imgUrl, t => setTextura(t));
  }, [imgUrl]);
  return textura;
}

export default function CustomizadorPlayera3D() {
  const [color, setColor] = useState("#ffffff");
  const [fondo, setFondo] = useState("studio");
  const [imgUrl, setImgUrl] = useState(null);
  const textura = useTexturaImagen(imgUrl);

  // Exportar imagen del canvas (descarga screenshot)
  function exportarImagen() {
    const canvas = document.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "mi_playera_personalizada.png";
    link.click();
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImgUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  // Fondos disponibles (puedes poner más)
  const fondos = [
    { nombre: "Estudio", valor: "studio" },
    { nombre: "Cielo", valor: "city" },
    { nombre: "Luz clara", valor: "apartment" },
    { nombre: "Negro", valor: "black" }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#18181b" }}>
      {/* PANEL LATERAL */}
      <div style={{
        minWidth: 270, maxWidth: 320, background: "#242429",
        padding: 24, borderRadius: 24, margin: 24, color: "#fff", boxShadow: "0 8px 32px #0004"
      }}>
        <h2 style={{ fontWeight: "bold", fontSize: 19, marginBottom: 22 }}>Sube tu diseño (PNG/JPG):</h2>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleUpload}
          style={{ marginBottom: 16 }}
        />
        <div style={{ margin: "12px 0 18px 0" }}>
          <b>Color de la playera</b>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{ marginLeft: 12, width: 36, height: 36, border: "none", borderRadius: 7, verticalAlign: "middle" }}
          />
        </div>
        <div style={{ margin: "16px 0" }}>
          <b>Fondo</b>
          <select
            value={fondo}
            onChange={e => setFondo(e.target.value)}
            style={{ marginLeft: 12, padding: 6, borderRadius: 8 }}
          >
            {fondos.map(f => (
              <option value={f.valor} key={f.valor}>{f.nombre}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportarImagen}
          style={{
            marginTop: 25, background: "#6151ff", color: "#fff", fontWeight: "bold",
            fontSize: 18, borderRadius: 13, padding: "12px 0", width: "100%",
            border: "none", cursor: "pointer", boxShadow: "0 2px 12px #8b7dff25"
          }}>
          Exportar imagen
        </button>
        <p style={{ fontSize: 14, marginTop: 20, color: "#bbb" }}>
          Gira la playera y prueba distintos diseños en 3D.
        </p>
      </div>

      {/* ZONA 3D */}
      <div style={{ flex: 1, position: "relative", background: "#121215" }}>
        <div style={{
          position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)", zIndex: 10,
          padding: "10px 38px", background: "#272930d5", borderRadius: 7, color: "#fff", fontWeight: 600, letterSpacing: 1
        }}>
          PARA SALIR DE LA PANTALLA COMPLETA, PRESIONA <kbd style={{
            background: "#23262c", padding: "2px 9px", borderRadius: 5, marginLeft: 7, fontWeight: 900
          }}>ESC</kbd>
        </div>
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 2.2], fov: 42 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[0, 2, 2]} intensity={0.9} />
            <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 1.6} minPolarAngle={0.2} />
            {/* Playera */}
            <Playera3D color={color} textura={textura} />
            {/* Fondo 3D */}
            {fondo === "studio" && <Environment preset="studio" />}
            {fondo === "city" && <Environment preset="city" />}
            {fondo === "apartment" && <Environment preset="apartment" />}
            {fondo === "black" && <color attach="background" args={["#121215"]} />}
          </Canvas>
        </Suspense>
        {/* Pantalla completa (opcional) */}
        <button
          style={{
            position: "absolute", right: 35, top: 45, zIndex: 20,
            background: "#21222a", color: "#fff", borderRadius: 8, border: "none",
            padding: 10, fontSize: 24, cursor: "pointer", boxShadow: "0 3px 18px #0008"
          }}
          title="Pantalla completa"
          onClick={() => {
            const c = document.querySelector("canvas");
            if (c.requestFullscreen) c.requestFullscreen();
            else if (c.webkitRequestFullscreen) c.webkitRequestFullscreen();
          }}
        >⛶</button>
      </div>
    </div>
  );
}

// Necesitas esto para que funcione el modelo
useGLTF.preload("/shirt.glb");
