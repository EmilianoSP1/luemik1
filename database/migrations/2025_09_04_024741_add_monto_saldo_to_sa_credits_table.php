<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sa_credits', function (Blueprint $table) {
            if (!Schema::hasColumn('sa_credits','monto')) {
                $table->decimal('monto', 10, 2)->default(0)->after('folio');
            }
            if (!Schema::hasColumn('sa_credits','saldo')) {
                $table->decimal('saldo', 10, 2)->default(0)->after('monto');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sa_credits', function (Blueprint $table) {
            if (Schema::hasColumn('sa_credits','saldo')) $table->dropColumn('saldo');
            if (Schema::hasColumn('sa_credits','monto')) $table->dropColumn('monto');
        });
    }
};
