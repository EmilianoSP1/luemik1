<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProductsController;
use App\Http\Controllers\SaCreditosController;

/*
|--------------------------------------------------------------------------
| API Routes  (todas salen con prefijo /api automáticamente)
|--------------------------------------------------------------------------
*/

// Healthcheck
Route::get('/ping', fn () => response()->json(['ok' => true]));

// Pública si la necesitas
Route::post('/products/ensure', [ProductsController::class, 'ensure'])
    ->name('api.products.ensure');

// PROTEGIDAS con Sanctum (Bearer Token)
Route::middleware('auth:sanctum')->group(function () {

    // Ver el usuario del token (para probar)
    Route::get('/user', fn (Request $request) => $request->user());

    // Créditos SA
    Route::prefix('sa')->name('api.sa.')->group(function () {

        // GET /api/sa/creditos
        Route::get('/creditos', [SaCreditosController::class, 'index'])
            ->name('creditos.index');

        // (Opcional otros CRUD si los implementas)
        // Route::post('/creditos', [SaCreditosController::class, 'store'])->name('creditos.store');
        // Route::get('/creditos/{id}', [SaCreditosController::class, 'show'])->name('creditos.show');
        // Route::put('/creditos/{id}', [SaCreditosController::class, 'update'])->name('creditos.update');
        // Route::delete('/creditos/{id}', [SaCreditosController::class, 'destroy'])->name('creditos.destroy');
    });
});
