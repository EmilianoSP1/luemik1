<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Product;

class ProductController extends Controller
{
    /**
     * Muestra el detalle de un producto por slug.
     * Fuente de verdad: BASE DE DATOS.
     */
    public function show(string $slug)
    {
        // 1) Trae el producto por slug (404 si no existe)
        $product = Product::where('slug', $slug)->firstOrFail();

        // 2) Normaliza imágenes:
        //    - Si 'images' es JSON (array de strings u objetos {url})
        //    - Si no hay, cae a columnas 'img' / 'img2'
        $images = collect($product->images ?? [])
            ->map(function ($it) {
                if (is_string($it)) return $it;          // ["url1","url2"]
                if (is_array($it)) return $it['url'] ?? null; // [{"url":"..."}, ...]
                if (is_object($it)) return $it->url ?? null;  // colección de modelos con ->url
                return null;
            })
            ->filter()
            ->values()
            ->all();

        if (!$images) {
            $images = array_values(array_filter([
                $product->img ?? null,
                $product->img2 ?? null,
            ]));
        }

        // 3) Fallback por si no hay ninguna imagen válida
        $fallback = '/img/catalogo/placeholder.jpg'; // asegúrate que exista en /public/img/catalogo/
        if (!$images) {
            $images = [$fallback];
        }

        // 4) Respuesta para la vista Show.jsx
        return Inertia::render('Producto/Show', [
            'product' => [
                'slug'           => $product->slug,
                'nombre'         => $product->nombre ?? $product->name ?? 'Producto',
                'precio'         => isset($product->precio)
                    ? '$ ' . number_format((float) $product->precio, 2)
                    : '$ —',
                'precioAnterior' => isset($product->precio_anterior)
                    ? '$ ' . number_format((float) $product->precio_anterior, 2)
                    : null,
                'descripcion'    => $product->descripcion ?? $product->description ?? null,

                // Galería completa + compatibilidad con tu Show.jsx
                'images'         => $images,
                'img'            => $images[0] ?? $fallback,
                'img2'           => $images[1] ?? null,
            ],
        ]);
    }
}
