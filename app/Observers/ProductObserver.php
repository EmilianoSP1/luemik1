<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Str;

class ProductObserver
{
    public function creating(Product $product): void
    {
        if (blank($product->slug) && filled($product->name)) {
            $product->slug = $this->uniqueSlug($product->name);
        }
    }

    public function updating(Product $product): void
    {
        // Si cambia el nombre y no fijaste slug manualmente, lo regeneramos
        if ($product->isDirty('name') && ! $product->isDirty('slug')) {
            $product->slug = $this->uniqueSlug($product->name, $product->id);
        }
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;

        while (
            Product::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
