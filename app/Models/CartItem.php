<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory;

    /**
     * MUY IMPORTANTE: si estos campos no están en $fillable,
     * $cart->items()->create([...]) NO insertará nada.
     */
    protected $fillable = [
        'cart_id',
        'product_id',
        'size',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'cart_id'    => 'integer',
        'product_id' => 'integer',
        'quantity'   => 'integer',
        'unit_price' => 'decimal:2',
        'size'       => 'string',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
