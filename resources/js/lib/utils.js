// resources/js/lib/utils.js
// Helper para combinar clases de forma segura
export function cn(...classes) {
  return classes.flat(Infinity).filter(Boolean).join(' ');
}
