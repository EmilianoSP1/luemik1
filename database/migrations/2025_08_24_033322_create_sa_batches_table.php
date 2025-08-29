<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sa_batches', function (Blueprint $table) {
            $table->id();

            // ID legible que manda el front (B+timestamp+rand). Único por seguridad.
            $table->string('batch_id', 64)->nullable()->unique();

            // Fecha del corte
            $table->date('date')->index();

            // Sumas y metadatos (JSON). Ej:
            // inc_sums: {Otros,Efectivo,Tarjeta,Transferencia}
            // exp_sums: {Efectivo,Tarjeta,Transferencia,Crédito}
            // inc_meta: {otros:[{ruta,cifra}]}
            // exp_meta: {pedido:[{ruta,cifra}], credito:{inicio,fin,meses,total}}
            $table->json('inc_sums')->nullable();
            $table->json('exp_sums')->nullable();
            $table->json('inc_meta')->nullable();
            $table->json('exp_meta')->nullable();

            // Meses de crédito pagados (p. ej. [1,2,3])
            $table->json('credit_paid_months')->nullable();

            // Notas
            $table->text('notas')->nullable();
            $table->text('exp_note')->nullable();

            // ===== Campos de estado/pago (opcionales pero recomendables) =====
            // pending | paid | cancelled
            $table->string('status', 20)->default('pending')->index();

            // Para conciliar con Stripe (opcional, pero útil)
            $table->string('payment_intent_id', 100)->nullable()->index();
            $table->string('checkout_session_id', 100)->nullable()->unique(); // único por idempotencia

            // Cuándo se marcó pagado
            $table->timestamp('paid_at')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sa_batches');
    }
};
