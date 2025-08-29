<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sa_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Relación opcional con el corte/Batch diario si lo manejas por fecha
            $table->foreignId('batch_id')->nullable()->constrained('sa_batches')->nullOnDelete();

            $table->date('date')->index(); // fecha del movimiento
            $table->enum('type', ['ingreso','egreso'])->index();
            $table->decimal('amount', 12, 2);

            $table->string('concept', 160); // concepto libre (texto corto)

            // Motivos estándar + "Otro"
            $table->enum('motivo', [
                'Renta','Pago luz','Retiro caja','Pasaje','DTF','Material','Empleado','Otro'
            ])->index();
            $table->string('motivo_extra', 160)->nullable(); // si motivo = Otro

            // Método de pago / forma de descuento/ingreso
            $table->enum('method', ['Efectivo','Tarjeta','Transferencia','Vales','Externo'])->index();

            // Flag para excluir de sumatorias normales (cuando method = Externo)
            $table->boolean('is_external')->default(false)->index();

            $table->json('meta')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sa_movements');
    }
};
