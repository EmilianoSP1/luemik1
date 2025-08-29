<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: no falla si ya existe
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products (slug)');
            return;
        }

        if ($driver === 'mysql') {
            // MySQL: verifica en information_schema
            $exists = DB::table('information_schema.STATISTICS')
                ->whereRaw('TABLE_SCHEMA = DATABASE()')
                ->where('TABLE_NAME', 'products')
                ->where('INDEX_NAME', 'products_slug_unique')
                ->exists();

            if (! $exists) {
                Schema::table('products', function (Blueprint $table) {
                    $table->unique('slug', 'products_slug_unique');
                });
            }

            return;
        }

        // Fallback genérico: intenta crear y, si ya existe, ignora el error
        try {
            Schema::table('products', function (Blueprint $table) {
                $table->unique('slug', 'products_slug_unique');
            });
        } catch (\Throwable $e) {
            // ignora duplicados
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: no hay DROP IF EXISTS para índices named únicos vía Schema; intenta y captura
            try {
                Schema::table('products', function (Blueprint $table) {
                    $table->dropUnique('products_slug_unique');
                });
            } catch (\Throwable $e) {}
            return;
        }

        if ($driver === 'mysql') {
            // Solo elimina si existe
            $exists = DB::table('information_schema.STATISTICS')
                ->whereRaw('TABLE_SCHEMA = DATABASE()')
                ->where('TABLE_NAME', 'products')
                ->where('INDEX_NAME', 'products_slug_unique')
                ->exists();

            if ($exists) {
                Schema::table('products', function (Blueprint $table) {
                    $table->dropUnique('products_slug_unique');
                });
            }
            return;
        }

        // Fallback
        try {
            Schema::table('products', function (Blueprint $table) {
                $table->dropUnique('products_slug_unique');
            });
        } catch (\Throwable $e) {}
    }
};
