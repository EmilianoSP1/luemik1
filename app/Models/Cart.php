<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{
    use HasFactory;

    /**
     * Importante: incluir session_id para carrito de invitado.
     */
    protected $fillable = [
        'user_id',
        'session_id', // <- añadido para invitados
        // 'status',   // opcional
    ];

    /**
     * Casts de atributos.
     */
    protected $casts = [
        'user_id'    => 'integer',
        'session_id' => 'string',
    ];

    /**
     * Un carrito tiene muchos items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
        // ->orderByDesc('id'); // opcional
    }

    /**
     * El carrito pertenece a un usuario (puede ser null si es invitado).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope por usuario.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope por session_id (útil para invitados).
     */
    public function scopeForSession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * (Opcional) Subtotal calculado a partir de los items.
     */
    public function getSubtotalAttribute(): float
    {
        return (float) $this->items->sum(function ($i) {
            $price = $i->unit_price ?? 0;
            $qty   = $i->quantity ?? 0;
            return $price * $qty;
        });
    }
}
