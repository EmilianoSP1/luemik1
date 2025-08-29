import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section
            className={`rounded-2xl p-7 shadow-xl border border-white/10 ${className}`}
            style={{
                background: 'rgba(25, 24, 36, 0.7)',                // Vidrioso, igual que eliminar cuenta
                backdropFilter: 'blur(18px) saturate(1.2)',         // Mucho blur para glass effect
                WebkitBackdropFilter: 'blur(18px) saturate(1.2)',   // Safari compatibility
                color: '#fff',
                marginTop: 32,
                boxShadow: '0 6px 32px 0 #00000040'
            }}
        >
            <header>
                <h2 className="text-2xl font-bold text-[#3a29ff]">
                    Cambiar contraseña
                </h2>
                <p className="mt-1 text-base text-white/80">
                    Usa una contraseña segura para proteger tu cuenta de Luemik.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                {/* Contraseña actual */}
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Contraseña actual"
                        className="text-white"
                    />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full rounded-lg bg-[#1a1823] border border-[#3a29ff66] text-white"
                        autoComplete="current-password"
                        placeholder="Contraseña actual"
                    />
                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>
                {/* Nueva contraseña */}
                <div>
                    <InputLabel htmlFor="password" value="Nueva contraseña" className="text-white" />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full rounded-lg bg-[#1a1823] border border-[#3a29ff66] text-white"
                        autoComplete="new-password"
                        placeholder="Nueva contraseña"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>
                {/* Confirmar nueva contraseña */}
                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirmar contraseña"
                        className="text-white"
                    />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full rounded-lg bg-[#1a1823] border border-[#3a29ff66] text-white"
                        autoComplete="new-password"
                        placeholder="Confirmar contraseña"
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>
                {/* Botón */}
                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        Guardar cambios
                    </PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-500">
                            Contraseña actualizada.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
