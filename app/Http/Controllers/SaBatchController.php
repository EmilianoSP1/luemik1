<?php

namespace App\Http\Controllers;

use App\Models\SaBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SaBatchController extends Controller
{
    /**
     * GET /sa/batches
     */
    public function index()
    {
        $all = SaBatch::orderBy('date', 'desc')->get();

        $clean = $all->map(function (SaBatch $b) {
            // Normaliza estructuras base
            $b->inc_sums = array_merge(['Otros'=>0,'Efectivo'=>0,'Tarjeta'=>0,'Transferencia'=>0], $b->inc_sums ?? []);
            $b->exp_sums = array_merge(['Efectivo'=>0,'Tarjeta'=>0,'Transferencia'=>0,'Crédito'=>0], $b->exp_sums ?? []);
            $b->inc_meta = array_merge(['otros'=>[]], $b->inc_meta ?? []);
            $b->exp_meta = array_merge(['pedido'=>[], 'credito'=>null], $b->exp_meta ?? []);
            $b->credit_paid_months = array_values($b->credit_paid_months ?? []);
            $b->notas    = $b->notas    ?? '';
            $b->exp_note = $b->exp_note ?? '';

            // Solo-UPGRADE: intenta subir a "paid" si aplica, pero solo si hay columnas
            if (($b->status ?? 'pending') !== 'paid') {
                [$status, $paidAt] = $this->deriveStatusFromCredit($b->exp_meta, $b->credit_paid_months, $b->paid_at);
                if ($status === 'paid') {
                    $dirty = [];
                    if (Schema::hasColumn('sa_batches', 'status'))  $dirty['status'] = 'paid';
                    if (Schema::hasColumn('sa_batches', 'paid_at')) $dirty['paid_at'] = $b->paid_at ?: ($paidAt ?? now());
                    if ($dirty) {
                        try {
                            $b->forceFill($dirty)->save();
                        } catch (\Throwable $e) {
                            Log::warning('SaBatch.index persist status (upgrade) failed', [
                                'batch_id' => $b->id,
                                'error'    => $e->getMessage(),
                            ]);
                        }
                    }
                }
            }

            return $b;
        })->filter(function (SaBatch $b) {
            $inc = array_sum(array_map('floatval', $b->inc_sums));
            $exp = array_sum(array_map('floatval', $b->exp_sums));

            $otros        = collect($b->inc_meta['otros']  ?? [])->sum(fn($x) => floatval($x['cifra'] ?? 0));
            $pedido       = collect($b->exp_meta['pedido'] ?? [])->sum(fn($x) => floatval($x['cifra'] ?? 0));
            $creditoTotal = floatval(data_get($b->exp_meta, 'credito.total', 0));

            $hasMetaValue = ($otros > 0) || ($pedido > 0) || ($creditoTotal > 0);
            $hasNotes     = filled($b->notas) || filled($b->exp_note);

            return ($inc > 0) || ($exp > 0) || $hasMetaValue || $hasNotes;
        })->values();

        return response()->json($clean->map(fn ($b) => $this->normalize($b))->all());
    }

    /**
     * POST /sa/batches
     */
    public function store(Request $request)
    {
        Log::info('SaBatch.store payload', ['raw' => $request->all()]);

        $payload = $this->mapCamelToSnake($request->all());

        $validated = Validator::make($payload, [
            'date'               => 'nullable|date',
            'inc_sums'           => 'array',
            'exp_sums'           => 'array',
            'inc_meta'           => 'array',
            'exp_meta'           => 'array',
            'credit_paid_months' => 'array',
            'notas'              => 'nullable|string',
            'exp_note'           => 'nullable|string',

            // Nuevos (opcionales)
            'status'             => 'sometimes|string|in:pending,paid,cancelled',
            'payment_intent_id'  => 'sometimes|nullable|string',
            'checkout_session_id'=> 'sometimes|nullable|string',
            'paid_at'            => 'sometimes|nullable|date',
        ])->validate();

        // Fecha por defecto hoy
        $validated['date'] = isset($validated['date'])
            ? Carbon::parse($validated['date'])->toDateString()
            : now()->toDateString();

        // Si no viene status, derivarlo desde crédito (si aplica) y solo setear si existen columnas
        if (!array_key_exists('status', $validated)) {
            [$status, $paidAt] = $this->deriveStatusFromCredit(
                $validated['exp_meta'] ?? [],
                $validated['credit_paid_months'] ?? [],
                $validated['paid_at'] ?? null
            );
            if (Schema::hasColumn('sa_batches', 'status'))  $validated['status']  = $status;
            if (Schema::hasColumn('sa_batches', 'paid_at')) $validated['paid_at'] = $validated['paid_at'] ?? $paidAt;
        }

        $batch = SaBatch::create($validated);

        Log::info('SaBatch.store saved', ['id' => $batch->id]);

        return response()->json($this->normalize($batch), 201);
    }

    /**
     * PUT /sa/batches/{saBatch}
     * Usa route model binding (tu Route::bind soporta id o batch_id).
     */
    public function update(Request $request, SaBatch $saBatch)
    {
        Log::info('SaBatch.update payload(IN)', [
            'resolved_id'       => $saBatch->id,
            'resolved_batch_id' => $saBatch->batch_id ?? null,
            'raw'               => $request->all(),
        ]);

        $payload = $this->mapCamelToSnake($request->all());

        // Normaliza credit_paid_months a array<int> (idempotente)
        if (array_key_exists('credit_paid_months', $payload)) {
            $cpm = $payload['credit_paid_months'];
            if (!is_array($cpm)) $cpm = [$cpm];
            $cpm = collect($cpm)->filter(fn($v) => $v !== null && $v !== '')
                ->map(fn($v) => (int)$v)->unique()->values()->all();
            $payload['credit_paid_months'] = $cpm;
        }

        $validated = Validator::make($payload, [
            'date'               => 'sometimes|nullable|date',
            'inc_sums'           => 'sometimes|array',
            'exp_sums'           => 'sometimes|array',
            'inc_meta'           => 'sometimes|array',
            'exp_meta'           => 'sometimes|array',
            'credit_paid_months' => 'sometimes|array',
            'notas'              => 'sometimes|nullable|string',
            'exp_note'           => 'sometimes|nullable|string',

            // Nuevos (opcionales)
            'status'             => 'sometimes|string|in:pending,paid,cancelled',
            'payment_intent_id'  => 'sometimes|nullable|string',
            'checkout_session_id'=> 'sometimes|nullable|string',
            'paid_at'            => 'sometimes|nullable|date',
        ])->validate();

        if (array_key_exists('date', $validated) && $validated['date']) {
            $validated['date'] = Carbon::parse($validated['date'])->toDateString();
        }

        // Si NO mandan status explícito pero SÍ cambiaron meses pagados,
        // intenta derivar status=paid cuando ya se completaron las mensualidades.
        if (!array_key_exists('status', $validated)) {
            $futureCpm = array_key_exists('credit_paid_months', $validated)
                ? $validated['credit_paid_months']
                : ($saBatch->credit_paid_months ?? []);

            $futureExpMeta = array_key_exists('exp_meta', $validated)
                ? $validated['exp_meta']
                : ($saBatch->exp_meta ?? []);

            [$status, $paidAt] = $this->deriveStatusFromCredit(
                $futureExpMeta,
                $futureCpm,
                $saBatch->paid_at
            );

            // Solo fija si cambia a 'paid' y antes no estaba pagado, y si existen columnas
            if ($status === 'paid' && $saBatch->status !== 'paid') {
                if (Schema::hasColumn('sa_batches', 'status'))  $validated['status']  = 'paid';
                if (Schema::hasColumn('sa_batches', 'paid_at')) $validated['paid_at'] = $validated['paid_at'] ?? $paidAt ?? now();
            }
        }

        $saBatch->fill($validated)->save();

        Log::info('SaBatch.update saved(OUT)', [
            'resolved_id'          => $saBatch->id,
            'credit_paid_months'   => $saBatch->credit_paid_months,
            'status'               => $saBatch->status,
            'paid_at'              => $saBatch->paid_at,
            'payment_intent_id'    => $saBatch->payment_intent_id,
            'checkout_session_id'  => $saBatch->checkout_session_id,
        ]);

        return response()->json($this->normalize($saBatch->refresh()));
    }

    /**
     * DELETE /sa/batches/{saBatch}
     */
    public function destroy(SaBatch $saBatch)
    {
        Log::info('SaBatch.destroy', ['id' => $saBatch->id]);
        $saBatch->delete();
        return response()->noContent();
    }

    /**
     * Deriva status/paid_at a partir de exp_meta.credito y credit_paid_months.
     */
    private function deriveStatusFromCredit($expMeta, $creditPaidMonths, $currentPaidAt = null): array
    {
        $expMeta = is_array($expMeta) ? $expMeta : [];
        $credito = $expMeta['credito'] ?? null;

        if (!$credito) {
            return ['pending', $currentPaidAt];
        }

        $meses = (int) ($credito['meses'] ?? 0);
        $total = (float) ($credito['total'] ?? 0);

        $cpm = is_array($creditPaidMonths)
            ? array_values(array_unique(array_map('intval', $creditPaidMonths)))
            : [];
        if ($meses <= 0) {
            $meses = max(1, count($cpm));
        }

        $pagados = count($cpm);
        if ($total > 0 && $meses > 0 && $pagados >= $meses) {
            return ['paid', $currentPaidAt ?? now()];
        }

        return ['pending', $currentPaidAt];
    }

    /** camelCase -> snake_case  */
    private function mapCamelToSnake(array $in): array
    {
        $map = [
            'incSums'           => 'inc_sums',
            'expSums'           => 'exp_sums',
            'incMeta'           => 'inc_meta',
            'expMeta'           => 'exp_meta',
            'creditPaidMonths'  => 'credit_paid_months',
            'expNote'           => 'exp_note',
            'notas'             => 'notas',
            'status'            => 'status',
            'paymentIntentId'   => 'payment_intent_id',
            'checkoutSessionId' => 'checkout_session_id',
            'paidAt'            => 'paid_at',
        ];

        foreach ($map as $camel => $snake) {
            if (array_key_exists($camel, $in)) {
                $in[$snake] = $in[$camel];
                if ($camel !== $snake) unset($in[$camel]);
            }
        }

        // si viene id "B...", úsalo como batch_id (no como PK)
        if (isset($in['id']) && is_string($in['id'])) {
            $in['batch_id'] = $in['id'];
            unset($in['id']);
        }
        return $in;
    }

    /** normaliza a camelCase para el front */
    private function normalize(SaBatch $b): array
    {
        $date = null;
        if ($b->date instanceof \Carbon\CarbonInterface) {
            $date = $b->date->toDateString();
        } elseif (is_string($b->date)) {
            $date = substr($b->date, 0, 10);
        }

        return [
            'id'               => $b->batch_id ?? $b->id,
            'date'             => $date,
            'incSums'          => $b->inc_sums ?? [],
            'expSums'          => $b->exp_sums ?? [],
            'incMeta'          => $b->inc_meta ?? ['otros'=>[]],
            'expMeta'          => $b->exp_meta ?? ['pedido'=>[], 'credito'=>null],
            'creditPaidMonths' => $b->credit_paid_months ?? [],
            'notas'            => $b->notas ?? '',
            'expNote'          => $b->exp_note ?? '',
            'status'            => $b->status ?? 'pending',
            'paidAt'            => $b->paid_at
                ? ($b->paid_at instanceof \Carbon\CarbonInterface ? $b->paid_at->toIso8601String() : (string) $b->paid_at)
                : null,
            'paymentIntentId'   => $b->payment_intent_id ?? null,
            'checkoutSessionId' => $b->checkout_session_id ?? null,
        ];
    }
    
public function payMonth(Request $request, SaBatch $saBatch)
{
    $data = $request->validate([
        'month' => ['required','integer','min:1'],
    ]);
    $month = (int) $data['month'];

    return DB::transaction(function () use ($saBatch, $month) {
        // Lock row to avoid double click races
        $row = SaBatch::whereKey($saBatch->id)->lockForUpdate()->first();
        $row->refresh();

        $expMeta = $row->exp_meta ?? [];
        $credito = $expMeta['credito'] ?? null;
        if (!$credito) {
            return response()->json(['message' => 'Este corte no tiene crédito'], 422);
        }

        $meses = max(1, (int)($credito['meses'] ?? 1));
        if ($month < 1 || $month > $meses) {
            return response()->json(['message' => 'Mes fuera de rango'], 422);
        }

        // idempotente: set sin duplicados
        $set = collect($row->credit_paid_months ?? [])
            ->map(fn ($v) => (int) $v)->unique()->values()->all();

        if (!in_array($month, $set, true)) {
            $set[] = $month;
            sort($set);
        }

        // Derivar status/paid_at
        [$status, $paidAt] = $this->deriveStatusFromCredit($expMeta, $set, $row->paid_at);
        $patch = ['credit_paid_months' => $set];

        if ($status === 'paid' && $row->status !== 'paid') {
            if (Schema::hasColumn('sa_batches', 'status'))  $patch['status']  = 'paid';
            if (Schema::hasColumn('sa_batches', 'paid_at')) $patch['paid_at'] = $row->paid_at ?: ($paidAt ?? now());
        }

        $row->fill($patch)->save();

        return response()->json($this->normalize($row->refresh()));
    });
}

public function unpayMonth(Request $request, SaBatch $saBatch)
{
    $data = $request->validate([
        'month' => ['required','integer','min:1'],
    ]);
    $month = (int) $data['month'];

    return DB::transaction(function () use ($saBatch, $month) {
        $row = SaBatch::whereKey($saBatch->id)->lockForUpdate()->first();
        $row->refresh();

        $expMeta = $row->exp_meta ?? [];

        $set = collect($row->credit_paid_months ?? [])
            ->map(fn ($v) => (int) $v)
            ->reject(fn ($v) => $v === $month)
            ->values()->all();

        // Recalcular estado
        [$status] = $this->deriveStatusFromCredit($expMeta, $set, $row->paid_at);
        $patch = ['credit_paid_months' => $set];

        if ($status !== 'paid' && Schema::hasColumn('sa_batches', 'status')) {
            $patch['status'] = 'pending';
        }

        $row->fill($patch)->save();

        return response()->json($this->normalize($row->refresh()));
    });
}
}
