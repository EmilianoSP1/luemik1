<?php

namespace App\Http\Controllers\Sa;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $q          = trim((string) $request->query('q', ''));
        $categoria  = trim((string) $request->query('categoria', ''));
        $proveedor  = trim((string) $request->query('proveedor', ''));
        $perPage    = (int) $request->query('per_page', 12);

        $query = InventoryItem::query();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('nombre', 'like', "%{$q}%")
                   ->orWhere('sku', 'like', "%{$q}%")
                   ->orWhere('color', 'like', "%{$q}%")
                   ->orWhere('talla', 'like', "%{$q}%");
            });
        }
        if ($categoria !== '') $query->where('categoria', $categoria);
        if ($proveedor !== '') $query->where('proveedor', $proveedor);

        $query->orderByDesc('created_at');

        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sku'            => ['nullable','string','max:64'],
            'nombre'         => ['required','string','max:255'],
            'categoria'      => ['nullable','string','max:100'],
            'proveedor'      => ['nullable','string','max:100'],
            'talla'          => ['nullable','string','max:50'],
            'color'          => ['nullable','string','max:50'],
            'stock'          => ['nullable','integer','min:0'],
            'precio_compra'  => ['nullable','numeric','min:0'],
            'precio_venta'   => ['nullable','numeric','min:0'],
            'ubicacion'      => ['nullable','string','max:120'],
            'notas'          => ['nullable','string'],
        ]);

        $item = InventoryItem::create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, InventoryItem $item)
    {
$proveedores = 'in:MAMMON BLANKS,Player Tlax,Say México,ESSENZA SHIRTS MX';

$data = $request->validate([
    'sku'            => ['nullable','string','max:64'],
    'nombre'         => ['required','string','max:255'],
    'categoria'      => ['nullable','string','max:100'],
    // 👇 requerido y restringido a 4 opciones
    'proveedor'      => ['required','string','max:100', $proveedores],
    'talla'          => ['nullable','string','max:50'],
    'color'          => ['nullable','string','max:50'],
    'stock'          => ['nullable','integer','min:0'],
    'precio_compra'  => ['nullable','numeric','min:0'],
    'precio_venta'   => ['nullable','numeric','min:0'],
    'ubicacion'      => ['nullable','string','max:120'],
    'notas'          => ['nullable','string'],
]);


        $item->update($data);
        return response()->json($item);
    }

    public function destroy(InventoryItem $item)
    {
        $item->delete();
        return response()->noContent();
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $q          = trim((string) $request->query('q', ''));
        $categoria  = trim((string) $request->query('categoria', ''));
        $proveedor  = trim((string) $request->query('proveedor', ''));

        $query = InventoryItem::query();
        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('nombre', 'like', "%{$q}%")
                   ->orWhere('sku', 'like', "%{$q}%")
                   ->orWhere('color', 'like', "%{$q}%")
                   ->orWhere('talla', 'like', "%{$q}%");
            });
        }
        if ($categoria !== '') $query->where('categoria', $categoria);
        if ($proveedor !== '') $query->where('proveedor', $proveedor);
        $query->orderBy('nombre');

        $filename = 'inventario_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputs($out, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8
            fputcsv($out, ['SKU','Nombre','Categoría','Proveedor','Talla','Color','Stock','Precio compra','Precio venta','Ubicación','Notas']);
            $query->chunk(100, function ($rows) use ($out) {
                foreach ($rows as $r) {
                    fputcsv($out, [
                        $r->sku, $r->nombre, $r->categoria, $r->proveedor,
                        $r->talla, $r->color, $r->stock,
                        $r->precio_compra, $r->precio_venta, $r->ubicacion, $r->notas
                    ]);
                }
            });
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
