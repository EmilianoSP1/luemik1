<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\CartController;

use App\Models\Product;

use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductsController;

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\StripeWebhookController;

// Super Admin (batches)
use App\Http\Controllers\SaBatchController;
use App\Models\SaBatch;

// Cotización Super Admin
use App\Http\Controllers\Sa\QuoteController;

// API Usuarios (Super Admin)
use App\Http\Controllers\Sa\UsersApiController;

//Pagos Super Admi
use App\Http\Controllers\Sa\PaymentsController;

//agregar super admin
use App\Http\Controllers\Sa\InventoryController;


// ====== extras necesarios para estadísticas ======
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

/*
|--------------------------------------------------------------------------
| Helper que arma el payload de estadísticas (ingresos/egresos/usuarios)
|--------------------------------------------------------------------------
*/
$buildStats = function (string $range = '12m'): array {
    $now   = now();
    $start = match ($range) {
        '30d' => $now->copy()->subDays(30),
        'ytd' => $now->copy()->startOfYear(),
        default => $now->copy()->subMonths(11)->startOfMonth(), // 12m
    };

    // Meses ordenados Y-m
    $months = [];
    $cursor = $start->copy()->startOfMonth();
    while ($cursor <= $now) {
        $months[] = $cursor->format('Y-m');
        $cursor->addMonth();
    }

    $stats = [
        'ingresos' => ['total' => 0, 'por_metodo' => [], 'mensual' => []],
        'egresos'  => ['total' => 0, 'por_metodo' => [], 'mensual' => []],
        'usuarios' => ['total' => 0, 'mensual' => []],
        'updated_at' => now()->toIso8601String(),
    ];

    // ---- Usuarios (si existe tabla users) ----
    if (Schema::hasTable('users') && Schema::hasColumn('users', 'created_at')) {
        $u = DB::table('users')
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as c")
            ->whereBetween('created_at', [$start, $now])
            ->groupBy('ym')
            ->pluck('c', 'ym');

        foreach ($months as $m) {
            $count = (int)($u[$m] ?? 0);
            $stats['usuarios']['mensual'][] = ['month' => $m, 'count' => $count];
            $stats['usuarios']['total'] += $count;
        }
    }

    // Función genérica para leer ingresos/egresos de distintas tablas
    $collect = function (array $candidates) use ($start, $now) {
        foreach ($candidates as $table) {
            if (!Schema::hasTable($table)) continue;
            $cols = Schema::getColumnListing($table);

            $amountCol = collect(['amount','monto','total','importe'])->first(fn($c) => in_array($c, $cols));
            $dateCol   = collect(['date','fecha','created_at','updated_at'])->first(fn($c) => in_array($c, $cols));
            $methodCol = collect(['method','metodo','payment_method','forma','tipo_pago','tipo'])->first(fn($c) => in_array($c, $cols));

            if (!$amountCol || !$dateCol) continue;

            $rows = DB::table($table)
                ->whereBetween($dateCol, [$start, $now])
                ->get([$amountCol, $dateCol, $methodCol ?? DB::raw("NULL as method")]);

            return [$rows, $amountCol, $dateCol, $methodCol ?: 'method'];
        }
        return null;
    };

    // ---- Ingresos ----
    if ($res = $collect(['ingresos','payments','orders'])) {
        [$rows, $amountCol, $dateCol, $methodCol] = $res;
        $byMonth = [];
        foreach ($rows as $r) {
            $amt = (float)$r->{$amountCol};
            $ym  = Carbon::parse($r->{$dateCol})->format('Y-m');
            $stats['ingresos']['total'] += $amt;
            $byMonth[$ym] = ($byMonth[$ym] ?? 0) + $amt;

            $method = $r->{$methodCol} ?? 'Otros';
            $method = $method ?: 'Otros';
            $stats['ingresos']['por_metodo'][$method] = ($stats['ingresos']['por_metodo'][$method] ?? 0) + $amt;
        }
        foreach ($months as $m) {
            $stats['ingresos']['mensual'][] = ['month' => $m, 'total' => (float)($byMonth[$m] ?? 0)];
        }
    }

    // ---- Egresos ----
    if ($res = $collect(['egresos','expenses','gastos'])) {
        [$rows, $amountCol, $dateCol, $methodCol] = $res;
        $byMonth = [];
        foreach ($rows as $r) {
            $amt = (float)$r->{$amountCol};
            $ym  = Carbon::parse($r->{$dateCol})->format('Y-m');
            $stats['egresos']['total'] += $amt;
            $byMonth[$ym] = ($byMonth[$ym] ?? 0) + $amt;

            $method = $r->{$methodCol} ?? 'Otros';
            $method = $method ?: 'Otros';
            $stats['egresos']['por_metodo'][$method] = ($stats['egresos']['por_metodo'][$method] ?? 0) + $amt;
        }
        foreach ($months as $m) {
            $stats['egresos']['mensual'][] = ['month' => $m, 'total' => (float)($byMonth[$m] ?? 0)];
        }
    }

    // Convertir montos por método a porcentajes (si corresponde)
    foreach (['ingresos','egresos'] as $k) {
        $sum = array_sum($stats[$k]['por_metodo']);
        if ($sum > 0) {
            foreach ($stats[$k]['por_metodo'] as $m => $v) {
                $stats[$k]['por_metodo'][$m] = round(($v / $sum) * 100, 1);
            }
        }
    }

    return $stats;
};

/*
|--------------------------------------------------------------------------
| Páginas públicas
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
        'user'           => Auth::user(),
    ]);
})->name('home');

Route::get('/crear', fn () => Inertia::render('Crear'))->name('playeras.3d');
Route::get('/crear2d', fn () => Inertia::render('Crear2D'))->name('playeras.2d');
Route::get('/contacto', fn () => Inertia::render('Contacto'))->name('contacto');

Route::get('/producto/{slug}', [ProductController::class, 'show'])->name('producto.show');

/*
|--------------------------------------------------------------------------
| Dashboard (redirige según rol) & Perfil (auth)
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', function () {
    $u = Auth::user();
    if (!$u) return redirect()->route('login');

    $isSuper =
        (Schema::hasColumn('users','superadmin')    && (int)($u->superadmin ?? 0) === 1) ||
        (Schema::hasColumn('users','is_superadmin') && (int)($u->is_superadmin ?? 0) === 1) ||
        (Schema::hasColumn('users','role')          && (($u->role ?? 'user') === 'superadmin'));

    return $isSuper
        ? redirect()->route('sa.dashboard')
        : redirect()->route('home');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile',  [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',[ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile',[ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Login con Google
|--------------------------------------------------------------------------
*/
Route::get('auth/google',          [GoogleController::class, 'redirectToGoogle'])->name('auth.google.redirect');
Route::get('auth/google/callback', [GoogleController::class, 'handleGoogleCallback'])->name('auth.google.callback');

/*
|--------------------------------------------------------------------------
| Auth scaffolding (Breeze/Jetstream)
|--------------------------------------------------------------------------
*/
require __DIR__ . '/auth.php';

/*
|--------------------------------------------------------------------------
| Carrito (invitados y logueados)
|--------------------------------------------------------------------------
*/
Route::get   ('/cart',              [CartController::class, 'index'])->name('cart.index');
Route::post  ('/cart/add',          [CartController::class, 'addItem'])->name('cart.add');
Route::post  ('/cart/remove',       [CartController::class, 'removeItem'])->name('cart.remove');
Route::post  ('/cart/clear',        [CartController::class, 'clear'])->name('cart.clear');
Route::patch ('/cart/items/{item}', [CartController::class, 'updateItem'])->name('cart.update');

/*
|--------------------------------------------------------------------------
| API mínima de productos (web)
|--------------------------------------------------------------------------
*/
Route::post('/api/products/ensure', function (Request $request) {
    $data = $request->validate([
        'nombre' => ['required','string','max:255'],
        'img'    => ['nullable','string'],
        'precio' => ['required','numeric'],
    ]);

    $p = Product::firstOrCreate(
        ['nombre' => $data['nombre']],
        ['img' => $data['img'] ?? null, 'precio' => $data['precio']]
    );

    return response()->json(['id' => $p->id]);
})->name('api.products.ensure');

Route::get('/api/products', fn () => Product::select('id','nombre','img','precio')->get())
    ->name('api.products.index');

/* Ruta adicional que ya tenías: le cambio el nombre para no chocar */
Route::post('/products/ensure', [ProductsController::class, 'ensure'])
    ->name('api.products.ensure.alt');

/*
|--------------------------------------------------------------------------
| Checkout (auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get ('/checkout',         [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout/session', [CheckoutController::class, 'createSession'])->name('checkout.session');
    Route::get ('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get ('/checkout/cancel',  [CheckoutController::class, 'cancel'])->name('checkout.cancel');
});

/*
|--------------------------------------------------------------------------
| Stripe Webhook (sin CSRF)
|--------------------------------------------------------------------------
*/
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->name('stripe.webhook');

/*
|--------------------------------------------------------------------------
| Catálogo (header)
|--------------------------------------------------------------------------
*/
Route::prefix('catalogo')->group(function () {
    Route::get('/playeras',   fn () => Inertia::render('Catalogo/playeras'))->name('catalogo.playeras');
    Route::get('/shorts',     fn () => Inertia::render('Catalogo/shorts'))->name('catalogo.shorts');
    Route::get('/sudaderas',  fn () => Inertia::render('Catalogo/sudaderas'))->name('catalogo.sudaderas');
    Route::get('/accesorios', fn () => Inertia::render('Catalogo/accesorios'))->name('catalogo.accesorios');

    // === NUEVAS RUTAS PARA LOS PANELES ESPECÍFICOS ===
    // Coinciden con tus paths exactos en resources/js/Pages/ (carpetas con espacio y nombres tal cual)
    Route::get('/basicas', fn () => Inertia::render('Catalogo/Basicas/basicas'))
        ->name('catalogo.basicas');

    // Si tu carpeta se llama "Overize" (como escribiste) y el archivo es oversize.jsx:
    Route::get('/oversize', fn () => Inertia::render('Catalogo/Overize/oversize'))
        ->name('catalogo.oversize');

    // Tu archivo se llama "turleneck.jsx" dentro de "Turtle Neck"
    Route::get('/turtle-neck', fn () => Inertia::render('Catalogo/Turtle Neck/turleneck'))
        ->name('catalogo.turtle');

    // Carpeta "Acid Wash" y archivo "acidwash.jsx"
    Route::get('/acid-wash', fn () => Inertia::render('Catalogo/Acid Wash/acidwash'))
        ->name('catalogo.acidwash');
});

/*
|--------------------------------------------------------------------------
| Super Admin
|--------------------------------------------------------------------------
*/
Route::prefix('sa')->middleware(['auth', 'verified', 'superadmin'])->group(function () use ($buildStats) {

    //pagos 
    Route::get   ('/pagos',                 [PaymentsController::class, 'index'])->name('sa.pagos');
    Route::post  ('/pagos',                 [PaymentsController::class, 'store'])->name('sa.pagos.store');
    Route::delete('/pagos/{movement}',      [PaymentsController::class, 'destroy'])->name('sa.pagos.destroy');
    // routes/web.php dentro del grupo /sa …
    Route::post('/pagos/{movement}/delete', [\App\Http\Controllers\Sa\PaymentsController::class, 'destroy'])
        ->name('sa.pagos.delete');

    // Dashboard
    Route::get('/dashboard', fn () => Inertia::render('Sa/Dashboard'))->name('sa.dashboard');

    // Batches + métricas (CRUD de SaBatchController)
    Route::get   ('/batches',           [SaBatchController::class, 'index'])->name('sa.batches.index');
    Route::post  ('/batches',           [SaBatchController::class, 'store'])->name('sa.batches.store');
    Route::put   ('/batches/{saBatch}', [SaBatchController::class, 'update'])->name('sa.batches.update');
    Route::delete('/batches/{saBatch}', [SaBatchController::class, 'destroy'])->name('sa.batches.destroy');

    Route::get('/metrics/traffic', fn () => response()->json(['active'=>0,'monthly'=>0]))
        ->name('sa.metrics.traffic');

    // routes/web.php (dentro del prefijo /sa y middleware superadmin)
    Route::put('/batches/{saBatch}/pay-month', [SaBatchController::class, 'payMonth'])->name('sa.batches.payMonth');
    Route::put('/batches/{saBatch}/unpay-month', [SaBatchController::class, 'unpayMonth'])->name('sa.batches.unpayMonth');

    // --- Cotización (controlador) ---
    Route::get ('/cotizacion',                    [QuoteController::class, 'index'])->name('sa.cotizacion');
    Route::post('/cotizacion',                    [QuoteController::class, 'store'])->name('sa.cotizacion.store');
    Route::get ('/cotizacion/{quote}/pdf',        [QuoteController::class, 'pdf'])->name('sa.cotizacion.pdf');
    Route::get ('/cotizacion/{quote}/pdf/stream', [QuoteController::class, 'pdfStream'])->name('sa.cotizacion.pdf.stream');

    // 👇 agrega estas dos:
    Route::delete('/cotizacion/{quote}',          [QuoteController::class, 'destroy'])->name('sa.cotizacion.destroy');
    Route::post  ('/cotizacion/resequence',       [QuoteController::class, 'resequence'])->name('sa.cotizacion.resequence');

    // ====== ESTADÍSTICAS (panel con HeaderAdmin) ======
    Route::get('/estadisticas', function () use ($buildStats) {
        return Inertia::render('Sa/estadisticas/estadisticas', [
            'stats' => $buildStats('12m'),
            'endpoints' => [
                'estadisticas' => route('sa.api.estadisticas'),
            ],
        ]);
    })->name('sa.estadisticas');

    // API en tiempo real (polling). Ruta efectiva: /sa/api/estadisticas
    Route::get('/api/estadisticas', function (Request $request) use ($buildStats) {
        $range = $request->query('range', '12m'); // '12m' | 'ytd' | '30d'
        return response()->json(['stats' => $buildStats($range)]);
    })->name('sa.api.estadisticas');

    // ====== USUARIOS (página + API) ======
    // Página: pasamos la URL del API al front
    Route::get('/usuarios', function () {
        return Inertia::render('Sa/usuarios/usuarios', [
            'api' => route('sa.api.users.index'),
        ]);
    })->name('sa.usuarios');

    // API interna bajo /sa/api
    Route::prefix('api')->group(function () {
        Route::get   ('/users',               [UsersApiController::class, 'index'])->name('sa.api.users.index');
        Route::put   ('/users/{user}/toggle', [UsersApiController::class, 'toggle'])->name('sa.api.users.toggle');
        Route::delete('/users/{user}',        [UsersApiController::class, 'destroy'])->name('sa.api.users.destroy');
        Route::post  ('/users/bulk',          [UsersApiController::class, 'bulk'])->name('sa.api.users.bulk');
        Route::get   ('/users/export',        [UsersApiController::class, 'export'])->name('sa.api.users.export');

        //agregar api
        // ===== INVENTARIO (API) =====
        Route::get   ('/inventory',                 [InventoryController::class, 'index'])->name('sa.api.inventory.index');
        Route::post  ('/inventory',                 [InventoryController::class, 'store'])->name('sa.api.inventory.store');
        Route::put   ('/inventory/{item}',          [InventoryController::class, 'update'])->name('sa.api.inventory.update');
        Route::delete('/inventory/{item}',          [InventoryController::class, 'destroy'])->name('sa.api.inventory.destroy');
        Route::get   ('/inventory/export/csv',      [InventoryController::class, 'exportCsv'])->name('sa.api.inventory.export.csv');

        // === /sa/api/creditos ===
        Route::get('/creditos', function (\Illuminate\Http\Request $request) {
            $rows = \App\Models\SaBatch::orderByDesc('date')->get();

            $data = $rows->map(function (\App\Models\SaBatch $b) {
                $c = data_get($b->exp_meta, 'credito');
                $total = (float) data_get($c, 'total', 0);
                if ($total <= 0) return null;

                $meses   = max(1, (int) data_get($c, 'meses', 1));
                $pagados = collect($b->credit_paid_months ?? [])->unique()->count();
                $pagado  = $meses > 0 ? ($total / $meses) * min($pagados, $meses) : 0;
                $saldo   = max($total - $pagado, 0);

                $inicio  = data_get($c, 'inicio');
                $fin     = data_get($c, 'fin');
                $vence   = $fin ?: ($inicio ? \Carbon\Carbon::parse($inicio)->addMonths($meses)->toDateString() : null);

                $estado = $saldo <= 0 ? 'pagado'
                         : ($vence && now()->gt(\Carbon\Carbon::parse($vence)) ? 'vencido' : 'pendiente');

                return [
                    'id'            => $b->id,
                    'folio'         => (string) $b->id,
                    'cliente_nombre'=> null,
                    'monto_total'   => round($total, 2),
                    'pagado'        => round($pagado, 2),
                    'saldo'         => round($saldo, 2),
                    'tasa'          => 0,
                    'plazo'         => $meses,
                    'vence_at'      => $vence,
                    'status'        => $estado,
                    'created_at'    => $b->date,
                    'plan'          => [],
                ];
            })->filter()->values();

            return response()->json($data);
        })->name('sa.api.creditos');
    });

    // ====== CRÉDITOS (página Inertia) ======
    Route::get('/creditos', function () {
        return Inertia::render('Sa/creditos/creditos', [
            'api' => route('sa.api.creditos'),
        ]);
    })->name('sa.creditos');

    // ====== PROVEDORES (nuevo panel Inertia) ======
    Route::get('/provedores', function () {
        // Renderiza el archivo: resources/js/Pages/Sa/provedores/provedores.jsx
        return Inertia::render('Sa/provedores/provedores');
    })->name('sa.provedores');

    // ====== AGREGAR (nuevo panel Inertia) ======
    Route::get('/agregar', function () {
        // Renderiza el archivo: resources/js/Pages/Sa/agregar/agregar.jsx
        return Inertia::render('Sa/agregar/agregar');
    })->name('sa.agregar');
});
/* Redirección desde plural a singular (con mismo middleware) */
Route::redirect('/sa/cotizaciones', '/sa/cotizacion')
    ->middleware(['auth', 'verified', 'superadmin']);

/* Redirección de compatibilidad: /sa/proveedores -> /sa/provedores */
Route::redirect('/sa/proveedores', '/sa/provedores')
    ->middleware(['auth', 'verified', 'superadmin']);

/*
|--------------------------------------------------------------------------
| Route Model Binding para saBatch por id o batch_id
|--------------------------------------------------------------------------
*/
Route::bind('saBatch', function ($value) {
    return SaBatch::where('batch_id', $value)
        ->orWhere('id', $value)
        ->firstOrFail();
});

/*
|--------------------------------------------------------------------------
| ===== ALIAS API CON SANCTUM PARA POSTMAN =====
| (no se elimina nada; solo agregamos acceso por token)
| GET /api/sa/creditos        -> mismo JSON que /sa/api/creditos
| GET /api/sa/estadisticas    -> mismo JSON que /sa/api/estadisticas
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum','superadmin'])->prefix('api/sa')->group(function () use ($buildStats) {
    Route::get('/creditos', function (\Illuminate\Http\Request $request) {
        $rows = \App\Models\SaBatch::orderByDesc('date')->get();

        $data = $rows->map(function (\App\Models\SaBatch $b) {
            $c = data_get($b->exp_meta, 'credito');
            $total = (float) data_get($c, 'total', 0);
            if ($total <= 0) return null;

            $meses   = max(1, (int) data_get($c, 'meses', 1));
            $pagados = collect($b->credit_paid_months ?? [])->unique()->count();
            $pagado  = $meses > 0 ? ($total / $meses) * min($pagados, $meses) : 0;
            $saldo   = max($total - $pagado, 0);

            $inicio  = data_get($c, 'inicio');
            $fin     = data_get($c, 'fin');
            $vence   = $fin ?: ($inicio ? \Carbon\Carbon::parse($inicio)->addMonths($meses)->toDateString() : null);

            $estado = $saldo <= 0 ? 'pagado'
                     : ($vence && now()->gt(\Carbon\Carbon::parse($vence)) ? 'vencido' : 'pendiente');

            return [
                'id'            => $b->id,
                'folio'         => (string) $b->id,
                'cliente_nombre'=> null,
                'monto_total'   => round($total, 2),
                'pagado'        => round($pagado, 2),
                'saldo'         => round($saldo, 2),
                'tasa'          => 0,
                'plazo'         => $meses,
                'vence_at'      => $vence,
                'status'        => $estado,
                'created_at'    => $b->date,
                'plan'          => [],
            ];
        })->filter()->values();

        return response()->json($data);
    })->name('api.sa.creditos.index');

    Route::get('/estadisticas', function (Request $request) use ($buildStats) {
        $range = $request->query('range', '12m'); // '12m' | 'ytd' | '30d'
        return response()->json(['stats' => $buildStats($range)]);
    })->name('api.sa.estadisticas');
});
