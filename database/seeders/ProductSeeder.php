<?php

// database/seeders/ProductSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['nombre'=>'Blassed T-Shirt','slug'=>'blassed-t-shirt','precio'=>199,'images'=>['/img/catalogo/Blassed.jpg','/img/catalogo/blassing.jpg'],'descripcion'=>'Playera con gráfica “Blassed”.'],
            ['nombre'=>'Blasing','slug'=>'blasing','precio'=>199,'images'=>['/img/catalogo/blassing.jpg']],
            ['nombre'=>'Fight','slug'=>'fight','precio'=>199,'images'=>['/img/catalogo/fight.jpg']],
            ['nombre'=>'Sufer T-Shirt','slug'=>'sufer-tshirt','precio'=>199,'images'=>['/img/catalogo/sufer.jpg']],
            ['nombre'=>'Angel Oversize','slug'=>'angel-oversize','precio'=>199,'images'=>['/img/catalogo/angeloversize.jpg']],
            ['nombre'=>'Blessed Saint','slug'=>'blessed-saint','precio'=>199,'images'=>['/img/catalogo/blessed.jpg']],
            ['nombre'=>'Good Vibes','slug'=>'good-vibes','precio'=>145,'precio_anterior'=>170,'images'=>['/img/catalogo/goodvibes.jpg']],
            ['nombre'=>'Art Graffiti','slug'=>'art-graffiti','precio'=>165,'images'=>['/img/catalogo/graffiti.jpg']],
            ['nombre'=>'Old School','slug'=>'old-school','precio'=>150,'images'=>['/img/catalogo/oldschool.jpg']],
            ['nombre'=>'Sunset Dream','slug'=>'sunset-dream','precio'=>158,'images'=>['/img/catalogo/sunset.jpg']],
            ['nombre'=>'White Letter','slug'=>'white-letter','precio'=>120,'images'=>['/img/catalogo/whiteletter.jpg']],
            ['nombre'=>'Minimal Crew','slug'=>'minimal-crew','precio'=>135,'images'=>['/img/catalogo/minimal.jpg']],
        ];

        foreach ($items as $it) {
            $slug = $it['slug'] ?? Str::slug($it['nombre']);
            Product::updateOrCreate(
                ['slug'=>$slug],
                [
                    'nombre'          => $it['nombre'],
                    'precio'          => $it['precio'],
                    'precio_anterior' => $it['precio_anterior'] ?? null,
                    'descripcion'     => $it['descripcion'] ?? null,
                    'images'          => $it['images'] ?? [],
                    'img'             => $it['images'][0] ?? null,
                    'img2'            => $it['images'][1] ?? null,
                ]
            );
        }
    }
}

