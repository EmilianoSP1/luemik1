<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- 🔒 Ultra Hotkeys Guard (captura TODO: addEventListener y onkey* en window/document/body/elementos) -->
    <script>
    (function () {
      const KEY_TYPES = new Set(['keydown', 'keypress', 'keyup']);

      function isEditable(el) {
        if (!el) return false;
        if (el.isContentEditable) return true;
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        return tag === 'input' || tag === 'textarea' || tag === 'select';
      }
      function inNoHotkeysZone(el) {
        try { return !!(el && el.closest && el.closest('[data-no-hotkeys]')); } catch { return false; }
      }
      function shouldIgnore(e) {
        const t = e && (e.target || e.srcElement);
        return isEditable(t) || inNoHotkeysZone(t);
      }

      // 1) Envolver addEventListener en TODO EventTarget (window, document, body, etc.)
      const origAdd = EventTarget.prototype.addEventListener;
      const origRemove = EventTarget.prototype.removeEventListener;
      const wrappedMap = new WeakMap();

      EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (!KEY_TYPES.has(type) || typeof listener !== 'function') {
          return origAdd.call(this, type, listener, options);
        }
        const wrapped = function (e) {
          if (shouldIgnore(e)) return; // No ejecutamos hotkeys mientras se escribe
          return listener.call(this, e);
        };
        wrappedMap.set(listener, wrapped);
        return origAdd.call(this, type, wrapped, options);
      };
      EventTarget.prototype.removeEventListener = function (type, listener, options) {
        const wrapped = wrappedMap.get(listener) || listener;
        return origRemove.call(this, type, wrapped, options);
      };

      // 2) Interceptar asignaciones directas tipo window.onkeydown / document.onkeyup / body.onkeypress...
      function wrapSetter(proto, prop) {
        try {
          const desc = Object.getOwnPropertyDescriptor(proto, prop);
          // si no existe, definimos nuevo
          const originalSetter = desc && desc.set;
          const originalGetter = desc && desc.get;

          let current = null;

          Object.defineProperty(proto, prop, {
            configurable: true,
            enumerable: true,
            get() {
              if (originalGetter) {
                return originalGetter.call(this);
              }
              return current;
            },
            set(fn) {
              if (typeof fn !== 'function') {
                // permitir limpiar handlers
                current = fn;
                if (originalSetter) return originalSetter.call(this, fn);
                return;
              }
              const wrapped = function (e) {
                if (shouldIgnore(e)) return true; // devolver true para algunos libs que esperan truthy
                return fn.call(this, e);
              };
              current = wrapped;
              if (originalSetter) {
                return originalSetter.call(this, wrapped);
              } else {
                // fallback: adjuntar vía addEventListener para asegurar captura
                this.addEventListener(prop.replace('on',''), wrapped);
              }
            },
          });
        } catch (_) {
          // algunos prototipos pueden ser no-configurables, ignoramos silenciosamente
        }
      }

      const targets = [
        Window.prototype,
        Document.prototype,
        HTMLElement.prototype,
        HTMLBodyElement && HTMLBodyElement.prototype,
      ].filter(Boolean);

      for (const proto of targets) {
        wrapSetter(proto, 'onkeydown');
        wrapSetter(proto, 'onkeypress');
        wrapSetter(proto, 'onkeyup');
      }

      // 3) Como última red, escuchamos en window en *capture* y cortamos propagación
      function guardCapture(e) {
        if (shouldIgnore(e)) {
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
      }
      window.addEventListener('keydown', guardCapture, true);
      window.addEventListener('keypress', guardCapture, true);
      window.addEventListener('keyup', guardCapture, true);
    })();
    </script>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    {{-- CSRF --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Fonts (opcional) --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    {{-- Vite + Inertia --}}
    @routes
    @viteReactRefresh
    {{-- IMPORTANTE: incluir el CSS y tu JS principal. 
         Quita "resources/js/Pages/{$page['component']}.jsx" --}}
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
