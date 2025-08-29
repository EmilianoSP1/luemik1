<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 64)->nullable()->index();
            $table->string('nombre', 255);
            $table->string('categoria', 100)->nullable()->index();
            $table->string('proveedor', 100)->nullable()->index();
            $table->string('talla', 50)->nullable();
            $table->string('color', 50)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->decimal('precio_compra', 10, 2)->nullable();
            $table->decimal('precio_venta', 10, 2)->nullable();
            $table->string('ubicacion', 120)->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
