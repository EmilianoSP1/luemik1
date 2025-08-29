<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\UpdateUserProfileInformation;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Acciones por defecto de Fortify / Jetstream
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

        // Rate limiters
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());
            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        /*
         |--------------------------------------------------------------
         | Redirecciones después de iniciar sesión / 2FA / registrarse
         | - Super Admin => /sa/dashboard
         | - Usuario normal => /
         |--------------------------------------------------------------
         */
        $isSuper = function ($user): bool {
            return
                (Schema::hasColumn('users', 'superadmin')   && (int)($user->superadmin ?? 0) === 1)
                || (Schema::hasColumn('users', 'is_superadmin') && (int)($user->is_superadmin ?? 0) === 1)
                || (Schema::hasColumn('users', 'role') && (($user->role ?? 'user') === 'superadmin'));
        };

        // Login normal (email/contraseña)
        $this->app->singleton(LoginResponse::class, function () use ($isSuper) {
            return new class($isSuper) implements LoginResponse {
                public function __construct(private $isSuper) {}
                public function toResponse($request)
                {
                    $user = $request->user();
                    return redirect()->intended(($this->isSuper)($user) ? route('sa.dashboard') : route('home'));
                }
            };
        });

        // Login con 2FA
        $this->app->singleton(TwoFactorLoginResponse::class, function () use ($isSuper) {
            return new class($isSuper) implements TwoFactorLoginResponse {
                public function __construct(private $isSuper) {}
                public function toResponse($request)
                {
                    $user = $request->user();
                    return redirect()->intended(($this->isSuper)($user) ? route('sa.dashboard') : route('home'));
                }
            };
        });

        // Después de registrarse
        $this->app->singleton(RegisterResponse::class, function () use ($isSuper) {
            return new class($isSuper) implements RegisterResponse {
                public function __construct(private $isSuper) {}
                public function toResponse($request)
                {
                    $user = $request->user();
                    return redirect()->intended(($this->isSuper)($user) ? route('sa.dashboard') : route('home'));
                }
            };
        });
    }
}
