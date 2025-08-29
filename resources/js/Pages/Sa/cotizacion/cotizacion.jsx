// resources/js/Pages/Sa/cotizacion/cotizacion.jsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown, FiChevronRight, FiPlus, FiTrash2, FiSave,
  FiPrinter, FiDownload, FiSearch, FiSettings, FiInfo
} from 'react-icons/fi';
import HeaderAdmin from '@/Pages/Sa/headeradmin.jsx';

/* ===================== Utilidades ===================== */
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
};
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round2 = (v) => Math.round(v * 100) / 100;

/* ===================== Constantes negocio ===================== */
// Consumo típico por diseño 34x32 cm en rollo 60 cm ≈ 0.34 m por prenda
const DEFAULT_DTF_CONSUMO_M = 0.34;

// Envío por pedido del proveedor (se prorratea por pzas si activas el switch)
const DEFAULT_ENVIO_PROV = {
  'MAMMON': 190,
  'Player Tlax': 200,
  'Say México': 400,
  'Essenza': 200,
};

// Mapa de etiquetas visibles para proveedores (alias -> clave real)
const PROVIDER_LABELS = {
  'MAMMON': 'MAMMON BLANKS',
  'Player Tlax': 'Player Tlax',
  'Say México': 'Say México',
  'Essenza': 'Essenza',
};

/* ===================== Catálogo ===================== */
const CATALOG = [
  // ---------- MAMMON ----------
  {
    proveedor: 'MAMMON',
    items: [
      { tipo: 'playera', nombre: 'Playera Oversize 220g Algodón (S–XL)', tiers: [{ label: 'Por pieza', price: 145 }, { label: '12 pzas', price: 99 }] },
      { tipo: 'playera', nombre: 'Playera Oversize 300g Algodón (S–XL)', tiers: [{ label: 'Por pieza', price: 230 }, { label: '12 pzas', price: 180 }] },
      { tipo: 'playera', nombre: 'Playera Premium 250g Algodón (S–XL)', tiers: [{ label: 'Por pieza', price: 195 }, { label: '12 pzas', price: 155 }] },
      { tipo: 'playera', nombre: 'Playera Oversize 240g Poliéster (S–XL)', tiers: [{ label: 'Por pieza', price: 135 }] },
      { tipo: 'polo',     nombre: 'Playera tipo polo 250g Algodón (S–XL)', tiers: [{ label: 'Por pieza', price: 255 }, { label: '10 pzas', price: 199 }] },
      { tipo: 'sudadera', nombre: 'Sudadera Oversize 400g Algodón (S–XL)', tiers: [{ label: 'Por pieza', price: 350 }, { label: '10 pzas', price: 280 }] },
    ],
  },

  // ---------- Player Tlax ----------
  {
    proveedor: 'Player Tlax',
    items: [
      // Oversize
      { tipo: 'playera', nombre: 'Oversize 220g COLOR (S-M-L)',  tiers: [{ label: '30 pzas', price: 60 }, { label: 'Por pieza', price: 70 }] },
      { tipo: 'playera', nombre: 'Oversize 220g COLOR (XL-XXL)', tiers: [{ label: '30 pzas', price: 65 }, { label: 'Por pieza', price: 75 }] },
      { tipo: 'playera', nombre: 'Oversize 220g BLANCO (S-M-L)', tiers: [{ label: '30 pzas', price: 55 }, { label: 'Por pieza', price: 65 }] },
      { tipo: 'playera', nombre: 'Oversize 220g BLANCO (XL-XXL)',tiers: [{ label: '30 pzas', price: 60 }, { label: 'Por pieza', price: 70 }] },
      // Despintada
      { tipo: 'playera', nombre: 'Oversize 220g DESPINTADA (S-M-L)',  tiers: [{ label: '30 pzas', price: 80 }, { label: 'Por pieza', price: 90 }] },
      { tipo: 'playera', nombre: 'Oversize 220g DESPINTADA (XL-XXL)', tiers: [{ label: '30 pzas', price: 85 }, { label: 'Por pieza', price: 795 }] },

      // Regular COLOR 190g por talla
      { tipo: 'playera', nombre: 'Regular COLOR 190g (S)',  tiers: [{ label: '30 pzas', price: 33 }, { label: 'Por pieza', price: 38 }] },
      { tipo: 'playera', nombre: 'Regular COLOR 190g (M)',  tiers: [{ label: '30 pzas', price: 35 }, { label: 'Por pieza', price: 40 }] },
      { tipo: 'playera', nombre: 'Regular COLOR 190g (L)',  tiers: [{ label: '30 pzas', price: 37 }, { label: 'Por pieza', price: 42 }] },
      { tipo: 'playera', nombre: 'Regular COLOR 190g (XL)', tiers: [{ label: '30 pzas', price: 40 }, { label: 'Por pieza', price: 45 }] },

      // Regular BLANCO 190g por talla
      { tipo: 'playera', nombre: 'Regular BLANCO 190g (S)',  tiers: [{ label: '30 pzas', price: 27 }, { label: 'Por pieza', price: 32 }] },
      { tipo: 'playera', nombre: 'Regular BLANCO 190g (M)',  tiers: [{ label: '30 pzas', price: 29 }, { label: 'Por pieza', price: 34 }] },
      { tipo: 'playera', nombre: 'Regular BLANCO 190g (L)',  tiers: [{ label: '30 pzas', price: 32 }, { label: 'Por pieza', price: 37 }] },
      { tipo: 'playera', nombre: 'Regular BLANCO 190g (XL)', tiers: [{ label: '30 pzas', price: 28 }, { label: 'Por pieza', price: 39 }] },

      // Regular 180g 50/50 COLOR por talla
      { tipo: 'playera', nombre: 'Regular 180g 50/50 COLOR (S)',  tiers: [{ label: '30 pzas', price: 27 }, { label: 'Por pieza', price: 32 }] },
      { tipo: 'playera', nombre: 'Regular 180g 50/50 COLOR (M)',  tiers: [{ label: '30 pzas', price: 29 }, { label: 'Por pieza', price: 34 }] },
      { tipo: 'playera', nombre: 'Regular 180g 50/50 COLOR (L)',  tiers: [{ label: '30 pzas', price: 31 }, { label: 'Por pieza', price: 36 }] },
      { tipo: 'playera', nombre: 'Regular 180g 50/50 COLOR (XL)', tiers: [{ label: '30 pzas', price: 34 }, { label: 'Por pieza', price: 40 }] },

      // Regular 180g 50/50 BLANCO por talla
      { tipo: 'playera', nombre: 'Regular 180g 50/50 BLANCO (S)',  tiers: [{ label: '30 pzas', price: 22 }, { label: 'Por pieza', price: 27 }] },
      { tipo: 'playera', nombre: 'Regular 180g 50/50 BLANCO (M)',  tiers: [{ label: '30 pzas', price: 24 }, { label: 'Por pieza', price: 29 }] },
      { tipo: 'playera', nombre: 'Regular 180g 50/50 BLANCO (L)',  tiers: [{ label: '30 pzas', price: 26 }, { label: 'Por pieza', price: 31 }] },
      { tipo: 'playera', nombre: 'Regular 180g 50/50 BLANCO (XL)', tiers: [{ label: '30 pzas', price: 28 }, { label: 'Por pieza', price: 32 }] },

      // Kids COLOR
      { tipo: 'playera', nombre: 'Regular Kids 195g COLOR (S)',  tiers: [{ label: '30 pzas', price: 19 },  { label: 'Por pieza', price: 24.5 }] },
      { tipo: 'playera', nombre: 'Regular Kids 195g COLOR (M)',  tiers: [{ label: '30 pzas', price: 22 },  { label: 'Por pieza', price: 27 }] },
      { tipo: 'playera', nombre: 'Regular Kids 195g COLOR (L)',  tiers: [{ label: '30 pzas', price: 23.5 },{ label: 'Por pieza', price: 28.5 }] },
      { tipo: 'playera', nombre: 'Regular Kids 195g COLOR (XL)', tiers: [{ label: '30 pzas', price: 26 },  { label: 'Por pieza', price: 31 }] },

      // Kids BLANCO
      { tipo: 'playera', nombre: 'Regular Kids 195g BLANCO (S)',  tiers: [{ label: '30 pzas', price: 17 }, { label: 'Por pieza', price: 22 }] },
      { tipo: 'playera', nombre: 'Regular Kids 195g BLANCO (M)',  tiers: [{ label: '30 pzas', price: 18 }, { label: 'Por pieza', price: 23 }] },
      { tipo: 'playera', nombre: 'Regular Kids 195g BLANCO (L)',  tiers: [{ label: '30 pzas', price: 20 }, { label: 'Por pieza', price: 25 }] },
      { tipo: 'playera', nombre: 'Regular Kids 195g BLANCO (XL)', tiers: [{ label: '30 pzas', price: 21 }, { label: 'Por pieza', price: 26 }] },

      // Sudaderas
      { tipo: 'sudadera', nombre: 'Sudadera 50/50 (S-M-L)', tiers: [{ label: '30 pzas', price: 100 }, { label: 'Por pieza', price: 110 }] },
      { tipo: 'sudadera', nombre: 'Sudadera 50/50 (XL)',    tiers: [{ label: '30 pzas', price: 105 }, { label: 'Por pieza', price: 115 }] },
    ],
  },

  // ---------- Say México (AMPLIADO) ----------
  {
    proveedor: 'Say México',
    items: [
      // REGULAR
      { tipo: 'playera', nombre: 'Playera regular Algodón 180g (S–L)', tiers: [
        { label: '12 pzas', price: 100 }, { label: '6 pzas', price: 110 }, { label: '3-5 pzas', price: 120 }, { label: '1-2 pzas', price: 130 }, { label: '100 pzas', price: 95 }
      ]},
      { tipo: 'playera', nombre: 'Playera regular Algodón 220g (S–L)', tiers: [
        { label: '12 pzas', price: 125 }, { label: '6 pzas', price: 135 }, { label: '3-5 pzas', price: 145 }, { label: '1-2 pzas', price: 155 }, { label: '100 pzas', price: 120 }
      ]},
      { tipo: 'playera', nombre: 'Playera regular Algodón 250g (S–L)', tiers: [
        { label: '12 pzas', price: 155 }, { label: '6 pzas', price: 165 }, { label: '3-5 pzas', price: 175 }, { label: '1-2 pzas', price: 185 }, { label: '100 pzas', price: 150 }
      ]},

      // OVERSIZE
      { tipo: 'playera', nombre: 'Playera Oversize Algodón 180g (S–L)', tiers: [
        { label: '12 pzas', price: 100 }, { label: '6 pzas', price: 110 }, { label: '3-5 pzas', price: 120 }, { label: '1-2 pzas', price: 130 }, { label: '100 pzas', price: 95 }
      ]},
      { tipo: 'playera', nombre: 'Playera Oversize Algodón 220g (S–L)', tiers: [
        { label: '12 pzas', price: 125 }, { label: '6 pzas', price: 135 }, { label: '3-5 pzas', price: 145 }, { label: '1-2 pzas', price: 155 }, { label: '100 pzas', price: 120 }
      ]},
      { tipo: 'playera', nombre: 'Playera Oversize Algodón 250g (S–L)', tiers: [
        { label: '12 pzas', price: 155 }, { label: '6 pzas', price: 165 }, { label: '3-5 pzas', price: 175 }, { label: '1-2 pzas', price: 185 }, { label: '100 pzas', price: 150 }
      ]},

      // MANGA
      { tipo: 'playera', nombre: 'Playera Manga Algodón 180g (S–L)', tiers: [
        { label: '12 pzas', price: 100 }, { label: '6 pzas', price: 110 }, { label: '3-5 pzas', price: 120 }, { label: '1-2 pzas', price: 130 }, { label: '100 pzas', price: 95 }
      ]},
      { tipo: 'playera', nombre: 'Playera Manga Algodón 220g (S–L)', tiers: [
        { label: '12 pzas', price: 125 }, { label: '6 pzas', price: 135 }, { label: '3-5 pzas', price: 145 }, { label: '1-2 pzas', price: 155 }, { label: '100 pzas', price: 120 }
      ]},
      { tipo: 'playera', nombre: 'Playera Manga Algodón 250g (S–L)', tiers: [
        { label: '12 pzas', price: 155 }, { label: '6 pzas', price: 165 }, { label: '3-5 pzas', price: 175 }, { label: '1-2 pzas', price: 185 }, { label: '100 pzas', price: 150 }
      ]},

      // BOXIFIT
      { tipo: 'playera', nombre: 'Playera BoxiFit Algodón 180g (S–L)', tiers: [
        { label: '12 pzas', price: 100 }, { label: '6 pzas', price: 110 }, { label: '3-5 pzas', price: 120 }, { label: '1-2 pzas', price: 130 }, { label: '100 pzas', price: 95 }
      ]},
      { tipo: 'playera', nombre: 'Playera BoxiFit Algodón 220g (S–L)', tiers: [
        { label: '12 pzas', price: 125 }, { label: '6 pzas', price: 135 }, { label: '3-5 pzas', price: 145 }, { label: '1-2 pzas', price: 155 }, { label: '100 pzas', price: 120 }
      ]},
      { tipo: 'playera', nombre: 'Playera BoxiFit Algodón 250g (S–L)', tiers: [
        { label: '12 pzas', price: 155 }, { label: '6 pzas', price: 165 }, { label: '3-5 pzas', price: 175 }, { label: '1-2 pzas', price: 185 }, { label: '100 pzas', price: 150 }
      ]},
    ],
  },

  // ---------- Essenza ----------
  {
    proveedor: 'Essenza',
    items: [
      { tipo: 'playera', nombre: 'Regular Caballero 180g Algodón (S–XL)', tiers: [
        { label: '1 pza',   price: 79 },
        { label: '1–10',    price: 69 },
        { label: '11–99',   price: 59 },
        { label: '101–999', price: 57 },
        { label: '+1000',   price: 56 },
      ]},
      { tipo: 'playera', nombre: 'Regular Dama 180g Algodón (M–XXL)', tiers: [
        { label: '1 pza',   price: 79 },
        { label: '1–10',    price: 69 },
        { label: '11–99',   price: 59 },
        { label: '101–999', price: 57 },
        { label: '+1000',   price: 56 },
      ]},
    ],
  },
];

/* ===================== Helpers de catálogo y tallas ===================== */
const SIZE_ORDER = ['XS','S','M','L','XL','XXL','3XL','XXXL','4XL','5XL','6XL','7XL','8XL'];

function itemCategoryFrom(it) {
  const s = (it?.nombre || '').toLowerCase();
  if (s.includes('premium')) return 'Premium';
  if (s.includes('oversize')) return 'Oversize';
  if (s.includes('boxifit') || s.includes('boxy')) return 'BoxiFit';
  if (s.includes('manga')) return 'Manga';
  if (it?.tipo === 'polo' || s.includes('polo')) return 'Polo';
  if (s.includes('sudadera') || it?.tipo === 'sudadera') return 'Sudadera';
  return 'Regular';
}

function sizesFromName(name = '') {
  // Busca dentro de paréntesis: (S–XL) | (S-M-L) | (XL-XXL) | etc
  const m = name.match(/\(([^)]+)\)/);
  if (!m) return null;

  const raw = m[1].replace(/\s/g, '').toUpperCase(); // "S–XL" | "S-M-L" | "XL-XXL"
  const dash = raw.includes('–') ? '–' : (raw.includes('-') ? '-' : null);

  if (!dash) {
    const direct = raw.split(/[,/]/).filter(Boolean);
    return direct.length ? direct : null;
  }

  const [a, b] = raw.split(dash);
  if (!a || !b) return null;
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return null;
  const from = Math.min(ia, ib);
  const to   = Math.max(ia, ib);
  return SIZE_ORDER.slice(from, to + 1);
}

/* ===================== Ajustes por defecto ===================== */
const DEFAULT_SETTINGS = {
  // DTF
  dtfModo: 'auto',                // 'auto' | '180' | '150' | '80' | 'otro'
  dtfPrecio180: 180,
  dtfPrecio150: 150,
  dtfConsumoM: DEFAULT_DTF_CONSUMO_M,
  mermaPct: 0,

  // Bolsa + extras
  bolsaUnit: 1,

  // Mano de obra
  includeLabor: true,
  laborTarifaHora: 80,
  laborMinPorUnidad: 6,

  // Overhead luz (DESACTIVADO por defecto)
  includeOverhead: false,
  overheadMode: 'simple', // 'simple' | 'avanzado'
  luzMensual: 236,        // MXN (si algún día activas overhead)

  // Avanzado (bombillas + LED)
  bulbsCount: 7,
  bulbW: 60,              // W aprox por bombilla (25–100w)
  ledW: 12,               // W tira LED
  openHoursPerDay: 8,
  daysPerMonth: 26,

  // Plancha (energía) — se suma en silencio
  pressW: 900,            // W plancha
  pressSecPerUnit: 45,    // s por prenda (DTF)
  kwhPrecio: 3,           // MXN por kWh (ajústalo a tu tarifa)

  produccionMensual: 120, // prendas/mes (para cálculo si activas overhead)

  // Envío prorrateado
  includeEnvio: false,
  envioProv: DEFAULT_ENVIO_PROV,
  envioProrratePct: 78,   // % del envío que sí se traslada al unitario

  // IVA/Descuento
  aplicaIVA: true,
  ivaPct: 16,
  descuentoPct: 0,
};

/* ===================== Collapsible (controlado) ===================== */
function Collapsible({ title, children, defaultOpen=false, right, open: ctrlOpen, onOpenChange }) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = typeof ctrlOpen === 'boolean' ? ctrlOpen : localOpen;
  const setOpen = (v) => {
    if (typeof onOpenChange === 'function') onOpenChange(v);
    else setLocalOpen(v);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 transition flex items-center justify-between"
      >
        <span className="font-medium text-white/90">{title}</span>
        <span className="flex items-center gap-2 text-sm text-white/60">
          {right}
          {open ? <FiChevronDown/> : <FiChevronRight/>}
        </span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

/* ===================== Reglas de tiers (auto por cantidad) ===================== */
function parseTierRule(label) {
  const clean = (label || '').toLowerCase();

  // "+1000"
  let m = clean.match(/\+(\d+)/);
  if (m) return { min: Number(m[1]), max: Infinity };

  // "1–10" u "1-10"
  m = clean.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return { min: Number(m[1]), max: Number(m[2]) };

  // "12 pzas"/"30 pzas"/"10 unidades"
  m = clean.match(/(\d+)\s*(pza|pzas|pieza|piezas|unid|unids|unidades)/);
  if (m) return { min: Number(m[1]), max: Infinity };

  // "1 pza"
  m = clean.match(/^\s*1\s*pza/);
  if (m) return { min: 1, max: 1 };

  // "por pieza"
  if (/por\s*piez(a|as)/.test(clean)) return { min: 1, max: Infinity };

  return { min: 1, max: Infinity };
}

function pickTierByQty(qty, tiers) {
  const q = Math.max(1, num(qty || 1));
  let best = null;
  (tiers || []).forEach(t => {
    const { min, max } = parseTierRule(t.label);
    const ok = q >= min && q <= (Number.isFinite(max) ? max : Infinity);
    if (ok) {
      if (!best || min > parseTierRule(best.label).min) best = t;
    }
  });
  if (!best) {
    best = [...(tiers || [])].sort((a,b)=>a.price-b.price)[0] || { label: 'Por pieza', price: 0 };
  }
  return best;
}

function publicNameFromProducto(nombre) {
  const s = (nombre || '').toLowerCase();
  if (s.includes('premium')) return 'Playera Premium';
  if (s.includes('tipo polo') || s.includes('polo')) return 'Playera tipo polo';
  if (s.includes('caballero')) return 'Playera Regular Caballero';
  if (s.includes('dama')) return 'Playera Regular Dama';
  if (s.includes('kids')) return 'Playera Regular Kids';
  if (s.includes('oversize')) return 'Playera Oversize';
  if (s.includes('boxifit') || s.includes('boxy')) return 'Playera BoxiFit';
  if (s.includes('sudadera')) return 'Sudadera';
  if (s.includes('manga')) return 'Playera Manga';
  return 'Playera Regular';
}

/* ===================== Overhead (luz) ===================== */
// NOTA: Si activas overhead "avanzado", ahora devuelve SOLO el baseline (focos + LED).
function computeOverheadUnitFromSettings(s, currentMonthlyQty) {
  if (!s.includeOverhead) return 0;
  if (s.overheadMode === 'simple') {
    const p = Math.max(1, num(currentMonthlyQty || s.produccionMensual || 1));
    return round2(num(s.luzMensual) / p);
  }

  // Avanzado: bombillas + tira LED (sin plancha)
  const bulbsW = Math.max(0, num(s.bulbW)) * Math.max(0, num(s.bulbsCount));
  const ledW   = Math.max(0, num(s.ledW));
  const openH  = Math.max(0, num(s.openHoursPerDay)) * Math.max(0, num(s.daysPerMonth));
  const baseW  = bulbsW + ledW; // W

  // kWh mensuales baseline (bombillas + LED)
  const baselineKWhPerMonth = (baseW / 1000) * openH;

  // Para estimar $/kWh desde la factura mensual
  const pressKWhPerUnit = (Math.max(0, num(s.pressW)) / 1000) * (Math.max(0, num(s.pressSecPerUnit)) / 3600);
  const monthlyQty = Math.max(1, num(currentMonthlyQty || s.produccionMensual || 1));
  const estMonthKWh = baselineKWhPerMonth + (pressKWhPerUnit * monthlyQty);
  const pricePerKWh = estMonthKWh > 0 ? num(s.luzMensual) / estMonthKWh : 0;

  // SOLO baseline por unidad
  const baselineCostPerUnit = (baselineKWhPerMonth / monthlyQty) * pricePerKWh;
  return round2(baselineCostPerUnit);
}

/* ====== Energía de plancha por prenda (se agrega en silencio) ====== */
function computePressEnergyUnitFromSettings(s) {
  const kwh = (Math.max(0, num(s.pressW)) / 1000) * (Math.max(0, num(s.pressSecPerUnit)) / 3600);
  const price = Math.max(0, num(s.kwhPrecio));
  return round2(kwh * price);
}

/* ===================== Cálculo de costos por línea ===================== */
function computeLineUnitCost(line, ctx) {
  const m = line.meta;

  const blank = num(m.blankPrice);
  const dtfConsumo = num(m.dtfConsumoM) * (1 + num(m.mermaPct) / 100);

  let dtfRate;
  if (m.dtfModo === 'auto') dtfRate = ctx.autoDtfRate;
  else if (m.dtfModo === '150') dtfRate = num(m.dtfPrecio150);
  else if (m.dtfModo === '80')  dtfRate = 80;
  else if (m.dtfModo === 'otro') dtfRate = num(m.dtfPrecioOtro);
  else dtfRate = num(m.dtfPrecio180);

  const dtfUnit = dtfConsumo * dtfRate;

  const bolsa = num(m.bolsaUnit);
  const labor = m.includeLabor ? (num(m.laborTarifaHora) * (num(m.laborMinPorUnidad) / 60)) : 0;

  // Energía plancha por prenda (oculta en desglose)
  const pressEnergy = num(m.pressEnergyUnit || 0);

  // Overhead (si lo activas manualmente; ya NO incluye plancha)
  const overhead = m.includeOverhead ? num(m.overheadUnit) : 0;

  // Envío prorrateado por unidad (ya viene pre-calculado por proveedor)
  const envio = m.includeEnvio ? num(m.envioUnitProv) : 0;

  const totalUnit = blank + dtfUnit + bolsa + labor + pressEnergy + overhead + envio;
  return {
    blank,
    dtfUnit: round2(dtfUnit),
    bolsa,
    labor: round2(labor),
    overhead: round2(overhead),
    envio: round2(envio),
    totalUnit: round2(totalUnit),
  };
}

/* ===================== Página principal ===================== */
export default function CotizacionPanel() {
  const { quotes: initialQuotes, filters } = usePage().props ?? {};
  const quotes = initialQuotes?.data || [];

  const inputBase =
    'px-3 py-2 rounded-lg border border-white/10 bg-white/5 ' +
    'text-white placeholder-white/50 outline-none ' +
    'focus:bg-white/10 focus:border-white/20 focus:ring-2 focus:ring-white/20';

  /* ---- Settings persistentes ---- */
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('luemik_cot_settings_ui');
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  useEffect(() => {
    localStorage.setItem('luemik_cot_settings_ui', JSON.stringify(settings));
  }, [settings]);

  /* ---- Estado principal ---- */
  const [items, setItems] = useState([]); // { category, name, qty, meta, _breakdown, _lineTotal, _effectiveTierLabel }
  const [customer, setCustomer] = useState({ name:'', email:'', phone:'', valid_until:'' });
  const [notes, setNotes] = useState('');
  const [shippingExtra, setShippingExtra] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);

  /* ---- Constructor (pasos) ---- */
  const [stepProv, setStepProv] = useState('');
  const [stepCategory, setStepCategory] = useState(''); // Oversize | Regular | Polo | Sudadera | Premium | Manga | BoxiFit
  const [stepItem, setStepItem] = useState(null);
  const [stepTalla, setStepTalla] = useState(''); // talla elegida
  const [stepQty, setStepQty] = useState(1);

  const [stepDtfModo, setStepDtfModo] = useState('auto');
  const [stepDtfOtro, setStepDtfOtro] = useState(0); // valor cuando 'otro'
  const [stepDtfConsumo, setStepDtfConsumo] = useState(settings.dtfConsumoM);
  const [stepMermaPct, setStepMermaPct] = useState(settings.mermaPct);

  const [stepBolsa, setStepBolsa] = useState(settings.bolsaUnit);
  const [stepLaborOn, setStepLaborOn] = useState(settings.includeLabor);
  const [stepLaborMin, setStepLaborMin] = useState(settings.laborMinPorUnidad);

  // Control de aperturas de secciones (para "cerrar"/"abrir" automáticamente)
  const [open1, setOpen1] = useState(true);   // Proveedor
  const [open2, setOpen2] = useState(true);   // Producto
  const [open3, setOpen3] = useState(false);  // Cantidad
  const [open4, setOpen4] = useState(false);  // DTF
  const [open5, setOpen5] = useState(false);  // Extras

  /* ---- Derivados: overhead, prorrateo de envío, DTF auto ---- */
  // Overhead por unidad (simple o avanzado) en función de settings y producción actual (sum qty)
  const totalQty = useMemo(() => items.reduce((a,b)=>a + Math.max(0, num(b.qty||0)), 0), [items]);
  const overheadUnit = useMemo(() => computeOverheadUnitFromSettings(settings, totalQty || settings.produccionMensual),
    [settings, totalQty]);

  // Energía de plancha por prenda (oculta)
  const pressEnergyUnit = useMemo(
    () => computePressEnergyUnitFromSettings(settings),
    [settings.pressW, settings.pressSecPerUnit, settings.kwhPrecio]
  );

  // Conteo de piezas por proveedor (para prorratear envío)
  const qtyByProv = useMemo(() => {
    const m = {};
    items.forEach(it => {
      const prov = it.meta?.proveedor;
      if (!prov) return;
      m[prov] = (m[prov] || 0) + num(it.qty || 0);
    });
    // incluye lo que está en el builder
    if (stepProv && stepItem && stepQty > 0) {
      m[stepProv] = (m[stepProv] || 0) + stepQty;
    }
    return m;
  }, [items, stepProv, stepItem, stepQty]);

  // Total metros DTF para tarifa auto (≥5 m => $150/m)
  const totalDtfM = useMemo(() => {
    let sum = 0;
    items.forEach(it => {
      const m = it.meta;
      if (!m) return;
      const cons = num(m.dtfConsumoM) * (1 + num(m.mermaPct) / 100);
      sum += cons * num(it.qty || 0);
    });
    if (stepProv && stepItem && stepQty > 0) {
      sum += (num(stepDtfConsumo) * (1 + num(stepMermaPct) / 100)) * stepQty;
    }
    return sum;
  }, [items, stepProv, stepItem, stepQty, stepDtfConsumo, stepMermaPct]);

  const autoDtfRate = useMemo(
    () => (totalDtfM >= 5 ? settings.dtfPrecio150 : settings.dtfPrecio180),
    [totalDtfM, settings.dtfPrecio150, settings.dtfPrecio180]
  );

  /* ---- Listas UI ---- */
  const providerKeys = useMemo(() => CATALOG.map(c => c.proveedor), []);
  const providerOptions = useMemo(() => providerKeys.map(k => ({ value: k, label: PROVIDER_LABELS[k] || k })), [providerKeys]);
  const itemsOfProv = useMemo(() => (CATALOG.find(x => x.proveedor === stepProv)?.items || []), [stepProv]);

  const categories = ['Oversize','Regular','Polo','Sudadera','Premium','Manga','BoxiFit'];

  const filteredByCategory = useMemo(() => {
    if (!stepProv) return [];
    if (!stepCategory) return itemsOfProv;
    return itemsOfProv.filter(it => itemCategoryFrom(it) === stepCategory);
  }, [itemsOfProv, stepCategory, stepProv]);

  // Vista previa tier según cantidad del builder
  const previewTier = useMemo(() => {
    if (!stepItem) return null;
    return pickTierByQty(stepQty, stepItem.tiers || []);
  }, [stepItem, stepQty]);

  // Envío unitario previsto del builder (con %)
  const envioUnitPrev = useMemo(() => {
    if (!settings.includeEnvio || !stepProv || !qtyByProv[stepProv]) return 0;
    const envioPedido = num(settings.envioProv?.[stepProv] ?? 0);
    const piezas = Math.max(1, num(qtyByProv[stepProv]));
    const pct = clamp(num(settings.envioProrratePct), 0, 100) / 100;
    return round2((envioPedido * pct) / piezas);
  }, [settings.includeEnvio, settings.envioProv, settings.envioProrratePct, stepProv, qtyByProv]);

  // Vista previa costo unitario del builder
  const previewUnit = useMemo(() => {
    if (!stepProv || !stepItem) return null;
    const meta = {
      proveedor: stepProv,
      tipo: stepItem.tipo,
      productoNombre: stepItem.nombre,
      tiers: stepItem.tiers,
      blankPrice: previewTier ? previewTier.price : 0,
      dtfConsumoM: num(stepDtfConsumo),
      dtfModo: stepDtfModo,
      dtfPrecio180: settings.dtfPrecio180,
      dtfPrecio150: settings.dtfPrecio150,
      dtfPrecioOtro: num(stepDtfOtro),
      mermaPct: clamp(num(stepMermaPct), 0, 20),
      bolsaUnit: num(stepBolsa),
      includeLabor: !!stepLaborOn,
      laborTarifaHora: num(settings.laborTarifaHora),
      laborMinPorUnidad: num(stepLaborMin),
      includeOverhead: !!settings.includeOverhead,
      overheadUnit,
      includeEnvio: !!settings.includeEnvio,
      envioUnitProv: envioUnitPrev,
      talla: stepTalla || null,
      pressEnergyUnit: pressEnergyUnit, // se suma en silencio
    };
    const ctx = { autoDtfRate };
    return computeLineUnitCost({ meta }, ctx);
  }, [
    stepProv, stepItem, previewTier, stepTalla,
    stepDtfConsumo, stepDtfModo, stepDtfOtro, stepMermaPct, stepBolsa, stepLaborOn, stepLaborMin,
    settings.dtfPrecio180, settings.dtfPrecio150, settings.includeOverhead, settings.laborTarifaHora, settings.includeEnvio,
    overheadUnit, envioUnitPrev, autoDtfRate, pressEnergyUnit
  ]);

  /* ---- Cálculo por línea + totales ---- */
  const itemsCalculated = useMemo(() => {
    const envioUnitMap = {};
    if (settings.includeEnvio) {
      Object.keys(qtyByProv).forEach(prov => {
        const piezas = Math.max(1, num(qtyByProv[prov]));
        const envioPedido = num(settings.envioProv?.[prov] ?? 0);
        const pct = clamp(num(settings.envioProrratePct), 0, 100) / 100; // % a trasladar
        envioUnitMap[prov] = round2((envioPedido * pct) / piezas);
      });
    }

    return items.map(it => {
      const prov = it.meta?.proveedor;
      const effectiveTier = pickTierByQty(it.qty, it.meta.tiers || [{label:'Por pieza', price: it.meta.blankPrice}]);
      const envioUnitProv = settings.includeEnvio ? (envioUnitMap[prov] || 0) : 0;

      const ctx = { autoDtfRate };
      const lineMeta = {
        ...it.meta,
        blankPrice: num(effectiveTier.price),
        overheadUnit,
        envioUnitProv,
        pressEnergyUnit: pressEnergyUnit, // se suma en silencio
      };
      const breakdown = computeLineUnitCost({ ...it, meta: lineMeta }, ctx);
      const lineTotal = breakdown.totalUnit * num(it.qty || 0);
      return { ...it, _breakdown: breakdown, _lineTotal: round2(lineTotal), _effectiveTierLabel: effectiveTier.label };
    });
  }, [items, qtyByProv, settings.includeEnvio, settings.envioProv, settings.envioProrratePct, overheadUnit, autoDtfRate, pressEnergyUnit]);

  const subtotal   = useMemo(() => itemsCalculated.reduce((a, it) => a + it._lineTotal, 0), [itemsCalculated]);
  const descuento  = useMemo(() => subtotal * (clamp(num(settings.descuentoPct), 0, 90) / 100), [subtotal, settings.descuentoPct]);
  const base       = useMemo(() => Math.max(0, subtotal - descuento) + num(shippingExtra), [subtotal, descuento, shippingExtra]);
  const iva        = useMemo(() => settings.aplicaIVA ? round2(base * (clamp(num(settings.ivaPct), 0, 50) / 100)) : 0, [base, settings.aplicaIVA, settings.ivaPct]);
  const total      = useMemo(() => round2(base + iva), [base, iva]);

  /* ---- Guardado ---- */
  const emailRaw = (customer.email || '').trim();
  const emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
  const submitDisabled = items.length === 0 || saving;

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        customer_name: customer.name || null,
        customer_email: (emailOk ? emailRaw : null),
        customer_phone: customer.phone || null,
        valid_until: customer.valid_until || null,
        currency: 'MXN',
        apply_tax: settings.aplicaIVA,
        tax_rate: clamp(num(settings.ivaPct), 0, 50),
        shipping: num(shippingExtra),
        discount: round2(descuento),
        notes,
        items: itemsCalculated.map(it => {
          const publicName = it._publicName || publicNameFromProducto(it.meta?.productoNombre || it.name);
          const tallaTxt = it.meta?.talla ? ` - Talla ${it.meta.talla}` : '';
          return {
            category: it.category || it.meta?.tipo || 'artículo',
            name: `${publicName}${tallaTxt}`, // nombre para PDF
            sku: null,
            qty: Number(it.qty || 1),
            unit_price: round2(it._breakdown.totalUnit),
            line_discount: 0,
          };
        }),
      };

      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const res = await fetch('/sa/cotizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        const data = await res.json();
        const list = Object.values(data.errors || {}).flat().join('\n') || data.message;
        throw new Error(list || 'Errores de validación');
      }
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(`Fallo al guardar: ${res.status} ${res.statusText}\n${err}`);
      }

      const data = await res.json();
      setSavedQuote({ id: data.id, folio: data.folio });
      router.reload({ only: ['quotes', 'filters'] });
    } catch (e) {
      alert(e.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const openPdf = (mode = 'download') => {
    if (!savedQuote?.id) return;
    const url = mode === 'stream'
      ? `/sa/cotizacion/${savedQuote.id}/pdf/stream`
      : `/sa/cotizacion/${savedQuote.id}/pdf`;
    window.open(url, '_blank');
  };

  /* ---- Eliminar + Re-secuenciar folios ---- */
  const [deletingId, setDeletingId] = useState(null);

  const deleteQuote = async (id) => {
    if (!id) return;
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;

    try {
      setDeletingId(id);
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      // 1) Eliminar
      const delRes = await fetch(`/sa/cotizacion/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      if (!delRes.ok) {
        const t = await delRes.text().catch(() => '');
        throw new Error(`No se pudo eliminar (${delRes.status}): ${t || delRes.statusText}`);
      }

      // 2) Re-secuenciar folios en backend para que queden consecutivos
      //    (ajusta la URL si tu endpoint es otro)
      const reseq = await fetch('/sa/cotizacion/resequence', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({}), // payload opcional si tu API lo requiere
      });
      if (!reseq.ok) {
        // No bloquear por esto: avisamos y recargamos de todos modos
        console.warn('Re-secuenciación falló, pero se eliminó la cotización.');
      }
      // 3) Recargar lista (y folios actualizados). PDF tomará el folio actualizado del server.
      router.reload({ only: ['quotes', 'filters'] });
    } catch (e) {
      alert(e.message || 'Error eliminando');
    } finally {
      setDeletingId(null);
    }
  };

  /* ===================== UI ===================== */
  const logoSrc = '/img/logo/logo_blanco.png';
  const selectBase = `px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white`;

  // Handlers de Step 2
  const handlePickCategory = (cat) => {
    setStepCategory(cat);
    setStepItem(null);
    setStepTalla('');
  };
  const handlePickItem = (it) => {
    setStepItem(it);
    const tallas = sizesFromName(it?.nombre || '');
    if (!tallas || tallas.length === 0) {
      setStepTalla('');
      setOpen2(false); setOpen3(true);
    }
  };
  const handlePickTalla = (t) => {
    setStepTalla(t);
    setOpen2(false); setOpen3(true);
  };

  const addFromBuilder = () => {
    if (!stepProv || !stepItem || num(stepQty) < 1) return;

    const tierApplied = pickTierByQty(stepQty, stepItem.tiers || [{ label:'Por pieza', price: 0 }]);

    const descInterna =
      `${stepItem.nombre} · ${tierApplied.label} · ${stepProv}` +
      ` | DTF: ${stepDtfModo === 'auto'
        ? `${autoDtfRate}/m (auto)`
        : (stepDtfModo === '150' ? '150/m' : (stepDtfModo === '80' ? '80/m' : (stepDtfModo === 'otro' ? `${num(stepDtfOtro)}/m` : '180/m')))}
      · ${num(stepDtfConsumo)}m` +
      `${num(stepMermaPct) > 0 ? ` +${stepMermaPct}% merma` : ''}` +
      ` · Bolsa $${num(stepBolsa)}` +
      `${stepLaborOn ? ` · Labor ${num(stepLaborMin)} min @ $${num(settings.laborTarifaHora)}/h` : ''}` +
      `${settings.includeOverhead ? ` · Overhead $${overheadUnit}/u` : ''}` +
      `${settings.includeEnvio ? ` · Envío prorr.` : ''}` +
      `${stepTalla ? ` · Talla ${stepTalla}` : ''}`;

    const meta = {
      proveedor: stepProv,
      tipo: stepItem.tipo,
      productoNombre: stepItem.nombre,
      tiers: stepItem.tiers,
      blankPrice: tierApplied.price,
      dtfConsumoM: num(stepDtfConsumo),
      dtfModo: stepDtfModo,
      dtfPrecio180: settings.dtfPrecio180,
      dtfPrecio150: settings.dtfPrecio150,
      dtfPrecioOtro: num(stepDtfOtro),
      mermaPct: clamp(num(stepMermaPct), 0, 20),
      bolsaUnit: num(stepBolsa),
      includeLabor: !!stepLaborOn,
      laborTarifaHora: num(settings.laborTarifaHora),
      laborMinPorUnidad: num(stepLaborMin),
      includeOverhead: !!settings.includeOverhead,
      overheadUnit,
      includeEnvio: !!settings.includeEnvio,
      envioUnitProv: 0,
      talla: stepTalla || null,
      pressEnergyUnit: pressEnergyUnit, // oculto
    };

    const publicName = publicNameFromProducto(stepItem.nombre);

    setItems(prevItems => ([
      ...prevItems,
      {
        category: stepItem.tipo,
        name: descInterna,     // interna para UI
        _publicName: publicName,
        qty: num(stepQty),
        meta,
      }
    ]));

    setOpen3(false); setOpen4(true);
  };

  // ---- Filtros listado (histórico)
  const [search, setSearch] = useState(filters?.search || '');
  const [status, setStatus] = useState(filters?.status || '');
  const applyFilters = () => router.get('/sa/cotizacion', { search, status }, { preserveScroll: true, replace: true });

  /* ===================== Render ===================== */
  return (
    <>
      <Head title="Cotización | Súper Admin" />
      <div className="min-h-screen bg-[#0b0b12] text-white">
        <HeaderAdmin />

        <main className="max-w-[1500px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* IZQUIERDA: Constructor + Ajustes */}
          <aside className="xl:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoSrc} alt="LUEMIK" className="h-9 w-auto object-contain" />
                <div className="font-semibold text-lg">Constructor de conceptos</div>
              </div>

              {/* Paso 1: Proveedor */}
              <Collapsible title="1) Proveedor" open={open1} onOpenChange={setOpen1}>
                <select
                  className={selectBase}
                  value={stepProv}
                  onChange={e => {
                    const v = e.target.value;
                    setStepProv(v);
                    setStepItem(null);
                    setStepTalla('');
                    setStepCategory('');
                    setOpen2(true);
                  }}
                >
                  <option value="">Selecciona proveedor</option>
                  {providerOptions.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Collapsible>

              {/* Paso 2: Producto (con categorías ampliadas) */}
              <Collapsible
                title="2) Producto"
                right={!stepProv && <span className="text-xs">selecciona proveedor</span>}
                open={open2}
                onOpenChange={setOpen2}
              >
                {stepProv ? (
                  <>
                    {/* Píldoras de categoría */}
                    {!stepCategory && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => handlePickCategory(cat)}
                            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 transition transform hover:scale-[1.02] active:scale-[0.99]"
                          >
                            <div className="font-medium">{cat}</div>
                            <div className="text-[11px] text-white/60">de {PROVIDER_LABELS[stepProv] || stepProv}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Lista de productos filtrados por categoría */}
                    {stepCategory && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/70">Categoría: <b>{stepCategory}</b></div>
                          <button
                            onClick={() => { setStepCategory(''); setStepItem(null); setStepTalla(''); }}
                            className="text-xs underline opacity-80 hover:opacity-100"
                          >
                            Cambiar categoría
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {filteredByCategory.map((it, i) => (
                            <div key={`${it.nombre}-${i}`} className={`rounded-xl p-3 border border-white/10 bg-white/[0.03] ${stepItem===it ? 'ring-2 ring-white/20' : ''}`}>
                              <button
                                onClick={() => handlePickItem(it)}
                                className="w-full text-left"
                              >
                                <div className="font-medium">{it.nombre}</div>
                                <div className="text-xs text-white/60 capitalize">{it.tipo}</div>
                              </button>

                              {/* Si este item está seleccionado, mostrar selección de talla si aplica */}
                              {stepItem === it && (() => {
                                const tallas = sizesFromName(it?.nombre || '');
                                if (!tallas || tallas.length === 0) return null;
                                return (
                                  <div className="mt-2">
                                    <div className="text-xs text-white/70 mb-1">Elige talla:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {tallas.map(t => (
                                        <button
                                          key={t}
                                          onClick={() => handlePickTalla(t)}
                                          className={`px-2.5 py-1.5 rounded-lg border text-sm transition ${stepTalla===t ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                          {t}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ))}
                          {filteredByCategory.length === 0 && (
                            <div className="text-sm text-white/60">Sin resultados en {stepCategory} para {PROVIDER_LABELS[stepProv]||stepProv}.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : <div className="text-white/60 text-sm">Primero elige el proveedor.</div>}
              </Collapsible>

              {/* Paso 3: Cantidad (precio automático por tier) */}
              <Collapsible
                title="3) Cantidad"
                right={!stepItem && <span className="text-xs">elige producto</span>}
                open={open3}
                onOpenChange={setOpen3}
              >
                {stepItem ? (
                  <div className="grid gap-3">
                    {stepTalla && (
                      <div className="text-xs bg-black/30 border border-white/10 rounded-lg p-2">
                        <b>Talla elegida:</b> {stepTalla}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-sm">Cantidad</span>
                      <input
                        type="number"
                        min="1"
                        className={`w-28 text-right ${inputBase}`}
                        value={stepQty}
                        onChange={e => setStepQty(Math.max(1, num(e.target.value || 1)))}
                      />
                    </div>

                    {previewTier && (
                      <div className="text-xs bg-black/30 border border-white/10 rounded-lg p-2">
                        <div><b>Precio aplicado:</b> {mxn.format(previewTier.price)} <span className="text-white/70">({previewTier.label})</span></div>
                      </div>
                    )}

                    {stepItem?.nombre?.toLowerCase().includes('despintada') && (
                      <div className="text-[11px] text-yellow-300 flex items-center gap-1"><FiInfo/> Ojo: “despintada por pieza” venía como $795 en tu lista.</div>
                    )}
                  </div>
                ) : <div className="text-white/60 text-sm">Primero elige el producto.</div>}
              </Collapsible>

              {/* Paso 4: DTF */}
              <Collapsible title="4) DTF" right={<span className="text-xs">auto = {`$${autoDtfRate}/m`}</span>} open={open4} onOpenChange={setOpen4}>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Modo tarifa</span>
                    <select className={selectBase} value={stepDtfModo} onChange={e => setStepDtfModo(e.target.value)}>
                      <option value="auto">Automático (≥5m → $150/m)</option>
                      <option value="180">$180/m</option>
                      <option value="150">$150/m</option>
                      <option value="80">$80/m (Medio DTF 50cm)</option>
                      <option value="otro">Otro...</option>
                    </select>
                    {stepDtfModo === 'otro' && (
                      <input
                        type="number"
                        min="1"
                        className={`w-24 text-right ${inputBase}`}
                        placeholder="$/m"
                        value={stepDtfOtro}
                        onChange={e => setStepDtfOtro(Math.max(1, num(e.target.value || 1)))}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Consumo por prenda (m)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-28 text-right ${inputBase}`}
                      value={stepDtfConsumo}
                      onChange={e => setStepDtfConsumo(Math.max(0, num(e.target.value || 0)))}
                    />
                    <span className="text-xs text-white/60">tip: 0.34 m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Merma %</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="20"
                      className={`w-20 text-right ${inputBase}`}
                      value={stepMermaPct}
                      onChange={e => setStepMermaPct(clamp(num(e.target.value || 0), 0, 20))}
                    />
                    <span className="text-xs text-white/60">global sugerido: {settings.mermaPct}%</span>
                  </div>

                  {/* Vista previa */}
                  {previewUnit && (
                    <div className="mt-2 bg-black/30 rounded-lg p-3 border border-white/10 text-sm">
                      <div className="font-semibold mb-1">Costo unitario estimado</div>
                      <div className="flex justify-between"><span>Blank</span><span>{mxn.format(previewUnit.blank)}</span></div>
                      <div className="flex justify-between"><span>DTF</span><span>{mxn.format(previewUnit.dtfUnit)}</span></div>
                      <div className="flex justify-between"><span>Bolsa</span><span>{mxn.format(previewUnit.bolsa)}</span></div>
                      {settings.includeOverhead && <div className="flex justify-between"><span>Overhead</span><span>{mxn.format(previewUnit.overhead)}</span></div>}
                      {settings.includeEnvio && <div className="flex justify-between"><span>Envío prorr.</span><span>{mxn.format(previewUnit.envio)}</span></div>}
                      {stepLaborOn && <div className="flex justify-between"><span>Labor</span><span>{mxn.format(previewUnit.labor)}</span></div>}
                      <div className="flex justify-between font-semibold pt-1 border-t border-white/10 mt-1">
                        <span>Total unit.</span><span>{mxn.format(previewUnit.totalUnit)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Collapsible>

              {/* Paso 5: Extras */}
              <Collapsible title="5) Extras y mano de obra" open={open5} onOpenChange={setOpen5}>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Bolsa $/u</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className={`w-20 text-right ${inputBase}`}
                      value={stepBolsa}
                      onChange={e => setStepBolsa(Math.max(0, num(e.target.value || 0)))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={stepLaborOn}
                        onChange={e => setStepLaborOn(e.target.checked)}
                      />
                      Incluir mano de obra (ajustable)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`w-20 text-right ${inputBase}`}
                      value={stepLaborMin}
                      onChange={e => setStepLaborMin(Math.max(0, num(e.target.value || 0)))}
                    />
                    <span className="text-sm">min/u</span>
                  </div>

                  <button
                    onClick={addFromBuilder}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
                    disabled={!stepProv || !stepItem || stepQty < 1}
                  >
                    <FiPlus /> Agregar a conceptos
                  </button>
                </div>
              </Collapsible>
            </div>

            {/* Ajustes */}
            <Collapsible title="Ajustes" right={<FiSettings />}>
              <div className="grid gap-3">
                <div className="text-white/80 font-medium">DTF</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-white/60">Tarifa $180/m
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.dtfPrecio180}
                      onChange={e => setSettings(s => ({ ...s, dtfPrecio180: Math.max(1, num(e.target.value || 1)) }))} />
                  </label>
                  <label className="text-xs text-white/60">Tarifa $150/m
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.dtfPrecio150}
                      onChange={e => setSettings(s => ({ ...s, dtfPrecio150: Math.max(1, num(e.target.value || 1)) }))} />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="text-xs text-white/60">Consumo m/u
                    <input type="number" step="0.01" className={`w-full mt-1 ${inputBase}`} value={settings.dtfConsumoM}
                      onChange={e => setSettings(s => ({ ...s, dtfConsumoM: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                  <label className="text-xs text-white/60">Merma %
                    <input type="number" min="0" max="20" className={`w-full mt-1 ${inputBase}`} value={settings.mermaPct}
                      onChange={e => setSettings(s => ({ ...s, mermaPct: clamp(num(e.target.value || 0), 0, 20) }))} />
                  </label>
                  <label className="text-xs text-white/60">Bolsa $/u
                    <input type="number" step="0.5" className={`w-full mt-1 ${inputBase}`} value={settings.bolsaUnit}
                      onChange={e => setSettings(s => ({ ...s, bolsaUnit: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                </div>

                <div className="text-white/80 font-medium mt-2">Mano de obra</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={settings.includeLabor}
                      onChange={e => setSettings(s => ({ ...s, includeLabor: e.target.checked }))} />
                    Incluir mano de obra
                  </label>
                  <label className="text-xs text-white/60">Tarifa $/h
                    <input type="number" className={`w-24 ml-2 ${inputBase}`} value={settings.laborTarifaHora}
                      onChange={e => setSettings(s => ({ ...s, laborTarifaHora: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                  <label className="text-xs text-white/60">Min/u
                    <input type="number" className={`w-20 ml-2 ${inputBase}`} value={settings.laborMinPorUnidad}
                      onChange={e => setSettings(s => ({ ...s, laborMinPorUnidad: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                </div>

                <div className="text-white/80 font-medium mt-2">Energía plancha (oculta en cotización)</div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="text-xs text-white/60">Tarifa $/kWh
                    <input type="number" step="0.01" className={`w-full mt-1 ${inputBase}`} value={settings.kwhPrecio}
                      onChange={e => setSettings(s => ({ ...s, kwhPrecio: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                  <label className="text-xs text-white/60">Plancha W
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.pressW}
                      onChange={e => setSettings(s => ({ ...s, pressW: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                  <label className="text-xs text-white/60">Seg/prenda
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.pressSecPerUnit}
                      onChange={e => setSettings(s => ({ ...s, pressSecPerUnit: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                </div>
                <div className="text-[11px] text-white/50 -mt-1">
                  Este costo se suma al unitario pero no aparece en el desglose ni en el PDF.
                </div>

                <div className="text-white/80 font-medium mt-2">Overhead (luz del local)</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={settings.includeOverhead}
                      onChange={e => setSettings(s => ({ ...s, includeOverhead: e.target.checked }))} />
                    Incluir overhead de energía
                  </label>
                  <select
                    className={`${selectBase} ml-1`}
                    value={settings.overheadMode}
                    onChange={e => setSettings(s => ({ ...s, overheadMode: e.target.value }))}
                  >
                    <option value="simple">Simple (luz mensual / prendas)</option>
                    <option value="avanzado">Avanzado (bombillas + LED)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="text-xs text-white/60">Luz mensual (MXN)
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.luzMensual}
                      onChange={e => setSettings(s => ({ ...s, luzMensual: Math.max(0, num(e.target.value || 0)) }))} />
                  </label>
                  <label className="text-xs text-white/60">Prendas/mes
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.produccionMensual}
                      onChange={e => setSettings(s => ({ ...s, produccionMensual: Math.max(1, num(e.target.value || 1)) }))} />
                  </label>
                </div>

                {settings.overheadMode === 'avanzado' && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="text-xs text-white/60">Bombillas (#)
                        <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.bulbsCount}
                          onChange={e => setSettings(s => ({ ...s, bulbsCount: Math.max(0, num(e.target.value || 0)) }))} />
                      </label>
                      <label className="text-xs text-white/60">W por bombilla
                        <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.bulbW}
                          onChange={e => setSettings(s => ({ ...s, bulbW: Math.max(0, num(e.target.value || 0)) }))} />
                      </label>
                      <label className="text-xs text-white/60">W tira LED
                        <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.ledW}
                          onChange={e => setSettings(s => ({ ...s, ledW: Math.max(0, num(e.target.value || 0)) }))} />
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="text-xs text-white/60">Horas/día (abierto)
                        <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.openHoursPerDay}
                          onChange={e => setSettings(s => ({ ...s, openHoursPerDay: Math.max(0, num(e.target.value || 0)) }))} />
                      </label>
                      <label className="text-xs text-white/60">Días/mes
                        <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.daysPerMonth}
                          onChange={e => setSettings(s => ({ ...s, daysPerMonth: Math.max(0, num(e.target.value || 0)) }))} />
                      </label>
                      <div></div>
                    </div>
                  </>
                )}

                {settings.includeOverhead && (
                  <div className="text-xs text-white/70">
                    Overhead por unidad actual: <b>{mxn.format(overheadUnit)}</b>
                  </div>
                )}

                <div className="text-white/80 font-medium mt-2">Envío prorrateado</div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={settings.includeEnvio}
                      onChange={e => setSettings(s => ({ ...s, includeEnvio: e.target.checked }))} />
                    Incluir envío por proveedor
                  </label>
                  <label className="text-xs text-white/60">Trasladar %
                    <input
                      type="number"
                      className={`w-20 ml-2 ${inputBase}`}
                      value={settings.envioProrratePct}
                      onChange={e => setSettings(s => ({ ...s, envioProrratePct: clamp(num(e.target.value || 0), 0, 100) }))}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(settings.envioProv).map(p => (
                    <label key={p} className="text-xs text-white/60">
                      {p} $/pedido
                      <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.envioProv[p]}
                        onChange={e => setSettings(s => ({ ...s, envioProv: { ...s.envioProv, [p]: Math.max(0, num(e.target.value || 0)) } }))} />
                    </label>
                  ))}
                </div>

                <div className="text-white/80 font-medium mt-2">Impuestos / Descuento</div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={settings.aplicaIVA}
                      onChange={e => setSettings(s => ({ ...s, aplicaIVA: e.target.checked }))} />
                    Aplicar IVA
                  </label>
                  <label className="text-xs text-white/60">IVA %
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.ivaPct}
                      onChange={e => setSettings(s => ({ ...s, ivaPct: clamp(num(e.target.value || 0), 0, 50) }))} />
                  </label>
                  <label className="text-xs text-white/60">Desc. %
                    <input type="number" className={`w-full mt-1 ${inputBase}`} value={settings.descuentoPct}
                      onChange={e => setSettings(s => ({ ...s, descuentoPct: clamp(num(e.target.value || 0), 0, 90) }))} />
                  </label>
                </div>
              </div>
            </Collapsible>
          </aside>

          {/* CENTRO: Conceptos + Cliente + Totales */}
          <section className="xl:col-span-5 space-y-4">
            {/* Conceptos */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-lg font-semibold mb-3">Conceptos</div>

              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[18%]" />
                  <col />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-sm text-white/70">
                    <th className="py-2">Categoría</th>
                    <th>Descripción (interna)</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">Unitario</th>
                    <th className="text-right">Importe</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsCalculated.map((it, idx) => (
                    <tr key={idx} className="border-t border-white/10 align-top">
                      <td className="py-2 pr-2 capitalize">{it.category || it.meta?.tipo || 'artículo'}</td>
                      <td className="pr-2">
                        <div className="text-sm">{it.name}</div>
                        <div className="text-xs text-white/60 mt-1">
                          Tier: <b>{it._effectiveTierLabel}</b>
                          {' · '}Público: <b>{it._publicName || publicNameFromProducto(it.meta?.productoNombre)}</b>
                          {it.meta?.talla && <> {' · '}Talla: <b>{it.meta.talla}</b></>}
                        </div>
                        <details className="text-xs text-white/70 mt-1">
                          <summary className="cursor-pointer">Ver desglose</summary>
                          <div className="grid grid-cols-2 gap-x-4">
                            <div>Blank: {mxn.format(it._breakdown.blank)}</div>
                            <div>DTF: {mxn.format(it._breakdown.dtfUnit)}</div>
                            <div>Bolsa: {mxn.format(it._breakdown.bolsa)}</div>
                            {settings.includeOverhead && <div>Overhead: {mxn.format(it._breakdown.overhead)}</div>}
                            {settings.includeEnvio && <div>Envío prorr.: {mxn.format(it._breakdown.envio)}</div>}
                            {it.meta?.includeLabor && <div>Labor: {mxn.format(it._breakdown.labor)}</div>}
                            <div className="col-span-2 border-t border-white/10 pt-1">Unitario: <b>{mxn.format(it._breakdown.totalUnit)}</b></div>
                          </div>
                        </details>
                      </td>
                      <td className="pr-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={e => setItems(prev => prev.map((x,i) => i===idx ? ({ ...x, qty: Math.max(1, num(e.target.value || 1)) }) : x))}
                          className={`w-full text-right ${inputBase}`}
                        />
                      </td>
                      <td className="pr-2 text-right">{mxn.format(it._breakdown.totalUnit)}</td>
                      <td className="pr-2 text-right">{mxn.format(it._lineTotal)}</td>
                      <td className="pr-2 text-right">
                        <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="inline-flex items-center justify-center w-8 h-8 rounded bg-white/10 hover:bg-white/15">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-white/60">
                        Sin conceptos. Usa el <b>Constructor</b> para agregarlos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cliente */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-lg font-semibold mb-3">Datos del cliente</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60">Nombre</label>
                  <input className={`w-full mt-1 ${inputBase}`} value={customer.name}
                    onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Email</label>
                  <input type="email" className={`w-full mt-1 ${inputBase}`} value={customer.email}
                    onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} />
                  {customer.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) && (
                    <div className="text-[11px] text-red-300 mt-1">Email no válido (se omitirá al guardar).</div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-white/60">Teléfono</label>
                  <input className={`w-full mt-1 ${inputBase}`} value={customer.phone}
                    onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Válida hasta</label>
                  <input type="date" className={`w-full mt-1 ${inputBase}`} value={customer.valid_until}
                    onChange={e => setCustomer(c => ({ ...c, valid_until: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={settings.aplicaIVA}
                        onChange={e => setSettings(s => ({ ...s, aplicaIVA: e.target.checked }))} />
                      Aplicar IVA
                    </label>
                    <input
                      type="number"
                      className={`w-20 text-right ${inputBase}`}
                      value={clamp(num(settings.ivaPct), 0, 50)}
                      min="0"
                      max="50"
                      onChange={e => setSettings(s => ({ ...s, ivaPct: clamp(num(e.target.value || 0), 0, 50) }))}
                    />
                    <span className="text-sm">%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">Descuento global</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-28 text-right ${inputBase}`}
                      value={settings.descuentoPct}
                      onChange={e => setSettings(s => ({ ...s, descuentoPct: clamp(num(e.target.value || 0), 0, 90) }))}
                    />
                    <span className="text-sm">%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">Envío adicional (manual)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-28 text-right ${inputBase}`}
                      value={shippingExtra}
                      onChange={e => setShippingExtra(Math.max(0, num(e.target.value || 0)))}
                    />
                  </div>

                  <textarea
                    placeholder="Notas para el cliente (opcional)"
                    className={`w-full mt-2 ${inputBase}`}
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                  <div className="flex justify-between py-1 text-white/80">
                    <span>Subtotal</span><span>{mxn.format(subtotal)}</span>
                  </div>
                  {settings.descuentoPct > 0 && (
                    <div className="flex justify-between py-1 text-white/80">
                      <span>Descuento ({settings.descuentoPct}%)</span><span>- {mxn.format(descuento)}</span>
                    </div>
                  )}
                  {num(shippingExtra) > 0 && (
                    <div className="flex justify-between py-1 text-white/80">
                      <span>Envío</span><span>{mxn.format(num(shippingExtra))}</span>
                    </div>
                  )}
                  {settings.aplicaIVA && (
                    <div className="flex justify-between py-1 text-white/80">
                      <span>IVA ({clamp(num(settings.ivaPct), 0, 50)}%)</span><span>{mxn.format(iva)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-semibold">
                    <span>Total</span><span>{mxn.format(total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  disabled={submitDisabled}
                  onClick={handleSave}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${submitDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-white/15 hover:bg-white/20'}`}
                >
                  <FiSave />{saving ? 'Guardando…' : 'Guardar cotización'}
                </button>

                <button
                  disabled={!savedQuote}
                  onClick={() => openPdf('stream')}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${!savedQuote ? 'bg-white/10 cursor-not-allowed' : 'bg-white/15 hover:bg-white/20'}`}
                >
                  <FiPrinter /> Imprimir (ver)
                </button>

                <button
                  disabled={!savedQuote}
                  onClick={() => openPdf('download')}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${!savedQuote ? 'bg-white/10 cursor-not-allowed' : 'bg-white/15 hover:bg-white/20'}`}
                >
                  <FiDownload /> Descargar PDF
                </button>
              </div>

              {savedQuote && (
                <div className="mt-2 text-white/70 text-sm">
                  Guardado como <span className="font-semibold">{savedQuote.folio}</span>.
                </div>
              )}
            </div>
          </section>

          {/* DERECHA: Listado histórico */}
          <aside className="xl:col-span-3 space-y-4">
            {/* Filtros */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-2 top-2.5 text-white/50" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar folio o cliente"
                    className={`w-full pl-8 pr-2 py-2 ${inputBase}`}
                  />
                </div>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className={selectBase}
                >
                  <option value="">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                </select>
                <button onClick={applyFilters} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">
                  Filtrar
                </button>
              </div>
            </div>

            {/* Listado con acción de eliminar */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] divide-y divide-white/10">
              {(quotes || []).map(q => (
                <div key={q.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{q.folio}</div>
                    <div className="text-xs text-white/60 truncate">
                      {q.customer_name || '—'} · {new Date(q.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/sa/cotizacion/${q.id}/pdf`} target="_blank" className="text-sm underline">
                      PDF
                    </Link>
                    <button
                      onClick={() => deleteQuote(q.id)}
                      disabled={deletingId === q.id}
                      title="Eliminar cotización"
                      className={`inline-flex items-center justify-center w-8 h-8 rounded ${deletingId === q.id ? 'bg-red-900/40 cursor-wait' : 'bg-red-500/20 hover:bg-red-500/30'}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              {(!quotes || quotes.length === 0) && (
                <div className="p-4 text-white/60 text-sm">Sin cotizaciones aún.</div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
