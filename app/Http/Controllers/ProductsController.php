<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductsController extends Controller
{
    /**
     * Asegura que exista un producto por 'nombre'.
     * Si no existe, lo crea con img/precio recibidos.
     * Devuelve: { id: <int> }
     */
    public function ensure(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'img'    => ['nullable', 'string', 'max:255'],
            'precio' => ['nullable', 'numeric', 'min:0'],
        ]);

        $product = Product::firstOrCreate(
            ['nombre' => $data['nombre']],
            [
                'img'    => $data['img'] ?? null,
                'precio' => $data['precio'] ?? 0,
            ]
        );

        // Si quieres actualizar precio/img al vuelo cuando ya existe:
        $updated = false;
        if (array_key_exists('precio', $data) && $data['precio'] !== null && $product->precio != $data['precio']) {
            $product->precio = $data['precio'];
            $updated = true;
        }
        if (array_key_exists('img', $data) && $product->img !== ($data['img'] ?? null)) {
            $product->img = $data['img'] ?? null;
            $updated = true;
        }
        if ($updated) {
            $product->save();
        }

        return response()->json(['id' => $product->id]);
    }
}
