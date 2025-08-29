<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('shipments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('stripe_session_id')->index();
            $t->string('carrier')->nullable();
            $t->string('service_level')->nullable();
            $t->string('tracking_number')->nullable()->index();
            $t->string('tracking_url')->nullable();
            $t->string('label_url')->nullable();
            $t->unsignedBigInteger('rate_id')->nullable();
            $t->integer('shipping_cost_cents')->nullable();
            $t->json('address_to')->nullable();
            $t->json('raw_payload')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('shipments');
    }
};
