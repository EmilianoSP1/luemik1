<?php

// database/migrations/xxxx_xx_xx_add_payment_columns_to_sa_batches_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sa_batches', function (Blueprint $table) {
            if (!Schema::hasColumn('sa_batches', 'status')) {
                $table->string('status')->default('pending');
            }
            if (!Schema::hasColumn('sa_batches', 'paid_at')) {
                $table->timestamp('paid_at')->nullable();
            }
            if (!Schema::hasColumn('sa_batches', 'payment_intent_id')) {
                $table->string('payment_intent_id')->nullable();
            }
            if (!Schema::hasColumn('sa_batches', 'checkout_session_id')) {
                $table->string('checkout_session_id')->nullable();
            }
            if (!Schema::hasColumn('sa_batches', 'batch_id')) {
                $table->string('batch_id')->nullable()->unique();
            }
        });
    }

    public function down(): void {
        Schema::table('sa_batches', function (Blueprint $table) {
            foreach (['status','paid_at','payment_intent_id','checkout_session_id'] as $col) {
                if (Schema::hasColumn('sa_batches', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
