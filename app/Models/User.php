<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasProfilePhoto, Notifiable, TwoFactorAuthenticatable;

    /**
     * Campos asignables en masa.
     */
    protected $fillable = [
        'name',
        'email',
        'password',

        // OAuth / perfil
        'google_id',
        'avatar',

        // Opcionales (si existen en tu BD)
        'role',           // 'user' | 'admin' | 'superadmin'
        'is_admin',       // tinyint/bool
        'superadmin',     // tinyint/bool
        'disabled',       // tinyint/bool
        'is_active',      // tinyint/bool
        'last_login_at',  // datetime nullable
    ];

    /**
     * Campos ocultos al serializar.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * Accessors agregados.
     */
    protected $appends = [
        'profile_photo_url',
    ];

    /**
     * Casts de atributos.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',

            // booleans opcionales
            'is_admin'   => 'boolean',
            'superadmin' => 'boolean',
            'disabled'   => 'boolean',
            'is_active'  => 'boolean',

            // hasher automático de Laravel 10+
            'password' => 'hashed',
        ];
    }
}
