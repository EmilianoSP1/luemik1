<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $rows = DB::table('products')
            ->select('id','nombre','slug')
            ->whereNull('slug')
            ->orWhere('slug','')
            ->get();

        foreach ($rows as $r) {
            $base = Str::slug($r->nombre ?? 'producto-'.$r->id);
            $slug = $base;
            $n = 1;

            while (
                DB::table('products')
                    ->where('slug', $slug)
                    ->where('id', '!=', $r->id)
                    ->exists()
            ) {
                $slug = $base.'-'.$n++;
            }

            DB::table('products')->where('id', $r->id)->update(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        DB::table('products')->update(['slug' => null]);
    }
};
