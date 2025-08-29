import { Head, useForm, Link } from '@inertiajs/react';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { useState } from 'react';
import Beams from '@/Components/Beams'; // Asegúrate del path

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Restablecer contraseña | Luemik" />
            {/* Fondo animado Beams */}
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

                {/* Card de recuperación */}
                <div className="w-full max-w-md mx-auto bg-white/10 rounded-2xl shadow-2xl backdrop-blur-md px-10 py-10 relative border border-white/20">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-center text-white drop-shadow mb-7 tracking-tight">
                        Recuperar contraseña
                    </h1>
                    <p className="text-center text-white/70 mb-6">
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-500 text-center">
                            {status}
                        </div>
                    )}
                    <form onSubmit={submit} className="space-y-4">
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
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <div className="text-sm text-red-500 mt-1">{errors.email}</div>}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 mt-3 rounded-lg bg-[#3a29ff] hover:bg-[#5e42fe] font-bold text-white text-lg shadow-lg transition"
                        >
                            Enviar enlace de recuperación
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
