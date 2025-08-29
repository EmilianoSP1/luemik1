import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";
import * as THREE from "three";

// Componente para la camiseta 3D
function Shirt({ textureUrl }) {
  const { scene } = useGLTF("/shirt.glb");
  const ref = useRef();

  // Aplica la textura SOLO cuando cambia la imagen
  React.useEffect(() => {
    if (!textureUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (tex) => {
      tex.flipY = false; // Corrige la orientación
      scene.traverse((child) => {
        if (child.isMesh) {
          // Si tu modelo tiene varios materiales, aquí puedes hacer condicional
          child.material.map = tex;
          child.material.needsUpdate = true;
        }
      });
    });
  }, [textureUrl, scene]);

  // Animación: gira lento la playera
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });

  return <primitive object={scene} ref={ref} />;
}

export default function Playera3D() {
  const [imgUrl, setImgUrl] = useState(null);

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Opcional: verifica el tipo de archivo aquí si quieres
    setImgUrl(URL.createObjectURL(file));
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#181920", position: "relative" }}>
      {/* Input de archivo */}
      <div style={{
        position: "absolute", top: 24, left: 24, zIndex: 10,
        background: "#212235e8", padding: "16px 26px", borderRadius: 16, color: "#fff",
        boxShadow: "0 2px 20px #0004", maxWidth: 360,
        fontFamily: "inherit"
      }}>
        <b>Sube tu diseño (PNG/JPG):</b><br/>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleChange}
          style={{ marginTop: 8 }}
        />
        <p style={{ fontSize: 14, marginTop: 10, color: "#bdbaff" }}>
          Gira la playera y prueba tus diseños en 3D.<br/>
          Puedes acercar o alejar con el scroll.
        </p>
      </div>
      {/* Canvas 3D */}
      <Canvas camera={{ position: [0, 1.5, 3.2], fov: 45 }}>
        <ambientLight intensity={1.15} />
        <directionalLight position={[0, 2, 5]} intensity={1.18} />
        <Environment preset="city" />
        <Suspense fallback={
          <Html center>
            <span style={{
              color: "#fff", background: "#212235",
              padding: "14px 22px", borderRadius: 12, fontWeight: 700
            }}>
              Cargando playera...
            </span>
          </Html>
        }>
          <Shirt textureUrl={imgUrl} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2} maxDistance={5} />
      </Canvas>
    </div>
  );
}
