<?php
// database/migrations/2025_08_13_000003_add_unique_index_to_cart_items.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            // Evita duplicados del mismo producto/talla en el mismo carrito
            $table->unique(['cart_id', 'product_id', 'size'], 'cart_items_cart_product_size_unique');
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique('cart_items_cart_product_size_unique');
        });
    }
};
