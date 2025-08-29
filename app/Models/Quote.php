<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    protected $fillable = [
        'folio','customer_name','customer_email','customer_phone',
        'valid_until','currency','subtotal','discount','tax','shipping','total',
        'apply_tax','tax_rate','status','notes'
    ];

    protected $casts = [
        'apply_tax' => 'boolean',
        'valid_until' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }
}
