<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Providers\FortifyServiceProvider; // <-- IMPORTANTE

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Alias de middlewares
        $middleware->alias([
            'superadmin' => EnsureSuperAdmin::class,
        ]);
    })
    ->withProviders([
        FortifyServiceProvider::class,   // <-- AGREGA ESTO
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
