import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";
import { FiUpload, FiX, FiCheck } from "react-icons/fi";
import * as THREE from "three";

// Playera 3D
function Playera({ color, designTexture, positionY = -0.6, scale = 1 }) {
  const { scene } = useGLTF("/shirt.glb");
  const ref = useRef();

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (designTexture) {
          child.material.map = designTexture;
          child.material.color.set("#fff");
        } else {
          child.material.map = null;
          child.material.color.set(color);
        }
        child.material.needsUpdate = true;
      }
    });
  }, [color, designTexture, scene]);

  return (
    <primitive
      object={scene}
      ref={ref}
      position={[0, positionY, 0]}
      scale={scale}
    />
  );
}

// Hook para cargar imagen
function useImage(url) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!url) { setImg(null); return; }
    const image = new window.Image();
    image.crossOrigin = "Anonymous";
    image.onload = () => setImg(image);
    image.src = url;
  }, [url]);
  return img;
}

export default function CrearPlayera() {
  // Estados para playera y textura 3D
  const [designTexture, setDesignTexture] = useState(null);
  const [color, setColor] = useState("#fff");
  const [bgColor, setBgColor] = useState("#1d1d20");
  const [showModal, setShowModal] = useState(false);

  // Estados para editor 2D (modal)
  const [modalImage, setModalImage] = useState(null);
  const [position, setPosition] = useState({ x: 90, y: 70 });
  const [size, setSize] = useState({ w: 130, h: 130 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Selector de mockup (frente/espalda)
  const [isFront, setIsFront] = useState(true);
  const mockupWidth = 350;
  const mockupHeight = 250;
  const canvasRef = useRef();

  // Cuando subes imagen en modal
  function handleModalImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setModalImage(URL.createObjectURL(file));
    // Centrar tamaño inicial
    setPosition({ x: 90, y: 70 });
    setSize({ w: 130, h: 130 });
  }

  // Drag/Resize
  function startDrag(e) {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }
  function duringDrag(e) {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  }
  function endDrag() { setDragging(false); }

  function handleResize(e, direction) {
    e.stopPropagation();
    if (direction === "br") {
      document.body.style.cursor = "nwse-resize";
      function move(ev) {
        setSize((s) => ({
          w: Math.max(40, ev.clientX - position.x),
          h: Math.max(40, ev.clientY - position.y),
        }));
      }
      function up() {
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      }
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    }
  }

  // --- Sincronizar el canvas oculto con el diseño actual ---
// Ahora usando SVG
const bgMockup = isFront ? "/playeras1.svg" : "/playeras2.svg";
  const imgMockup = useImage(bgMockup);
  const imgDesign = useImage(modalImage);

  // Renderizar diseño al canvas cada vez que cambia el diseño
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !imgMockup) return;
    ctx.clearRect(0, 0, mockupWidth, mockupHeight);
    ctx.drawImage(imgMockup, 0, 0, mockupWidth, mockupHeight);
    if (imgDesign) {
      ctx.drawImage(imgDesign, position.x, position.y, size.w, size.h);
    }
    // Pasar la imagen generada como textura 3D en tiempo real
    const url = canvasRef.current.toDataURL();
    new THREE.TextureLoader().load(url, (tex) => {
      tex.flipY = false;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      setDesignTexture(tex);
    });
    // eslint-disable-next-line
  }, [modalImage, imgDesign, position, size, imgMockup, isFront]);

  // Drag global listeners
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", duringDrag);
    window.addEventListener("mouseup", endDrag);
    return () => {
      window.removeEventListener("mousemove", duringDrag);
      window.removeEventListener("mouseup", endDrag);
    };
    // eslint-disable-next-line
  }, [dragging, offset]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: bgColor,
        display: "flex",
      }}
    >
      {/* PANEL IZQUIERDO */}
      <div
        style={{
          width: 320,
          minHeight: 400,
          background: "#181823f2",
          borderRadius: 22,
          color: "#fff",
          margin: 28,
          padding: "30px 26px",
          boxShadow: "0 2px 24px #0005",
          zIndex: 10,
        }}
      >
        <button
          style={{
            width: "100%",
            background: "#202020",
            color: "#fff",
            border: "none",
            borderRadius: 40,
            padding: "20px 0",
            fontSize: 19,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            marginBottom: 32,
            boxShadow: "0 2px 16px #0003"
          }}
          onClick={() => setShowModal(true)}
        >
          <span>Sube tu diseño</span>
          <FiUpload size={24} />
        </button>
        {/* Colores y fondo igual que antes */}
        <div style={{ margin: "22px 0 10px 0", fontWeight: 600 }}>
          Color de playera
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <button
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: color === "#fff" ? "2.2px solid #44f" : "2.2px solid #888",
              background: "#fff",
              marginRight: 6,
              cursor: "pointer",
            }}
            onClick={() => setColor("#fff")}
            title="Blanca"
          ></button>
          <button
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: color === "#222" ? "2.2px solid #44f" : "2.2px solid #888",
              background: "#222",
              cursor: "pointer",
            }}
            onClick={() => setColor("#222")}
            title="Negra"
          ></button>
        </div>
        <div style={{ margin: "26px 0 10px 0", fontWeight: 600 }}>
          Fondo
        </div>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          style={{
            width: 38,
            height: 38,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            background: "none",
          }}
        />
        <div style={{ marginTop: 32, opacity: 0.84, fontSize: 14 }}>
          <ul style={{ paddingLeft: 18, marginTop: 2, marginBottom: 4 }}>
            <li>
              Puedes cargar una imagen <b>PNG</b> o <b>JPG</b>.
            </li>
            <li>
              El diseño se verá sobre la playera (¡mejor si tiene fondo transparente!).
            </li>
            <li>
              Gira la playera con el mouse o el dedo.
            </li>
          </ul>
        </div>
      </div>

      {/* MODAL EDITOR */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,10,14,0.70)",
            zIndex: 200,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: 420,
              maxWidth: "100vw",
              background: "#fafafa",
              minHeight: "100vh",
              boxShadow: "-8px 0 28px 2px #0003",
              padding: "32px 32px 24px 32px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              overflowY: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                right: 18, top: 18, background: "none",
                border: "none", color: "#444", fontSize: 26, cursor: "pointer"
              }}
              aria-label="Cerrar"
            >
              <FiX />
            </button>
            <div style={{ width: "96%", maxWidth: 350, marginBottom: 10, marginTop: 30 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#888", textAlign: "center", letterSpacing: 0.7 }}>
                GUÍA DE POSICIÓN
              </div>
            </div>
            {/* Selector frente/espalda */}
            <div style={{ display: "flex", gap: 14, marginBottom: 13 }}>
              <button
                style={{
                  background: isFront ? "#222" : "#eee",
                  color: isFront ? "#fff" : "#333",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 22px",
                  cursor: "pointer",
                  fontSize: 15,
                  boxShadow: isFront ? "0 2px 8px #0002" : "none"
                }}
                onClick={() => setIsFront(true)}
              >Frente</button>
              <button
                style={{
                  background: !isFront ? "#222" : "#eee",
                  color: !isFront ? "#fff" : "#333",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 22px",
                  cursor: "pointer",
                  fontSize: 15,
                  boxShadow: !isFront ? "0 2px 8px #0002" : "none"
                }}
                onClick={() => setIsFront(false)}
              >Espalda</button>
            </div>
            {/* Input para subir diseño */}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleModalImage}
              style={{
                background: "#eee",
                borderRadius: 9,
                padding: 10,
                fontSize: 15,
                margin: "12px 0 8px 0",
                width: "95%",
              }}
            />
            <div style={{ color: "#999", fontSize: 15, textAlign: "center", marginBottom: 18, marginTop: 2 }}>
              Prueba diferentes posiciones para ver cómo se verá tu diseño impreso.
            </div>
            {/* Mockup + diseño draggable */}
            <div
              style={{
                position: "relative",
                width: mockupWidth,
                height: mockupHeight,
                background: "#f5f5f5",
                marginBottom: 22,
                borderRadius: 14,
                boxShadow: "0 2px 10px #0001",
                overflow: "hidden",
                userSelect: "none"
              }}
            >
              <img
                src={bgMockup}
                alt="Guía frente y reverso"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none"
                }}
                draggable={false}
              />
              {/* Si hay imagen, la puede mover y escalar */}
              {modalImage && (
                <div
                  style={{
                    position: "absolute",
                    top: position.y,
                    left: position.x,
                    width: size.w,
                    height: size.h,
                    cursor: dragging ? "grabbing" : "grab",
                    zIndex: 3,
                  }}
                  onMouseDown={startDrag}
                >
                  <img
                    src={modalImage}
                    alt="diseño"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                    draggable={false}
                  />
                  {/* Esquina inferior derecha para redimensionar */}
                  <div
                    style={{
                      position: "absolute",
                      right: -12,
                      bottom: -12,
                      width: 18,
                      height: 18,
                      background: "#fff",
                      border: "2px solid #aaa",
                      borderRadius: "50%",
                      cursor: "nwse-resize",
                      zIndex: 4
                    }}
                    onMouseDown={e => handleResize(e, "br")}
                  ></div>
                </div>
              )}
            </div>
            {/* Canvas oculto para la textura */}
            <canvas
              ref={canvasRef}
              width={mockupWidth}
              height={mockupHeight}
              style={{ display: "none" }}
            />
            {modalImage && (
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "#60d66a",
                  color: "#fff",
                  padding: "12px 30px",
                  borderRadius: 9,
                  fontWeight: 700,
                  border: "none",
                  fontSize: 17,
                  marginTop: 7,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer"
                }}
              >
                <FiCheck /> Aplicar diseño a la playera
              </button>
            )}
          </div>
        </div>
      )}

      {/* CANVAS 3D */}
      <div style={{ flex: 1, height: "100vh" }}>
        <Canvas
          camera={{
            position: [0, 0.28, 1.38],
            fov: 36,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[0, 1.5, 2]} intensity={0.95} />
          <Suspense fallback={<Html><span style={{ color: "#fff" }}>Cargando playera 3D...</span></Html>}>
            <Playera
              color={color}
              designTexture={designTexture}
              positionY={-0.6}
              scale={1}
            />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 2.1}
            maxPolarAngle={Math.PI / 1.23}
            minDistance={1}
            maxDistance={2.15}
            target={[0.2, 0.65, 0]}
          />
        </Canvas>
      </div>
    </div>
  );
}
