// 🔒 Interceptor global de hotkeys: ignora atajos cuando escribes en inputs/textarea/select
// o dentro de cualquier contenedor con [data-no-hotkeys]. No borra ni rompe tus atajos:
// simplemente NO se ejecutan dentro de formularios.

(function () {
  const KEY_TYPES = new Set(['keydown', 'keypress', 'keyup']);
  const origAdd = EventTarget.prototype.addEventListener;
  const origRemove = EventTarget.prototype.removeEventListener;
  const wrappedMap = new WeakMap();

  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName?.toLowerCase?.();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }
  function shouldIgnore(e) {
    const t = e.target;
    if (isEditable(t)) return true;
    if (t?.closest?.('[data-no-hotkeys]')) return true;
    return false;
  }

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!KEY_TYPES.has(type) || typeof listener !== 'function') {
      return origAdd.call(this, type, listener, options);
    }
    // Envolvemos el listener para que NO se ejecute dentro de formularios/zona protegida
    const wrapped = function (e) {
      if (shouldIgnore(e)) {
        // No ejecutamos el atajo; dejamos que la escritura siga normal
        return;
      }
      return listener.call(this, e);
    };
    wrappedMap.set(listener, wrapped);
    return origAdd.call(this, type, wrapped, options);
  };

  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const wrapped = wrappedMap.get(listener) || listener;
    return origRemove.call(this, type, wrapped, options);
  };
})();
