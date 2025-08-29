import { Head, Link, useForm } from '@inertiajs/react';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { useState } from 'react';
// Cambio: import relativo para evitar error con el alias @
import Beams from '../../Components/Beams';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPass, setShowPass] = useState(false);
    const [showPassConf, setShowPassConf] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        // Cambio: post directo a /register para no depender de Ziggy
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Registrarse | Luemik" />

            {/* FONDO ANIMADO BEAMS */}
            <div style={{
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                top: 0,
                left: 0,
            }}>
                <Beams
                    beamWidth={2}
                    beamHeight={15}
                    beamNumber={12}
                    lightColor="#fff"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={0.23}
                    rotation={0}
                />
            </div>

            <div className="min-h-screen flex flex-col justify-center items-center relative z-10 bg-[#0c0a11]/85">
                {/* Botón regreso */}
                <Link href="/" className="absolute top-6 left-8 text-white/80 hover:text-white flex items-center gap-2 text-lg z-20">
                    <FiArrowLeft /> Inicio
                </Link>

                {/* Card registro */}
                <div className="w-full max-w-md mx-auto bg-white/10 rounded-2xl shadow-2xl backdrop-blur-md px-10 py-10 relative border border-white/20">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-center text-white drop-shadow mb-7 tracking-tight">
                        Crear cuenta en <span className="text-[#3a29ff]">Luemik</span>
                    </h1>
                    <p className="text-center text-white/70 mb-6">
                        Regístrate para disfrutar de la tienda
                    </p>
                    <form onSubmit={submit} className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]">
                                    <FiUser />
                                </span>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="w-full pl-10 pr-3 py-3 rounded-lg border-none outline-none bg-white/90 text-black placeholder:text-gray-500 font-medium shadow focus:ring-2 focus:ring-[#3a29ff]"
                                    placeholder="Nombre completo"
                                    onChange={e => setData('name', e.target.value)}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            {errors.name && <div className="text-sm text-red-500 mt-1">{errors.name}</div>}
                        </div>
                        {/* Email */}
                        <div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]">
                                    <FiMail />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="w-full pl-10 pr-3 py-3 rounded-lg border-none outline-none bg-white/90 text-black placeholder:text-gray-500 font-medium shadow focus:ring-2 focus:ring-[#3a29ff]"
                                    placeholder="Correo electrónico"
                                    onChange={e => setData('email', e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            {errors.email && <div className="text-sm text-red-500 mt-1">{errors.email}</div>}
                        </div>
                        {/* Contraseña */}
                        <div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]">
                                    <FiLock />
                                </span>
                                <input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border-none outline-none bg-white/90 text-black placeholder:text-gray-500 font-medium shadow focus:ring-2 focus:ring-[#3a29ff]"
                                    placeholder="Contraseña"
                                    onChange={e => setData('password', e.target.value)}
                                    autoComplete="new-password"
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
                        {/* Confirmar contraseña */}
                        <div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]">
                                    <FiLock />
                                </span>
                                <input
                                    id="password_confirmation"
                                    type={showPassConf ? "text" : "password"}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border-none outline-none bg-white/90 text-black placeholder:text-gray-500 font-medium shadow focus:ring-2 focus:ring-[#3a29ff]"
                                    placeholder="Confirmar contraseña"
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[#3a29ff]/70 hover:text-[#3a29ff] focus:outline-none"
                                    onClick={() => setShowPassConf(v => !v)}
                                    tabIndex={-1}
                                >
                                    {showPassConf ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.password_confirmation && <div className="text-sm text-red-500 mt-1">{errors.password_confirmation}</div>}
                        </div>
                        {/* Botón y link */}
                        <div className="flex items-center justify-between mt-4">
                            {/* Cambio: link absoluto para no depender de Ziggy */}
                            <Link href="/login" className="text-sm text-[#3a29ff] hover:underline font-semibold">
                                ¿Ya tienes cuenta? Inicia sesión
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="py-3 px-7 rounded-lg bg-[#3a29ff] hover:bg-[#5e42fe] font-bold text-white text-lg shadow-lg transition ml-2"
                            >
                                Registrarse
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
