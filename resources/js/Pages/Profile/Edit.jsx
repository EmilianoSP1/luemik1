import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import Beams from '@/Components/Beams';
import { FiArrowLeft } from 'react-icons/fi';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout>
            <Head title="Perfil" />

            {/* Fondo animado Beams */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 0,
                }}
            >
                <Beams
                    beamWidth={2}
                    beamHeight={15}
                    beamNumber={12}
                    lightColor="#ffffff"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={0.19}
                    rotation={0}
                />
            </div>

            {/* Botón regreso glass arriba izquierda */}
            <Link
                href="/"
                className="fixed top-7 left-8 z-20 flex items-center gap-2 px-5 py-2 rounded-full
                    bg-[#3a29ff33] border border-[#3a29ff44] text-white font-semibold shadow-xl
                    backdrop-blur-md transition hover:bg-[#3a29ff77] hover:text-white hover:shadow-2xl"
                style={{
                    backdropFilter: 'blur(10px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
                }}
            >
                <FiArrowLeft className="text-2xl" />
                Ir a inicio
            </Link>

            {/* Título principal PERFIL */}
            <div className="py-8 px-6 relative z-10">
                <h1 className="text-3xl font-extrabold text-white drop-shadow mb-8 text-center tracking-tight">
                    Perfil
                </h1>

                <div className="mx-auto max-w-7xl flex flex-col gap-8 sm:px-6 lg:px-8">
                    {/* FORMULARIO INFORMACIÓN PERFIL */}
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />

                    {/* FORMULARIO CONTRASEÑA */}
                    <UpdatePasswordForm className="max-w-xl" />

                    {/* FORMULARIO ELIMINAR CUENTA */}
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
