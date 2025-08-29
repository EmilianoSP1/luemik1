<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SaMovement extends Model
{
    use HasFactory;

    protected $table = 'sa_movements';

    protected $fillable = [
        'user_id','batch_id','date','type','amount','concept',
        'motivo','motivo_extra','method','is_external','meta',
    ];

    // Valor por defecto para movimientos nuevos
    protected $attributes = [
        'is_external' => 0,
    ];

    protected $casts = [
        'date'        => 'date:Y-m-d',  // <-- formato claro para el front
        'amount'      => 'decimal:2',   // <-- números consistentes
        'is_external' => 'boolean',
        'meta'        => 'array',
    ];

    // Si tu tabla NO tiene created_at / updated_at, descomenta:
    // public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function batch()
    {
        return $this->belongsTo(\App\Models\SaBatch::class, 'batch_id');
    }

    /* Scopes útiles */
    public function scopeInternal($q) { return $q->where('is_external', false); }
    public function scopeExternal($q) { return $q->where('is_external', true); }
}
