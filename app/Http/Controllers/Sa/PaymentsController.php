<?php

namespace App\Http\Controllers\Sa;

use App\Http\Controllers\Controller;
use App\Models\SaMovement;
use App\Models\SaBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PaymentsController extends Controller
{
    public function index(Request $request)
    {
        // Rango por defecto: últimos 30 días
        $end   = now()->toDateString();
        $start = now()->subDays(30)->toDateString();

        $start = $request->query('start', $start);
        $end   = $request->query('end', $end);

        // ===== 1) Agregados "reales" tomados de sa_batches (como en el Dashboard) =====
        $batches = SaBatch::whereBetween('date', [$start, $end])->get();

        // Claves conocidas; "Otros" captura cualquier llave extra
        $ingKeys = ['Efectivo','Transferencia','Tarjeta','Vales','Otros'];
        $egKeys  = ['Efectivo','Transferencia','Tarjeta','Vales','Crédito','Otros'];

        $ingByMethod = array_fill_keys($ingKeys, 0.0);
        $egByMethod  = array_fill_keys($egKeys,  0.0);

        foreach ($batches as $b) {
            $inc = is_array($b->inc_sums) ? $b->inc_sums : (json_decode($b->inc_sums, true) ?: []);
            $exp = is_array($b->exp_sums) ? $b->exp_sums : (json_decode($b->exp_sums, true) ?: []);

            // Ingresos por método
            foreach ($inc as $k => $v) {
                $val = (float) $v;
                if (array_key_exists($k, $ingByMethod)) {
                    $ingByMethod[$k] += $val;
                } else {
                    $ingByMethod['Otros'] += $val;
                }
            }

            // Egresos por método
            foreach ($exp as $k => $v) {
                $val = (float) $v;
                if (array_key_exists($k, $egByMethod)) {
                    $egByMethod[$k] += $val;
                } else {
                    $egByMethod['Otros'] += $val;
                }
            }
        }

        $ingresosTotal = array_sum($ingByMethod);
        $egresosTotal  = array_sum($egByMethod);
        $neto          = $ingresosTotal - $egresosTotal;

        // ===== 2) Listas desde sa_movements para paneles (externo/empleado) =====
        $baseMovs = SaMovement::whereBetween('date', [$start, $end]);

        $externos = (clone $baseMovs)->external()
            ->orderBy('date','desc')->orderBy('id','desc')->limit(500)->get();

        $empleados = (clone $baseMovs)->where('motivo','Empleado')
            ->orderBy('date','desc')->orderBy('id','desc')->limit(500)->get();

        // Soporte "Cargar más" (hasta 5000)
        $limit = min(5000, (int)$request->query('limit', 200));
        $movs  = (clone $baseMovs)->orderBy('date','desc')->orderBy('id','desc')->limit($limit)->get();

        // ===== 3) Opciones para selects =====
        $motivos = ['Renta','Pago luz','Retiro caja','Pasaje','DTF','Material','Empleado','Otro'];
        $methodsIngreso = ['Efectivo','Tarjeta','Transferencia','Externo'];
        $methodsEgreso  = ['Efectivo','Tarjeta','Transferencia','Vales','Externo'];

        return Inertia::render('Sa/pagos/pagos', [
            'filters' => ['start'=>$start,'end'=>$end],

            // Estos son los que consume el front
            'totals'  => [
                'ingresos'    => (float)$ingresosTotal,
                'egresos'     => (float)$egresosTotal,
                'neto'        => (float)$neto,
                'ingByMethod' => $ingByMethod,   // el front oculta "Crédito"
                'egByMethod'  => $egByMethod,    // el front oculta "Crédito"
            ],

            'externos'   => $externos,
            'empleados'  => $empleados,
            'movs'       => $movs,

            'motivos'    => $motivos,
            'methodsIngreso' => $methodsIngreso,
            'methodsEgreso'  => $methodsEgreso,
        ]);
    }

    public function store(Request $request)
    {
        $type = $request->input('type'); // ingreso | egreso

        $rules = [
            'date'         => ['required','date'],
            'type'         => ['required','in:ingreso,egreso'],
            'amount'       => ['required','numeric','min:0.01'],
            'concept'      => ['required','string','max:160'],
            'motivo'       => ['required','in:Renta,Pago luz,Retiro caja,Pasaje,DTF,Material,Empleado,Otro'],
            'motivo_extra' => ['nullable','string','max:160'],
            'method'       => ['required','in:Efectivo,Tarjeta,Transferencia,Vales,Externo'],
        ];
        $data = $request->validate($rules);

        if ($type === 'ingreso' && !in_array($data['method'], ['Efectivo','Tarjeta','Transferencia','Externo'])) {
            return back()->withErrors(['method' => 'Método inválido para ingreso.'])->withInput();
        }
        if ($type === 'egreso' && !in_array($data['method'], ['Efectivo','Tarjeta','Transferencia','Vales','Externo'])) {
            return back()->withErrors(['method' => 'Método inválido para egreso.'])->withInput();
        }

        if ($data['motivo'] === 'Otro' && !filled($data['motivo_extra'] ?? null)) {
            return back()->withErrors(['motivo_extra' => 'Describe el motivo si elegiste "Otro".'])->withInput();
        }

        $isExternal = $data['method'] === 'Externo';

        // Vincula con el corte (SaBatch) por fecha; genera batch_id legible si no existe
        $batch = SaBatch::firstOrCreate(
            ['date' => $data['date']],
            ['batch_id' => 'B'.now()->format('YmdHis').Str::upper(Str::random(5))]
        );

        $movement = SaMovement::create([
            'user_id'      => optional(auth()->user())->id,
            'batch_id'     => $batch->id,
            'date'         => $data['date'],
            'type'         => $type,
            'amount'       => $data['amount'],
            'concept'      => $data['concept'],
            'motivo'       => $data['motivo'],
            'motivo_extra' => $data['motivo_extra'] ?? null,
            'method'       => $data['method'],
            'is_external'  => $isExternal,
            'meta'         => null,
        ]);

        // Actualiza agregados del SaBatch sólo si NO es externo
        if (!$isExternal) {
            $this->bumpBatchSums($batch, $movement, +1);
        }

        return back()->with('success', 'Movimiento registrado.');
    }

    public function destroy(SaMovement $movement)
    {
        $batch = $movement->batch;

        // Reversa agregados si no era externo
        if ($batch && !$movement->is_external) {
            $this->bumpBatchSums($batch, $movement, -1);
        }

        $movement->delete();

        return back()->with('success', 'Movimiento eliminado.');
    }

    /**
     * Suma o resta el movimiento a los JSON de SaBatch (inc_sums/exp_sums)
     * $sign = +1 para sumar, -1 para revertir.
     */
    protected function bumpBatchSums(SaBatch $batch, SaMovement $m, int $sign = +1): void
    {
        // Normaliza arrays existentes
        $inc = $batch->inc_sums ?? [];
        $exp = $batch->exp_sums ?? [];

        foreach (['Efectivo','Tarjeta','Transferencia','Vales'] as $k) {
            if (!array_key_exists($k, $inc)) $inc[$k] = 0;
            if (!array_key_exists($k, $exp)) $exp[$k] = 0;
        }

        if ($m->type === 'ingreso') {
            $method = in_array($m->method, ['Efectivo','Tarjeta','Transferencia','Vales']) ? $m->method : 'Efectivo';
            $inc[$method] = round(($inc[$method] ?? 0) + ($sign * $m->amount), 2);
            $batch->inc_sums = $inc;
        } else {
            $method = in_array($m->method, ['Efectivo','Tarjeta','Transferencia','Vales']) ? $m->method : 'Efectivo';
            $exp[$method] = round(($exp[$method] ?? 0) + ($sign * $m->amount), 2);
            $batch->exp_sums = $exp;
        }

        $batch->save();
    }
}
