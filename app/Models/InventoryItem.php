<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku','nombre','categoria','proveedor','talla','color',
        'stock','precio_compra','precio_venta','ubicacion','notas',
    ];

    protected $casts = [
        'stock'          => 'integer',
        'precio_compra'  => 'float',
        'precio_venta'   => 'float',
    ];
}
