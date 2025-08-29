// resources/js/Pages/Sa/provedores/provedores.jsx
import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import HeaderAdmin from '../headeradmin';
import { FiTruck, FiPackage, FiTag } from 'react-icons/fi';

/** Utilidades */
const peso = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
  }
  // Si viene como string (p.e. "$375-$400" o "795"), lo devolvemos tal cual
  return String(v);
};

const Badge = ({ children, title }) => (
  <span
    title={title}
    className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/80"
  >
    {children}
  </span>
);

const Card = ({ title, subtitle, right, children, icon: Icon }) => (
  <section className="rounded-2xl border border-white/10 bg-[#0b0b11] shadow-sm overflow-hidden">
    <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6 py-4 bg-[#0f0f15]">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
          {Icon ? <Icon className="text-white/80" /> : <FiTruck className="text-white/80" />}
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">{title}</h3>
          {subtitle ? <p className="text-xs text-white/60 truncate">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
);

const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-5 w-1.5 rounded bg-white/20" />
    <h4 className="text-white/90 font-medium tracking-tight">{children}</h4>
  </div>
);

const Table = ({ cols = [], rows = [] }) => (
  <div className="overflow-x-auto rounded-xl border border-white/10">
    <table className="min-w-full text-sm">
      <thead className="bg-white/5 text-white/70">
        <tr>
          {cols.map((c, i) => (
            <th key={i} className={`px-3 py-2 text-left font-medium ${c.className || ''}`}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/10">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-white/[0.03]">
            {cols.map((c, j) => (
              <td key={j} className={`px-3 py-2 align-top text-white/90 ${c.tdClassName || ''}`}>
                {typeof c.render === 'function' ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Datos fuente (exactamente como fueron proporcionados, estructurados por secciones) */
const DATA = [
  {
    proveedor: 'MAMMON BLANKS',
    envios: [{ texto: 'Envío', costo: 190 }],
    secciones: [
      {
        nombre: 'Playeras',
        items: [
          { producto: 'Playera Oversize 220g Algodon', precio: 145, presentacion: 'Por pieza' },
          { producto: 'Playera Oversize 220g Algodon', precio: 99, presentacion: '12 Unidades', tallas: 'S, M, L, XL' },
          { producto: 'Playera Oversize 300g Algodon', precio: 230, presentacion: 'Por pieza', tallas: 'S, M, L, XL' },
          { producto: 'Playera Oversize 300g Algodon', precio: 180, presentacion: '12 Unidades', tallas: 'S, M, L, XL' },
          { producto: 'Playera Premium 250g Algodon', precio: 195, presentacion: 'Por pieza', tallas: 'S, M, L, XL' },
          { producto: 'Playera Premium 250g Algodon', precio: 155, presentacion: '12 Unidades', tallas: 'S, M, L, XL' },
          { producto: 'Playera Oversize 240g Polister', precio: 135, presentacion: 'Por pieza', tallas: 'S, M, L, XL' },
          { producto: 'Playera tipo polo 250g Algodon', precio: 255, presentacion: 'Por pieza', tallas: 'S, M, L, XL' },
          { producto: 'Playera tipo polo 250g Algodon', precio: 199, presentacion: '10 Unidades', tallas: 'S, M, L, XL' },
        ],
      },
      {
        nombre: 'Sudaderas',
        items: [
          { producto: 'Sudadera Oversize 400g Algodon', precio: 350, presentacion: 'Por pieza', tallas: 'S, M, L, XL' },
          { producto: 'Sudadera Oversize 400g Algodon', precio: 280, presentacion: '10 Unidades', tallas: 'S, M, L, XL' },
        ],
      },
    ],
  },

  {
    proveedor: 'Player Tlax',
    envios: [{ texto: 'Envío', costo: 200 }, { texto: 'Envío (otra tarifa)', costo: '$375-$400' }],
    secciones: [
      {
        nombre: 'Playeras Oversize 220g Algodón',
        items: [
          { producto: 'Color', precio: 60, presentacion: '30 Unidades', tallas: 'S, M, L / XL, XXL: $65' },
          { producto: 'Color', precio: 70, presentacion: 'Por pieza', tallas: 'S, M, L / XL, XXL: $75' },
          { producto: 'Blanco', precio: 55, presentacion: '30 Unidades', tallas: 'S, M, L / XL, XXL: $60' },
          { producto: 'Blanco', precio: 65, presentacion: 'Por pieza', tallas: 'S, M, L / XL, XXL: $70' },
          { producto: 'Despintada', precio: 80, presentacion: '30 Unidades', tallas: 'S, M, L / XL, XXL: $85' },
          { producto: 'Despintada', precio: 90, presentacion: 'Por pieza', tallas: 'S, M, L / XL, XXL: $795' },
        ],
      },
      {
        nombre: 'Playera Regular 190g Algodón (Color)',
        items: [
          { producto: '30 Unidades', precio: 33, presentacion: 'S' },
          { producto: '30 Unidades', precio: 35, presentacion: 'M' },
          { producto: '30 Unidades', precio: 37, presentacion: 'L' },
          { producto: '30 Unidades', precio: 40, presentacion: 'XL' },
          { producto: 'Por pieza', precio: 38, presentacion: 'S' },
          { producto: 'Por pieza', precio: 40, presentacion: 'M' },
          { producto: 'Por pieza', precio: 42, presentacion: 'L' },
          { producto: 'Por pieza', precio: 45, presentacion: 'XL' },
        ],
      },
      {
        nombre: 'Playera Regular 190g Algodón (Blanco)',
        items: [
          { producto: '30 Unidades', precio: 27, presentacion: 'S' },
          { producto: '30 Unidades', precio: 29, presentacion: 'M' },
          { producto: '30 Unidades', precio: 32, presentacion: 'L' },
          { producto: '30 Unidades', precio: 40, presentacion: 'XL' },
          { producto: 'Por pieza', precio: 32, presentacion: 'S' },
          { producto: 'Por pieza', precio: 34, presentacion: 'M' },
          { producto: 'Por pieza', precio: 37, presentacion: 'L' },
          { producto: 'Por pieza', precio: 39, presentacion: 'XL' },
        ],
      },
      {
        nombre: 'Playera Regular 180g 50% Algodón 50% Polister (Color)',
        items: [
          { producto: '30 Unidades', precio: 27, presentacion: 'S' },
          { producto: '30 Unidades', precio: 29, presentacion: 'M' },
          { producto: '30 Unidades', precio: 31, presentacion: 'L' },
          { producto: '30 Unidades', precio: 34, presentacion: 'XL' },
          { producto: 'Por pieza', precio: 32, presentacion: 'S' },
          { producto: 'Por pieza', precio: 34, presentacion: 'M' },
          { producto: 'Por pieza', precio: 36, presentacion: 'L' },
          { producto: 'Por pieza', precio: 40, presentacion: 'XL' },
        ],
      },
      {
        nombre: 'Playera Regular 180g 50% Algodón 50% Polister (Blanco)',
        items: [
          { producto: '30 Unidades', precio: 22, presentacion: 'S' },
          { producto: '30 Unidades', precio: 24, presentacion: 'M' },
          { producto: '30 Unidades', precio: 26, presentacion: 'L' },
          { producto: '30 Unidades', precio: 28, presentacion: 'XL' },
          { producto: 'Por pieza', precio: 27, presentacion: 'S' },
          { producto: 'Por pieza', precio: 29, presentacion: 'M' },
          { producto: 'Por pieza', precio: 31, presentacion: 'L' },
          { producto: 'Por pieza', precio: 32, presentacion: 'XL' },
        ],
      },
      {
        nombre: 'Kids Playeras 195g Algodón',
        items: [
          { producto: 'RegularKids (Color)', precio: 19, presentacion: '30 Unidades', tallas: 'S' },
          { producto: 'RegularKids (Color)', precio: 22, presentacion: '30 Unidades', tallas: 'M' },
          { producto: 'RegularKids (Color)', precio: 23.5, presentacion: '30 Unidades', tallas: 'L' },
          { producto: 'RegularKids (Color)', precio: 26, presentacion: '30 Unidades', tallas: 'XL' },
          { producto: 'RegularKids (Color)', precio: 24.5, presentacion: 'Por pieza', tallas: 'S' },
          { producto: 'RegularKids (Color)', precio: 27, presentacion: 'Por pieza', tallas: 'M' },
          { producto: 'RegularKids (Color)', precio: 28.5, presentacion: 'Por pieza', tallas: 'L' },
          { producto: 'RegularKids (Color)', precio: 31, presentacion: 'Por pieza', tallas: 'XL' },
          { producto: 'RegularKids (Blanco)', precio: 17, presentacion: '30 Unidades', tallas: 'S' },
          { producto: 'RegularKids (Blanco)', precio: 18, presentacion: '30 Unidades', tallas: 'M' },
          { producto: 'RegularKids (Blanco)', precio: 20, presentacion: '30 Unidades', tallas: 'L' },
          { producto: 'RegularKids (Blanco)', precio: 21, presentacion: '30 Unidades', tallas: 'XL' },
          { producto: 'RegularKids (Blanco)', precio: 22, presentacion: 'Por pieza', tallas: 'S' },
          { producto: 'RegularKids (Blanco)', precio: 23, presentacion: 'Por pieza', tallas: 'M' },
          { producto: 'RegularKids (Blanco)', precio: 25, presentacion: 'Por pieza', tallas: 'L' },
          { producto: 'RegularKids (Blanco)', precio: 26, presentacion: 'Por pieza', tallas: 'XL' },
        ],
      },
      {
        nombre: 'Sudaderas 50% Algodón 50% Poliester',
        items: [
          { producto: 'Sudadera', precio: 100, presentacion: '30 Unidades', tallas: 'S, M, L / XL: $105' },
          { producto: 'Sudadera', precio: 110, presentacion: 'Por pieza', tallas: 'S, M, L / XL: $115' },
        ],
      },
    ],
  },

  {
    proveedor: 'Say México',
    envios: [],
    secciones: [
      {
        nombre: '12 Unidades',
        items: [
          { producto: 'Playera regular Algodón 180g', precio: 100, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 220g', precio: 125, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 250g', precio: 155, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 180g', precio: 100, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 220g', precio: 125, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 250g', precio: 155, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 180g', precio: 100, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 220g', precio: 125, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 250g', precio: 155, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 180g', precio: 100, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 220g', precio: 125, presentacion: '12 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 250g', precio: 155, presentacion: '12 Unidades', tallas: 'S, M, L' },
        ],
      },
      {
        nombre: '6 Unidades',
        items: [
          { producto: 'Playera regular Algodón 180g', precio: 110, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 220g', precio: 135, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 250g', precio: 165, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 180g', precio: 110, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 220g', precio: 135, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 250g', precio: 165, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 180g', precio: 110, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 220g', precio: 135, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 250g', precio: 165, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 180g', precio: 110, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 220g', precio: 135, presentacion: '6 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 250g', precio: 165, presentacion: '6 Unidades', tallas: 'S, M, L' },
        ],
      },
      {
        nombre: '3-5 Unidades',
        items: [
          { producto: 'Playera regular Algodón 180g', precio: 120, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 220g', precio: 145, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 250g', precio: 175, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 180g', precio: 120, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 220g', precio: 145, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 250g', precio: 175, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 180g', precio: 120, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 220g', precio: 145, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 250g', precio: 175, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 180g', precio: 120, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 220g', precio: 145, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 250g', precio: 175, presentacion: '3-5 Unidades', tallas: 'S, M, L' },
        ],
      },
      {
        nombre: '1-2 Unidades',
        items: [
          { producto: 'Playera regular Algodón 180g', precio: 130, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 220g', precio: 155, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 250g', precio: 185, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 180g', precio: 130, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 220g', precio: 155, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 250g', precio: 185, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 180g', precio: 130, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 220g', precio: 155, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 250g', precio: 185, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 180g', precio: 130, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 220g', precio: 155, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 250g', precio: 185, presentacion: '1-2 Unidades', tallas: 'S, M, L' },
        ],
      },
      {
        nombre: '100 Unidades',
        items: [
          { producto: 'Playera regular Algodón 180g', precio: 95, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 220g', precio: 120, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera regular Algodón 250g', precio: 150, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 180g', precio: 95, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 220g', precio: 120, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Oversize Algodón 250g', precio: 150, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 180g', precio: 95, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 220g', precio: 120, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera Manga Algodón 250g', precio: 150, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 180g', precio: 95, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 220g', precio: 120, presentacion: '100 Unidades', tallas: 'S, M, L' },
          { producto: 'Playera BoxiFit Algodón 250g', precio: 150, presentacion: '100 Unidades', tallas: 'S, M, L' },
        ],
      },
    ],
  },

  {
    proveedor: 'ESSENZA SHIRTS MX',
    envios: [{ texto: 'Envío', costo: 200 }],
    secciones: [
      {
        nombre: 'Playera Regular Caballero 180g Algodón',
        items: [
          { producto: '1 pieza', precio: 79, presentacion: 'S, M, L, XL' },
          { producto: '1-10 Unidades', precio: 69, presentacion: 'S, M, L, XL' },
          { producto: '11-99 Unidades', precio: 59, presentacion: 'S, M, L, XL' },
          { producto: '101 a 999 Unidades', precio: 57, presentacion: 'S, M, L, XL' },
          { producto: '+1000 Unidades', precio: 56, presentacion: 'S, M, L, XL' },
        ],
      },
      {
        nombre: 'Playera Regular Dama 180g Algodón',
        items: [
          { producto: '1 pieza', precio: 79, presentacion: 'M, L, XL, XXL' },
          { producto: '1-10 Unidades', precio: 69, presentacion: 'M, L, XL, XXL' },
          { producto: '11-99 Unidades', precio: 59, presentacion: 'M, L, XL, XXL' },
          { producto: '101 a 999 Unidades', precio: 57, presentacion: 'M, L, XL, XXL' },
          { producto: '+1000 Unidades', precio: 56, presentacion: 'M, L, XL, XXL' },
        ],
      },
      {
        nombre: 'DTF',
        items: [
          { producto: 'Medio DTF', precio: 90, presentacion: '—' },
          { producto: 'Metro DTF', precio: 180, presentacion: '—' },
          { producto: '5 Metros de DTF en adelante', precio: 150, presentacion: '—' },
        ],
      },
      {
        nombre: 'Costos / Insumos',
        items: [
          { producto: 'Pago de luz', precio: 236, presentacion: 'Aprox' },
          { producto: 'Bolsa para empacar', precio: 1, presentacion: '—' },
          { producto: 'Serigrafía – Positivo', precio: 20, presentacion: '—' },
          { producto: 'Serigrafía – Pintura', precio: 50, presentacion: 'Si es pedido de menos de 10 playeras o sudadera: $12 / Si son más de 30: $50' },
        ],
      },
    ],
  },
];

/** Columnas estándar de tabla */
const COLS = [
  { key: 'producto', label: 'Producto / Variante', className: 'w-[40%]' },
  {
    key: 'precio',
    label: 'Precio',
    className: 'w-[20%]',
    render: (r) => <Badge title="Precio">{peso(r.precio)}</Badge>,
  },
  { key: 'presentacion', label: 'Presentación', className: 'w-[20%] text-white/80' },
  { key: 'tallas', label: 'Tallas / Notas', className: 'w-[20%] text-white/70' },
];

export default function Provedores() {
  const resumen = useMemo(() => {
    const totalProveedores = DATA.length;
    const totalItems = DATA.reduce(
      (acc, p) => acc + p.secciones.reduce((s, sec) => s + sec.items.length, 0),
      0
    );
    return { totalProveedores, totalItems };
  }, []);

  return (
    <>
      <Head title="Proveedores" />
      <HeaderAdmin />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Encabezado de página */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Proveedores
            </h1>
            <p className="text-white/60 text-sm">
              Catálogo de costos y presentaciones (solo lectura).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge title="Número total de proveedores">
              <FiTruck className="mr-1" /> {resumen.totalProveedores} proveedores
            </Badge>
            <Badge title="Número total de líneas">
              <FiPackage className="mr-1" /> {resumen.totalItems} líneas
            </Badge>
          </div>
        </div>

        {/* Lista de proveedores */}
        <div className="grid grid-cols-1 gap-6">
          {DATA.map((prov, idx) => {
            const totalLineas = prov.secciones.reduce((s, sec) => s + sec.items.length, 0);
            return (
              <Card
                key={idx}
                title={prov.proveedor}
                subtitle={`${totalLineas} líneas`}
                icon={FiTag}
                right={
                  <div className="flex flex-wrap gap-2">
                    {prov.envios?.map((e, i) => (
                      <Badge key={i}>
                        {e.texto}: {peso(e.costo)}
                      </Badge>
                    ))}
                  </div>
                }
              >
                <div className="space-y-6">
                  {prov.secciones.map((sec, si) => (
                    <div key={si}>
                      <SectionTitle>{sec.nombre}</SectionTitle>
                      <Table cols={COLS} rows={sec.items} />
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pie de página informativo */}
        <div className="mt-6 text-[12px] text-white/40">
          * Los precios, gramajes y notas son los proporcionados. Esta vista no permite acciones.
        </div>
      </main>
    </>
  );
}
