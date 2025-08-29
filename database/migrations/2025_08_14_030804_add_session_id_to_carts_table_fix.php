<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // En SQLite, agregar columna sí está soportado.
        Schema::table('carts', function (Blueprint $table) {
            if (!Schema::hasColumn('carts', 'session_id')) {
                $table->string('session_id')->nullable()->after('user_id');
                $table->index('session_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            // En SQLite, dropIndex/dropColumn funcionan en la mayoría de casos recientes
            if (Schema::hasColumn('carts', 'session_id')) {
                // El nombre del índice implícito puede variar; usar arreglo es más seguro
                $table->dropIndex(['session_id']);
                $table->dropColumn('session_id');
            }
        });
    }
};
