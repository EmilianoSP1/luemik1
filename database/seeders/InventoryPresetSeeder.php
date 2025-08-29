<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;

class InventoryPresetSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // MAMMON BLANKS
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Oversize 220g Algodón (pieza)','categoria'=>'Playera','talla'=>'S','stock'=>0,'precio_compra'=>145,'precio_venta'=>199,'color'=>null,'sku'=>null],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Oversize 220g Algodón (12 u)','categoria'=>'Playera','talla'=>'S','stock'=>12,'precio_compra'=>99,'precio_venta'=>149],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Oversize 300g Algodón (pieza)','categoria'=>'Playera','talla'=>'S','stock'=>0,'precio_compra'=>230,'precio_venta'=>289],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Oversize 300g Algodón (12 u)','categoria'=>'Playera','talla'=>'S','stock'=>12,'precio_compra'=>180,'precio_venta'=>239],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Premium 250g Algodón (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>195,'precio_venta'=>249],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Premium 250g Algodón (12 u)','categoria'=>'Playera','stock'=>12,'precio_compra'=>155,'precio_venta'=>219],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera Oversize 240g Poliéster (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>135,'precio_venta'=>189],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera tipo polo 250g Algodón (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>255,'precio_venta'=>319],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Playera tipo polo 250g Algodón (10 u)','categoria'=>'Playera','stock'=>10,'precio_compra'=>199,'precio_venta'=>279],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Sudadera Oversize 400g Algodón (pieza)','categoria'=>'Sudadera','stock'=>0,'precio_compra'=>350,'precio_venta'=>449],
            ['proveedor'=>'MAMMON BLANKS','nombre'=>'Sudadera Oversize 400g Algodón (10 u)','categoria'=>'Sudadera','stock'=>10,'precio_compra'=>280,'precio_venta'=>369],

            // Player Tlax (solo ejemplos representativos; puedes clonar y variar talla/color)
            ['proveedor'=>'Player Tlax','nombre'=>'Oversize color 220g (30 u)','categoria'=>'Playera','stock'=>30,'precio_compra'=>60,'precio_venta'=>110],
            ['proveedor'=>'Player Tlax','nombre'=>'Oversize color 220g (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>70,'precio_venta'=>120],
            ['proveedor'=>'Player Tlax','nombre'=>'Oversize blanco 220g (30 u)','categoria'=>'Playera','stock'=>30,'precio_compra'=>55,'precio_venta'=>105],
            ['proveedor'=>'Player Tlax','nombre'=>'Oversize blanco 220g (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>65,'precio_venta'=>115],
            ['proveedor'=>'Player Tlax','nombre'=>'Regular color 190g (30 u S/M/L/XL)','categoria'=>'Playera','stock'=>120,'precio_compra'=>36,'precio_venta'=>75],

            // Say México (ejemplos)
            ['proveedor'=>'Say México','nombre'=>'Regular 180g (12 u)','categoria'=>'Playera','stock'=>12,'precio_compra'=>100,'precio_venta'=>149],
            ['proveedor'=>'Say México','nombre'=>'Oversize 220g (6 u)','categoria'=>'Playera','stock'=>6,'precio_compra'=>135,'precio_venta'=>189],
            ['proveedor'=>'Say México','nombre'=>'BoxiFit 250g (3-5 u)','categoria'=>'Playera','stock'=>5,'precio_compra'=>175,'precio_venta'=>229],

            // ESSENZA SHIRTS MX (ejemplos)
            ['proveedor'=>'ESSENZA SHIRTS MX','nombre'=>'Regular Caballero 180g (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>79,'precio_venta'=>119],
            ['proveedor'=>'ESSENZA SHIRTS MX','nombre'=>'Regular Caballero 180g (1-10 u)','categoria'=>'Playera','stock'=>10,'precio_compra'=>69,'precio_venta'=>109],
            ['proveedor'=>'ESSENZA SHIRTS MX','nombre'=>'Regular Dama 180g (pieza)','categoria'=>'Playera','stock'=>0,'precio_compra'=>79,'precio_venta'=>119],
        ];

        foreach ($rows as $r) {
            InventoryItem::firstOrCreate(
                ['proveedor' => $r['proveedor'], 'nombre' => $r['nombre']],
                $r
            );
        }
    }
}
