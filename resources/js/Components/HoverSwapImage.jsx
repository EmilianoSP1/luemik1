export default function HoverSwapImage({ src, hoverSrc, alt = '', className = '' }) {
  const hasHover = Boolean(hoverSrc && hoverSrc !== src);

  return (
    <div className={`hswap ${className}`}>
      {/* Imagen principal */}
      <img
        src={src}
        alt={alt}
        className="hswap-img hswap-main"
        loading="lazy"
      />
      {/* Imagen hover (si no hay, usamos la misma para que no truene) */}
      <img
        src={hasHover ? hoverSrc : src}
        alt={alt}
        className="hswap-img hswap-hover"
        loading="lazy"
      />
    </div>
  );
}
