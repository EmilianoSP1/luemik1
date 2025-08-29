<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

class GoogleController extends Controller
{
    /**
     * Redirige a Google con los scopes necesarios.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['email', 'profile'])
            ->redirect();
    }

    /**
     * Callback de Google: crea/encuentra el usuario y lo inicia sesión.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            // Intento normal con verificación de "state"
            $googleUser = Socialite::driver('google')->user();
        } catch (InvalidStateException $e) {
            // Fallback: si hay problemas de sesión/state, usar stateless
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth error', ['msg' => $e->getMessage()]);
            return redirect()->route('login')
                ->with('status', 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
        }

        $email = $googleUser->getEmail();
        if (!$email) {
            return redirect()->route('login')
                ->with('status', 'Tu cuenta de Google no expone un correo válido.');
        }

        $googleId = (string) $googleUser->getId();
        $name     = $googleUser->getName() ?: ($googleUser->getNickname() ?: (explode('@', $email)[0] ?? 'Usuario'));
        $avatar   = $googleUser->getAvatar();

        // === BÚSQUEDA ROBUSTA: usa google_id solo si la columna existe ===
        $query = User::query();
        if (Schema::hasColumn('users', 'google_id')) {
            $query->where('google_id', $googleId);
            // merge por email para evitar duplicados si ya existía
            $query->orWhere('email', $email);
        } else {
            $query->where('email', $email);
        }
        $user = $query->first();

        if (!$user) {
            // Crear usuario nuevo (seteos condicionados a columnas existentes)
            $user = new User();
            $user->name  = $name;
            $user->email = $email;

            if (Schema::hasColumn('users', 'email_verified_at')) {
                $user->email_verified_at = now();
            }
            if (Schema::hasColumn('users', 'google_id')) {
                $user->google_id = $googleId;
            }
            if (Schema::hasColumn('users', 'avatar') && $avatar) {
                $user->avatar = $avatar;
            }

            $user->password = Hash::make(Str::random(32)); // contraseña aleatoria fuerte
            $user->save();
        } else {
            // Merge seguro
            $dirty = false;

            if (Schema::hasColumn('users', 'google_id') && empty($user->google_id)) {
                $user->google_id = $googleId;
                $dirty = true;
            }
            if (is_null($user->email_verified_at) && Schema::hasColumn('users', 'email_verified_at')) {
                $user->email_verified_at = now();
                $dirty = true;
            }
            if (empty($user->name) && $name) {
                $user->name = $name;
                $dirty = true;
            }
            if (Schema::hasColumn('users', 'avatar') && $avatar && $user->avatar !== $avatar) {
                $user->avatar = $avatar;
                $dirty = true;
            }

            if ($dirty) {
                $user->save();
            }
        }

        // Login y regeneración de sesión
        Auth::login($user, true); // remember = true
        $request->session()->regenerate();

        // === Redirect según columnas disponibles ===
        $isSuperAdmin =
            (Schema::hasColumn('users', 'superadmin')   && (int)($user->superadmin ?? 0) === 1) ||
            (Schema::hasColumn('users', 'is_superadmin') && (int)($user->is_superadmin ?? 0) === 1) ||
            (Schema::hasColumn('users', 'role')          && ($user->role ?? 'user') === 'superadmin');

        return redirect()->intended($isSuperAdmin ? route('sa.dashboard') : route('dashboard'));
    }
}
