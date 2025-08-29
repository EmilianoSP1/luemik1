import React, { useRef, useState } from "react";
import { FiUpload, FiTrash2, FiRotateCw, FiDownload, FiArchive } from "react-icons/fi";

// ---- Mockups disponibles (ajusta la ruta a tus archivos locales) ----
const rutasMockup = {
  blanca: {
    frente: "/img/mackups2D/blanca_delante.png",
    reverso: "/img/mackups2D/blanca_atras.png",
  },
  negra: {
    frente: "/img/mackups2D/negra_delante.png",
    reverso: "/img/mackups2D/negra_atras.png",
  },
};

export default function Crear2D() {
  // ---- ESTADOS PRINCIPALES ----
  const [color, setColor] = useState("blanca");
  const [bgColor, setBgColor] = useState("#191921");
  const [playeraActiva, setPlayeraActiva] = useState("frente");
  const [designs, setDesigns] = useState([]);
  const [resizeId, setResizeId] = useState(null);
  const [rotatingId, setRotatingId] = useState(null);
  const fileInputRef = useRef();
  const mockupSize = { w: 420, h: 470 }; // tamaño visual del contenedor

  // ---------- Utilidades ----------
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // para evitar taint si usas CDN con CORS
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Calcula dimensiones "contain" (como object-fit: contain), centradas
  const computeContain = (imgW, imgH, boxW, boxH) => {
    const r = Math.min(boxW / imgW, boxH / imgH);
    const w = imgW * r;
    const h = imgH * r;
    return { w, h };
  };
// Dibuja el mockup + diseños de un lado en canvas (doble resolución)
const renderSide = async (lado) => {
  const cw = mockupSize.w * 2;
  const ch = mockupSize.h * 2;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");

  // Fondo global (para que coincida con la página)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);

  // 1) Mockup base con "contain"
  const base = await loadImage(rutasMockup[color][lado]);
  const baseDims = computeContain(base.width, base.height, cw, ch);
  const baseX = (cw - baseDims.w) / 2;
  const baseY = (ch - baseDims.h) / 2;
  ctx.drawImage(base, baseX, baseY, baseDims.w, baseDims.h);

  // 2) Diseños
  const list = designs.filter((d) => d.playera === lado);

  // 👇 Blend dinámico SOLO para la exportación
  // - Blanca: multiply (como antes)
  // - Negra: screen (realza color sobre fondo oscuro)
  const blendMode = color === "negra" ? "screen" : "multiply";
  const blendAlpha = color === "negra" ? 0.98 : 0.92;

  for (const d of list) {
    const dImg = await loadImage(d.url);

    // caja en pixeles del canvas (doble resolución)
    const boxW = d.w * 2;
    const boxH = d.h * 2;
    const centerX = (d.x + d.w / 2) * 2;
    const centerY = (d.y + d.h / 2) * 2;

    // dimensiones contain del diseño dentro de su caja
    const fit = computeContain(dImg.width, dImg.height, boxW, boxH);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(((d.rotation || 0) * Math.PI) / 180);
    ctx.globalAlpha = blendAlpha;
    ctx.globalCompositeOperation = blendMode; // <- aquí el cambio

    // dibuja centrado (como object-fit: contain)
    ctx.drawImage(dImg, -fit.w / 2, -fit.h / 2, fit.w, fit.h);

    // restaurar para no “contaminar” lo siguiente
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  return canvas;
};


  // ---- DESCARGAR PNG (frente + reverso tal cual se ven) ----
  const downloadPNGAmbas = async () => {
    const spacingCSS = 78;              // el gap que ves en pantalla
    const spacing = spacingCSS * 2;     // doble resolución

    const front = await renderSide("frente");
    const back = await renderSide("reverso");

    const out = document.createElement("canvas");
    out.width = front.width + spacing + back.width;
    out.height = Math.max(front.height, back.height);
    const ctx = out.getContext("2d");

    // fondo igual al de la página
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, out.width, out.height);

    ctx.drawImage(front, 0, 0);
    ctx.drawImage(back, front.width + spacing, 0);

    const url = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "diseno-luemik-mockup.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ---- DESCARGAR ZIP (frente.png + reverso.png) ----
  const downloadZIP = async () => {
    // Carga JSZip on-demand
    const ensureJSZip = () =>
      new Promise((resolve, reject) => {
        if (window.JSZip) return resolve(window.JSZip);
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        s.onload = () => resolve(window.JSZip);
        s.onerror = reject;
        document.head.appendChild(s);
      });

    const front = await renderSide("frente");
    const back = await renderSide("reverso");

    const [frontBlob, backBlob] = await Promise.all([
      new Promise((r) => front.toBlob(r, "image/png")),
      new Promise((r) => back.toBlob(r, "image/png")),
    ]);

    try {
      const JSZip = await ensureJSZip();
      const zip = new JSZip();
      zip.file("frente.png", frontBlob);
      zip.file("reverso.png", backBlob);

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `luemik-disenos-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      // Respaldo: si falla ZIP, descarga ambos PNG sueltos
      const a1 = document.createElement("a");
      a1.href = URL.createObjectURL(frontBlob);
      a1.download = "frente.png";
      document.body.appendChild(a1);
      a1.click();
      a1.remove();

      const a2 = document.createElement("a");
      a2.href = URL.createObjectURL(backBlob);
      a2.download = "reverso.png";
      document.body.appendChild(a2);
      a2.click();
      a2.remove();
    }
  };

  // ---- SUBIR ARCHIVOS ----
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const nuevos = files.map((file, i) => ({
      id: Date.now() + Math.random() + i,
      url: URL.createObjectURL(file),
      x: 90, y: 95, w: 220, h: 140,
      rotation: 0,
      playera: playeraActiva,
      selected: false,
    }));
    setDesigns((prev) => [
      ...prev.map((d) => ({ ...d, selected: false })),
      ...nuevos,
    ]);
    e.target.value = "";
  };

  // ---- SELECCIÓN ----
  const selectDesign = (id) => {
    setDesigns((prev) => prev.map((d) => ({ ...d, selected: d.id === id })));
  };
  const deselectAll = (e) => {
    if (
      e.target.dataset.tipo !== "design" &&
      e.target.dataset.tipo !== "handle" &&
      e.target.dataset.tipo !== "rotate"
    ) {
      setDesigns((prev) => prev.map((d) => ({ ...d, selected: false })));
    }
  };

  // ---- DRAG ----
  const dragInfo = useRef({ id: null, startX: 0, startY: 0 });
  const onDragStart = (id, e) => {
    dragInfo.current.id = id;
    dragInfo.current.startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    dragInfo.current.startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", onDragEnd);
  };
  const onDrag = (e) => {
    if (!dragInfo.current.id) return;
    const x = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const y = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    const dx = x - dragInfo.current.startX;
    const dy = y - dragInfo.current.startY;
    dragInfo.current.startX = x;
    dragInfo.current.startY = y;
    setDesigns((prev) =>
      prev.map((d) =>
        d.id === dragInfo.current.id
          ? {
              ...d,
              x: Math.max(0, Math.min(mockupSize.w - d.w, d.x + dx)),
              y: Math.max(0, Math.min(mockupSize.h - d.h, d.y + dy)),
            }
          : d
      )
    );
  };
  const onDragEnd = () => {
    dragInfo.current.id = null;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", onDragEnd);
  };

  // ---- RESIZE ----
  const resizeInfo = useRef({ id: null, startX: 0, startY: 0, w: 0, h: 0 });
  const onResizeStart = (id, e) => {
    e.stopPropagation();
    setResizeId(id);
    resizeInfo.current.id = id;
    resizeInfo.current.startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    resizeInfo.current.startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    const d = designs.find((d) => d.id === id);
    resizeInfo.current.w = d.w;
    resizeInfo.current.h = d.h;
    document.addEventListener("mousemove", onResize);
    document.addEventListener("mouseup", onResizeEnd);
    document.addEventListener("touchmove", onResize);
    document.addEventListener("touchend", onResizeEnd);
  };
  const onResize = (e) => {
    if (!resizeInfo.current.id) return;
    const x = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const y = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    const dx = x - resizeInfo.current.startX;
    const dy = y - resizeInfo.current.startY;
    setDesigns((prev) =>
      prev.map((d) =>
        d.id === resizeInfo.current.id
          ? {
              ...d,
              w: Math.max(40, Math.min(mockupSize.w - d.x, resizeInfo.current.w + dx)),
              h: Math.max(32, Math.min(mockupSize.h - d.y, resizeInfo.current.h + dy)),
            }
          : d
      )
    );
  };
  const onResizeEnd = () => {
    setResizeId(null);
    resizeInfo.current.id = null;
    document.removeEventListener("mousemove", onResize);
    document.removeEventListener("mouseup", onResizeEnd);
    document.removeEventListener("touchmove", onResize);
    document.removeEventListener("touchend", onResizeEnd);
  };

  // ---- ROTATE ----
  const rotateInfo = useRef({ id: null, centerX: 0, centerY: 0, startAngle: 0, initAngle: 0 });
  const onRotateStart = (id, e) => {
    e.stopPropagation();
    setRotatingId(id);
    const rect = e.target.parentNode.getBoundingClientRect();
    rotateInfo.current.id = id;
    rotateInfo.current.centerX = rect.left + rect.width / 2;
    rotateInfo.current.centerY = rect.top + rect.height / 2;
    const d = designs.find((d) => d.id === id);
    rotateInfo.current.initAngle = d.rotation || 0;
    const x = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const y = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    rotateInfo.current.startAngle =
      (Math.atan2(y - rotateInfo.current.centerY, x - rotateInfo.current.centerX) * 180) /
        Math.PI -
      (d.rotation || 0);
    document.addEventListener("mousemove", onRotate);
    document.addEventListener("mouseup", onRotateEnd);
    document.addEventListener("touchmove", onRotate);
    document.addEventListener("touchend", onRotateEnd);
  };
  const onRotate = (e) => {
    if (!rotateInfo.current.id) return;
    const x = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const y = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    const angle =
      (Math.atan2(y - rotateInfo.current.centerY, x - rotateInfo.current.centerX) * 180) /
        Math.PI -
      rotateInfo.current.startAngle;
    setDesigns((prev) =>
      prev.map((d) => (d.id === rotateInfo.current.id ? { ...d, rotation: angle } : d))
    );
  };
  const onRotateEnd = () => {
    setRotatingId(null);
    rotateInfo.current.id = null;
    document.removeEventListener("mousemove", onRotate);
    document.removeEventListener("mouseup", onRotateEnd);
    document.removeEventListener("touchmove", onRotate);
    document.removeEventListener("touchend", onRotateEnd);
  };

  // ---- ELIMINAR ----
  const removeDesign = (id) => {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  };

  // ---- RENDER PRINCIPAL ----
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={deselectAll}
      onTouchStart={deselectAll}
    >
      {/* ===== BOTONES DESCARGA ARRIBA DERECHA ===== */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 38,
          zIndex: 222,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={downloadPNGAmbas}
          style={{
            background: "#19193d",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "13px 18px",
            fontWeight: 700,
            fontSize: 16.5,
            cursor: "pointer",
            boxShadow: "0 2px 20px #0003",
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background .2s",
          }}
          title="Descarga una sola imagen con frente y reverso tal como se ven"
        >
          <FiDownload style={{ marginRight: 2 }} /> Descargar PNG
        </button>
        <button
          onClick={downloadZIP}
          style={{
            background: "#23234a",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "13px 18px",
            fontWeight: 700,
            fontSize: 16.5,
            cursor: "pointer",
            boxShadow: "0 2px 20px #0003",
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background .2s",
          }}
          title="Genera un ZIP con frente.png y reverso.png"
        >
          <FiArchive style={{ marginRight: 2 }} /> Descargar ZIP
        </button>
      </div>

      {/* ===== PANEL IZQUIERDO (CONFIGURACIONES) ===== */}
      <div
        style={{
          width: 340,
          background: "#23233a",
          borderRadius: 24,
          padding: "38px 34px 32px 34px",
          boxShadow: "0 2px 36px #0009",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          alignItems: "center",
          position: "relative",
          marginRight: 48,
        }}
      >
        {/* SUBIR DISEÑO */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            borderRadius: 32,
            background: "#212124",
            color: "#fff",
            fontWeight: 600,
            fontSize: 21,
            border: "none",
            padding: "18px 0",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxShadow: "0 2px 20px #0005",
            cursor: "pointer",
            letterSpacing: 0.2,
          }}
        >
          <span>Sube tu diseño</span>
          <FiUpload size={24} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* SELECTOR PLAYERA ACTIVA */}
        <div style={{ margin: "13px 0 11px 0", fontWeight: 600, fontSize: 16, alignSelf: "flex-start" }}>
          Playera activa
        </div>
        <div style={{ display: "flex", gap: 18, marginBottom: 7 }}>
          <button
            onClick={() => setPlayeraActiva("frente")}
            style={{
              border: playeraActiva === "frente" ? "2.2px solid #6c7bfa" : "2.2px solid #777",
              background: "#fff",
              color: "#111",
              padding: "6px 18px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 17,
              cursor: "pointer",
            }}
          >
            Frente
          </button>
          <button
            onClick={() => setPlayeraActiva("reverso")}
            style={{
              border: playeraActiva === "reverso" ? "2.2px solid #6c7bfa" : "2.2px solid #777",
              background: "#fff",
              color: "#111",
              padding: "6px 18px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 17,
              cursor: "pointer",
            }}
          >
            Reverso
          </button>
        </div>

        {/* SELECTOR COLOR PLAYERA */}
        <div style={{ fontWeight: 600, marginBottom: 7, alignSelf: "flex-start" }}>Color de playera</div>
        <div style={{ display: "flex", gap: 22, marginBottom: 7 }}>
          <button
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: color === "blanca" ? "2.2px solid #6c7bfa" : "2.2px solid #777",
              background: "#fff",
              boxShadow: "0 0 4px #0002",
              cursor: "pointer"
            }}
            onClick={() => setColor("blanca")}
            title="Playera blanca"
          ></button>
          <button
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: color === "negra" ? "2.2px solid #6c7bfa" : "2.2px solid #777",
              background: "#232325",
              boxShadow: "0 0 4px #0002",
              cursor: "pointer"
            }}
            onClick={() => setColor("negra")}
            title="Playera negra"
          ></button>
        </div>

        {/* SELECTOR FONDO */}
        <div style={{ fontWeight: 600, marginBottom: 8, alignSelf: "flex-start" }}>Fondo global</div>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          style={{
            width: 38, height: 38, borderRadius: 8,
            border: "none", marginBottom: 18, cursor: "pointer"
          }}
        />

        {/* TEXTO AYUDA */}
        <div style={{
          fontSize: 15.2, color: "#f4f4f8", opacity: 0.85, marginTop: 7,
          fontWeight: 400, textAlign: "left"
        }}>
          Puedes cargar varias imágenes <b>PNG</b> o <b>JPG</b>.<br />
          Selecciona la playera (frente o reverso) antes de subir cada diseño.<br />
          Cada imagen puede moverse, escalarse y rotarse.<br />
          <span style={{ color: "#a7a8bc" }}>(Mejor si tiene fondo transparente).</span>
        </div>
      </div>

      {/* ===== MOCKUPS PLAYERA FRENTE/REVERSO ===== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 78,
        }}
      >
        {/* ---- PLAYERA FRENTE ---- */}
        <div
          style={{
            width: mockupSize.w,
            height: mockupSize.h,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: playeraActiva === "frente" ? "#40409022" : "transparent",
            borderRadius: 18,
            boxShadow: playeraActiva === "frente" ? "0 0 20px #5e7bfa55" : "none",
            border: playeraActiva === "frente" ? "2px solid #6c7bfa88" : "none",
            transition: "box-shadow 0.2s, border 0.2s",
            cursor: "pointer"
          }}
          onClick={() => setPlayeraActiva("frente")}
        >
          {/* Mockup base */}
          <img
            src={rutasMockup[color].frente}
            alt="Playera frente"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              userSelect: "none",
              pointerEvents: "none"
            }}
            draggable={false}
          />
          {/* Diseños */}
          {designs
            .filter((d) => d.playera === "frente")
            .map((d, idx) => (
              <div
                key={d.id}
                style={{
                  position: "absolute",
                  left: d.x,
                  top: d.y,
                  width: d.w,
                  height: d.h,
                  zIndex: d.selected ? 3 : 2,
                  cursor: d.selected ? (resizeId === d.id ? "nwse-resize" : "move") : "pointer",
                  border: d.selected ? "2px solid #6c7bfa" : "none",
                  borderRadius: 8,
                  background: d.selected ? "rgba(60,70,150,0.09)" : "transparent",
                  boxSizing: "border-box",
                  boxShadow: d.selected ? "0 0 8px #6c7bfa99" : "none",
                  transform: `rotate(${d.rotation || 0}deg)`,
                }}
                data-tipo="design"
                onMouseDown={e => { e.stopPropagation(); selectDesign(d.id); onDragStart(d.id, e); }}
                onTouchStart={e => { e.stopPropagation(); selectDesign(d.id); onDragStart(d.id, e); }}
                onClick={e => { e.stopPropagation(); selectDesign(d.id); }}
              >
                <img
                  src={d.url}
                  alt={`diseño-${idx}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: 0.92,
                    mixBlendMode: "multiply",
                    userSelect: "none",
                    pointerEvents: "none"
                  }}
                  draggable={false}
                />
                {d.selected && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: -27,
                        transform: "translateX(-50%)",
                        width: 27,
                        height: 27,
                        borderRadius: "50%",
                        background: "#111b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 6px #1a1a3342",
                        cursor: "grab"
                      }}
                      data-tipo="rotate"
                      onMouseDown={e => onRotateStart(d.id, e)}
                      onTouchStart={e => onRotateStart(d.id, e)}
                    >
                      <FiRotateCw color="#6c7bfa" size={18} />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: -15,
                        bottom: -15,
                        width: 21, height: 21, borderRadius: "50%",
                        background: "#fff",
                        border: "2.2px solid #6c7bfa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 6px #1a1a3342",
                        cursor: "nwse-resize"
                      }}
                      data-tipo="handle"
                      onMouseDown={e => onResizeStart(d.id, e)}
                      onTouchStart={e => onResizeStart(d.id, e)}
                    >
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#6c7bfa" }} />
                    </div>
                    <button
                      style={{
                        position: "absolute",
                        left: -35,
                        top: -17,
                        background: "#b44",
                        color: "#fff",
                        border: "none",
                        borderRadius: 7,
                        padding: 7,
                        fontSize: 14,
                        cursor: "pointer",
                        boxShadow: "0 1px 6px #1a1a3342",
                        zIndex: 12,
                      }}
                      title="Eliminar"
                      onClick={e => { e.stopPropagation(); removeDesign(d.id); }}
                    >
                      <FiTrash2 />
                    </button>
                  </>
                )}
              </div>
            ))}
        </div>

        {/* ---- PLAYERA REVERSO ---- */}
        <div
          style={{
            width: mockupSize.w,
            height: mockupSize.h,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: playeraActiva === "reverso" ? "#40409022" : "transparent",
            borderRadius: 18,
            boxShadow: playeraActiva === "reverso" ? "0 0 20px #5e7bfa55" : "none",
            border: playeraActiva === "reverso" ? "2px solid #6c7bfa88" : "none",
            transition: "box-shadow 0.2s, border 0.2s",
            cursor: "pointer"
          }}
          onClick={() => setPlayeraActiva("reverso")}
        >
          <img
            src={rutasMockup[color].reverso}
            alt="Playera reverso"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              userSelect: "none",
              pointerEvents: "none"
            }}
            draggable={false}
          />
          {designs
            .filter((d) => d.playera === "reverso")
            .map((d, idx) => (
              <div
                key={d.id}
                style={{
                  position: "absolute",
                  left: d.x,
                  top: d.y,
                  width: d.w,
                  height: d.h,
                  zIndex: d.selected ? 3 : 2,
                  cursor: d.selected ? (resizeId === d.id ? "nwse-resize" : "move") : "pointer",
                  border: d.selected ? "2px solid #6c7bfa" : "none",
                  borderRadius: 8,
                  background: d.selected ? "rgba(60,70,150,0.09)" : "transparent",
                  boxSizing: "border-box",
                  boxShadow: d.selected ? "0 0 8px #6c7bfa99" : "none",
                  transform: `rotate(${d.rotation || 0}deg)`,
                }}
                data-tipo="design"
                onMouseDown={e => { e.stopPropagation(); selectDesign(d.id); onDragStart(d.id, e); }}
                onTouchStart={e => { e.stopPropagation(); selectDesign(d.id); onDragStart(d.id, e); }}
                onClick={e => { e.stopPropagation(); selectDesign(d.id); }}
              >
                <img
                  src={d.url}
                  alt={`diseño-${idx}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: 0.92,
                    mixBlendMode: "multiply",
                    userSelect: "none",
                    pointerEvents: "none"
                  }}
                  draggable={false}
                />
                {d.selected && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: -27,
                        transform: "translateX(-50%)",
                        width: 27, height: 27, borderRadius: "50%",
                        background: "#111b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 6px #1a1a3342", cursor: "grab"
                      }}
                      data-tipo="rotate"
                      onMouseDown={e => onRotateStart(d.id, e)}
                      onTouchStart={e => onRotateStart(d.id, e)}
                    >
                      <FiRotateCw color="#6c7bfa" size={18} />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: -15, bottom: -15,
                        width: 21, height: 21, borderRadius: "50%",
                        background: "#fff", border: "2.2px solid #6c7bfa",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 6px #1a1a3342", cursor: "nwse-resize"
                      }}
                      data-tipo="handle"
                      onMouseDown={e => onResizeStart(d.id, e)}
                      onTouchStart={e => onResizeStart(d.id, e)}
                    >
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#6c7bfa" }} />
                    </div>
                    <button
                      style={{
                        position: "absolute",
                        left: -35, top: -17,
                        background: "#b44", color: "#fff",
                        border: "none", borderRadius: 7, padding: 7, fontSize: 14,
                        cursor: "pointer", boxShadow: "0 1px 6px #1a1a3342", zIndex: 12
                      }}
                      title="Eliminar"
                      onClick={e => { e.stopPropagation(); removeDesign(d.id); }}
                    >
                      <FiTrash2 />
                    </button>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
