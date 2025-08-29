<?php

// app/Models/Product.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'slug','nombre','img','img2','images',
        'precio','precio_anterior','descripcion',
    ];

    protected $casts = [
        'images' => 'array',
    ];



    // app/Models/Product.php
public function getRouteKeyName(): string
{
    return 'slug';
}



}

