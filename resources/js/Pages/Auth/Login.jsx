// resources/js/Pages/Auth/Login.jsx
import { Head, Link, useForm } from '@inertiajs/react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useState } from 'react';

// IMPORT RELATIVO (no usa alias @)
import Beams from '../../Components/Beams';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });
  const [showPass, setShowPass] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // Sin Ziggy: post directo a /login
    post('/login', { onFinish: () => reset('password') });
  };

  const handleGoogleLogin = () => {
    // Sin Ziggy: redirección directa
    window.location.href = '/auth/google';
  };

  return (
    <>
      <Head title="Iniciar Sesión | Luemik" />

      {/* Fondo animado */}
      <div style={{
        position: 'fixed', width: '100vw', height: '100vh',
        zIndex: 0, top: 0, left: 0,
      }}>
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={0}
        />
      </div>

      <div className="min-h-screen flex flex-col justify-center items-center relative z-10 bg-[#0c0a11]/80">
        {/* Regresar */}
        <Link href="/" className="absolute top-6 left-8 text-white/80 hover:text-white flex items-center gap-2 text-lg z-20">
          <FiArrowLeft /> Inicio
        </Link>

        {/* Card */}
        <div className="w-full max-w-md mx-auto bg-white/10 rounded-2xl shadow-2xl backdrop-blur-md px-10 py-10 relative border border-white/20">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-white drop-shadow mb-7 tracking-tight">
            Bienvenido a <span className="text-[#3a29ff]">Luemik</span>
          </h1>
          <p className="text-center text-white/70 mb-6">Inicia sesión con tu cuenta</p>

          {status && (
            <div className="mb-4 text-sm font-medium text-green-500 text-center">{status}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]">
                  <FiMail />
                </span>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border-none outline-none bg-white/90 text-black placeholder:text-gray-500 font-medium shadow focus:ring-2 focus:ring-[#3a29ff]"
                  placeholder="Correo electrónico"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              {errors.email && <div className="text-sm text-red-500 mt-1">{errors.email}</div>}
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]">
                  <FiLock />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border-none outline-none bg-white/90 text-black placeholder:text-gray-500 font-medium shadow focus:ring-2 focus:ring-[#3a29ff]"
                  placeholder="Contraseña"
                  value={data.password}
                  onChange={e => setData('password', e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]/70 hover:text-[#3a29ff] focus:outline-none"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <div className="text-sm text-red-500 mt-1">{errors.password}</div>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-white/80">
                <input
                  type="checkbox"
                  className="form-checkbox accent-[#3a29ff] mr-2"
                  checked={data.remember}
                  onChange={e => setData('remember', e.target.checked)}
                />
                Recordarme
              </label>

              {canResetPassword && (
                // Sin Ziggy: usa la ruta de Breeze por defecto
                <Link href="/forgot-password" className="text-sm text-[#3a29ff] hover:underline font-semibold">
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 mt-3 rounded-lg bg-[#3a29ff] hover:bg-[#5e42fe] font-bold text-white text-lg shadow-lg transition"
            >
              Iniciar sesión
            </button>
          </form>

          {/* O divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="mx-3 text-white/60 font-medium text-sm">O</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          {/* Login con Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-white hover:bg-gray-100 font-semibold text-black text-base shadow transition"
            onClick={handleGoogleLogin}
          >
            <FcGoogle className="text-2xl" />
            Iniciar sesión con Google
          </button>

          <div className="mt-6 text-center text-white/70 text-sm">
            ¿No tienes cuenta?
            {/* Sin Ziggy */}
            <Link href="/register" className="ml-2 text-[#3a29ff] font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
