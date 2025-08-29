import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmarEliminacion = () => {
        setConfirmandoEliminacion(true);
    };

    const eliminarUsuario = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => cerrarModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const cerrarModal = () => {
        setConfirmandoEliminacion(false);
        clearErrors();
        reset();
    };

    return (
        <section
            className={`space-y-6 rounded-2xl p-6 bg-white/10 shadow-2xl border border-white/15 ${className}`}
            style={{
                backdropFilter: 'blur(16px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
                color: '#fff',
                marginTop: 24,
                boxShadow: '0 4px 24px 0 #0004',
            }}
        >
            <header>
                <h2 className="text-2xl font-bold text-[#ff4171]">
                    Eliminar cuenta
                </h2>
                <p className="mt-1 text-base text-white/80">
                    Una vez que elimines tu cuenta, <span className="font-semibold text-[#ff4171]">todos tus datos serán borrados permanentemente</span>.
                    Si deseas conservar tu información, descárgala antes de continuar.
                </p>
            </header>

            <DangerButton onClick={confirmarEliminacion}>
                Eliminar cuenta
            </DangerButton>

            <Modal show={confirmandoEliminacion} onClose={cerrarModal}>
                <form
                    onSubmit={eliminarUsuario}
                    className="p-6 rounded-2xl bg-white/10 border border-white/15 shadow-2xl"
                    style={{
                        minWidth: 280,
                        backdropFilter: "blur(16px) saturate(1.3)",
                        WebkitBackdropFilter: "blur(16px) saturate(1.3)",
                    }}
                >
                    <h2 className="text-xl font-bold text-[#ff4171] mb-2">
                        ¿Estás seguro de eliminar tu cuenta?
                    </h2>
                    <p className="mb-5 text-white/90">
                        Esta acción no se puede deshacer. Ingresa tu contraseña para confirmar la eliminación.
                    </p>
                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="Contraseña"
                            className="sr-only"
                        />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-full rounded-lg bg-white/20 border border-[#ff4171]/40 text-white"
                            isFocused
                            placeholder="Contraseña"
                        />
                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={cerrarModal}>
                            Cancelar
                        </SecondaryButton>
                        <DangerButton className="ml-2" disabled={processing}>
                            Eliminar cuenta
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
