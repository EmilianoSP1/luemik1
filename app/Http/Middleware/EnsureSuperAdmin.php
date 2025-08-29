<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Si no hay usuario (por si alguien puso el middleware sin 'auth')
        if (!$user) {
            // Si es petición API/JSON, responde 401; si no, manda a login
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        // Acepta cualquiera de estas tres formas de marcar superadmin
        $isSuper =
            (Schema::hasColumn('users', 'is_superadmin') && (int)($user->is_superadmin ?? 0) === 1) ||
            (Schema::hasColumn('users', 'superadmin')    && (int)($user->superadmin ?? 0) === 1) ||
            (Schema::hasColumn('users', 'role')          && (($user->role ?? 'user') === 'superadmin'));

        if (! $isSuper) {
            // Para APIs devuelve 403 en JSON; para web redirige a inicio
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
            return redirect()->route('home')->with('error', 'No tienes permisos para acceder.');
            // Si prefieres cortar en seco:
            // abort(403);
        }

        return $next($request);
    }
}
