<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SaBatch extends Model
{
    use HasFactory;

    /** Nombre real de la tabla */
    protected $table = 'sa_batches';

    /**
     * Campos asignables en masa.
     * Incluye batch_id por si lo envías desde el Front (no pisa el PK).
     */
    protected $fillable = [
        'batch_id',
        'date',
        'inc_sums',
        'exp_sums',
        'inc_meta',
        'exp_meta',
        'credit_paid_months',
        'notas',
        'exp_note',

        // columnas opcionales relacionadas a pago/checkout
        'status',
        'payment_intent_id',
        'checkout_session_id',
        'paid_at',
    ];

    /**
     * Casts para JSON y fechas.
     * - 'date' como date (Y-m-d)
     * - 'paid_at' como datetime
     * - arreglos JSON a array
     */
    protected $casts = [
        'date'               => 'date:Y-m-d',
        'paid_at'            => 'datetime',
        'inc_sums'           => 'array',
        'exp_sums'           => 'array',
        'inc_meta'           => 'array',
        'exp_meta'           => 'array',
        'credit_paid_months' => 'array',
    ];

    /**
     * Si usas binding implícito y la ruta es {saBatch},
     * este método hace que busque por batch_id.
     * OJO: Si además tienes un Route::bind('saBatch', ...) que
     * busca por id O batch_id (como en tu web.php), ese tendrá prioridad,
     * y este método no estorba.
     */
    public function getRouteKeyName(): string
    {
        return 'batch_id';
    }

    /* ================== Helpers opcionales ================== */

    /** ¿Está pagado según status o mensualidades? */
    public function isPaid(): bool
    {
        if (($this->status ?? null) === 'paid') {
            return true;
        }

        $credito = data_get($this->exp_meta, 'credito');
        if (!$credito) {
            return false;
        }

        $meses = (int) ($credito['meses'] ?? 0);
        if ($meses <= 0) {
            return false;
        }

        $pagados = collect($this->credit_paid_months ?? [])
            ->map(fn ($v) => (int) $v)
            ->unique()
            ->count();

        return $pagados >= $meses;
    }
}
