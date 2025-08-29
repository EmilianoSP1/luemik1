import '../css/app.css';
import './bootstrap';

import axios from 'axios';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// ---------- Axios + CSRF ----------
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Asegura nombres de XSRF usados por Laravel/Sanctum
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Toma el token del <meta> por si aplica (refuerzo)
const meta = document.querySelector('meta[name="csrf-token"]');
if (meta?.content) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = meta.content;
}

// Pide cookie CSRF una vez al arrancar
const warmupCsrf = async () => {
  try { await axios.get('/sanctum/csrf-cookie'); } catch (_) {}
};
warmupCsrf();

// Reintento automático si da 419 (CSRF) tras login social
axios.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 419 && !error.config.__retry) {
      try {
        await warmupCsrf();
        const cfg = { ...error.config, __retry: true };
        return axios.request(cfg);
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

// ---------- Ziggy (opcional y seguro) ----------
(async () => {
  try {
    const { default: ziggyRoute } = await import('ziggy-js');
    // Si @routes está en Blade, window.Ziggy existe y ziggyRoute lo usa solo.
    window.route = ziggyRoute;
  } catch (e) {
    // Si no está instalado, evita que truene la app
    window.route = (name) => name;
  }
})();

// ---------- (opcional) Log de errores global para verlos en consola ----------
window.addEventListener('error', (e) => console.error('JS error:', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => console.error('Promise rejection:', e.reason));

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.jsx`,
      import.meta.glob('./Pages/**/*.jsx'),
    ),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
  progress: { color: '#4B5563' },
});
