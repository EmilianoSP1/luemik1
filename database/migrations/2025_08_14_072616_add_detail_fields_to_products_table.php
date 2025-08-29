<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 👇 clave: slug como nullable (SQLite no deja NOT NULL sin default)
            $table->string('slug')->nullable()->after('id');

            $table->string('img2')->nullable()->after('img');

            // Para SQLite usa text; Laravel lo castea a array en el modelo
            $table->text('images')->nullable()->after('img2');

            $table->decimal('precio_anterior', 8, 2)->nullable()->after('precio');
            $table->text('descripcion')->nullable()->after('precio_anterior');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['slug','img2','images','precio_anterior','descripcion']);
        });
    }
};
