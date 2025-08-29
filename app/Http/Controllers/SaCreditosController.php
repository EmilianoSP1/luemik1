<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SaCreditosController extends Controller
{
    public function index(Request $request)
    {
        // MOCK de datos para que la UI funcione; cambia por tu query Eloquent cuando quieras
        $now = Carbon::now();

        $rows = [
            [
                'id'          => 101,
                'folio'       => 'CR-101',
                'cliente'     => ['nombre' => 'Juan Pérez', 'telefono' => '55 0000 0000'],
                'monto_total' => 3500,
                'pagado'      => 1200,
                'tasa'        => 0.18,
                'plazo_meses' => 6,
                'vence_at'    => $now->copy()->addMonths(5)->toDateString(),
                'estado'      => 'pendiente',
                'created_at'  => $now->copy()->subDays(3)->toDateTimeString(),
                'plan'        => [
                    ['id'=>1,'fecha'=>$now->copy()->addMonth()->toDateString(),'monto'=>600,'interes'=>80,'capital'=>520,'saldo'=>2300,'estado'=>'pendiente'],
                    ['id'=>2,'fecha'=>$now->copy()->addMonths(2)->toDateString(),'monto'=>600,'interes'=>70,'capital'=>530,'saldo'=>1770,'estado'=>'pendiente'],
                ],
            ],
            [
                'id'          => 102,
                'folio'       => 'CR-102',
                'cliente'     => ['nombre' => 'María López', 'telefono' => '55 1111 1111'],
                'monto_total' => 2200,
                'pagado'      => 2200,
                'tasa'        => 0.00,
                'plazo_meses' => 0,
                'vence_at'    => $now->copy()->subDays(2)->toDateString(),
                'estado'      => 'pagado',
                'created_at'  => $now->copy()->subDays(10)->toDateTimeString(),
                'plan'        => [],
            ],
            [
                'id'          => 103,
                'folio'       => 'CR-103',
                'cliente'     => ['nombre' => 'Carlos Díaz'],
                'monto_total' => 5000,
                'pagado'      => 500,
                'tasa'        => 0.25,
                'plazo_meses' => 12,
                'vence_at'    => $now->copy()->subDays(1)->toDateString(),
                'estado'      => 'vencido',
                'created_at'  => $now->copy()->subDays(20)->toDateTimeString(),
                'plan'        => [
                    ['id'=>1,'fecha'=>$now->copy()->subDays(1)->toDateString(),'monto'=>500,'interes'=>100,'capital'=>400,'saldo'=>4500,'estado'=>'vencido'],
                ],
            ],
            [
                'id'          => 104,
                'folio'       => 'CR-104',
                'cliente'     => ['nombre' => 'Ana Gómez'],
                'monto_total' => 1800,
                'pagado'      => 0,
                'tasa'        => 0.18,
                'plazo_meses' => 0,
                'vence_at'    => $now->copy()->addDays(15)->toDateString(),
                'estado'      => 'cancelado',
                'created_at'  => $now->copy()->subDays(5)->toDateTimeString(),
                'plan'        => [],
            ],
        ];

        return response()->json($rows);
    }
}
