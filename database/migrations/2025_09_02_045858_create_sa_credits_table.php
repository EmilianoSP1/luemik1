<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sa_credits', function (Blueprint $table) {
            $table->id();

            // Identificación
            $table->unsignedBigInteger('folio')->unique();   // Folio visible (ej. 18)
            $table->unsignedBigInteger('client_id')->nullable()->index(); // Si luego quieres relacionar con users/clients
            $table->string('client')->nullable();            // Nombre del cliente si no hay relación

            // Montos
            $table->decimal('amount', 12, 2)->default(0);    // Monto total
            $table->decimal('paid',   12, 2)->default(0);    // Pagado acumulado
            $table->decimal('balance',12, 2)->default(0);    // Saldo pendiente

            // Condiciones del crédito
            $table->unsignedSmallInteger('rate')->default(0);                 // % interés (0–100)
            $table->unsignedInteger('term')->default(0);                      // Duración numérica
            $table->enum('term_unit', ['dias','semanas','meses'])->default('semanas');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();                             // “Vence”

            // Estado y forma de pago
            $table->enum('status', ['pendiente','pagado','vencido','cancelado'])
                  ->default('pendiente')->index();
            $table->string('mode')->nullable();                                // contado/transferencia/tarjeta/etc.

            // Metadatos opcionales
            $table->string('batch_id', 64)->nullable()->index();               // vínculo con sa_batches si aplica
            $table->json('items')->nullable();                                 // conceptos/partidas
            $table->json('meta')->nullable();                                  // extras
            $table->text('notes')->nullable();                                 // notas libres

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sa_credits');
    }
};
