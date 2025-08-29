import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section
            className={`rounded-2xl p-7 shadow-2xl border border-white/15 ${className}`}
            style={{
                background: 'rgba(25, 24, 36, 0.75)',
                backdropFilter: 'blur(18px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
                color: '#fff',
                marginTop: 32,
                boxShadow: '0 6px 32px 0 #0004',
            }}
        >
            <header>
                <h2 className="text-2xl font-bold text-[#3a29ff]">
                    Información del perfil
                </h2>
                <p className="mt-1 text-base text-white/80">
                    Actualiza tu nombre y correo electrónico de tu cuenta Luemik.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Nombre */}
                <div>
                    <InputLabel htmlFor="name" value="Nombre completo" className="text-white" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full rounded-lg bg-white/10 border border-[#3a29ff33] text-white"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                        placeholder="Nombre completo"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>
                {/* Email */}
                <div>
                    <InputLabel htmlFor="email" value="Correo electrónico" className="text-white" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full rounded-lg bg-white/10 border border-[#3a29ff33] text-white"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="Correo electrónico"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {/* Verificación de correo */}
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-white">
                            Tu correo no está verificado.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-[#3a29ff] underline hover:text-[#5941ff] focus:outline-none focus:ring-2 focus:ring-[#3a29ff] focus:ring-offset-2"
                            >
                                Reenviar correo de verificación
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-500">
                                ¡Se envió un nuevo enlace de verificación a tu correo!
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Guardar cambios</PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-500">
                            Datos guardados correctamente.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
