<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureSuperAdmin;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Alias de middlewares (aquí va tu superadmin)
        $middleware->alias([
            'superadmin' => EnsureSuperAdmin::class,
        ]);

        // Si quieres, aquí también puedes registrar middlewares globales o de grupos.
        // $middleware->appendToGroup('web', \App\Http\Middleware\VerifyCsrfToken::class);
        // $middleware->appendToGroup('api', \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
