<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cookie;

class CartController extends Controller
{
    /**
     * Cola la cookie 'guest_cart' con dominio/flags correctos.
     */
    protected function queueGuestCartCookie(string $cartId): void
    {
        $minutes = 60 * 24 * 30;                       // 30 días
        $domain  = config('session.domain');           // p.ej. null, 'localhost', '.mi-dominio.test'
        $secure  = (bool) config('session.secure', false);
        $same    = config('session.same_site', 'lax'); // 'lax' por defecto

        Cookie::queue(cookie(
            'guest_cart',
            $cartId,
            $minutes,
            '/',            // path
            $domain,        // domain
            $secure,        // secure
            false,          // httpOnly
            false,          // raw
            $same           // sameSite
        ));
    }

    /**
     * Borra la cookie 'guest_cart' respetando dominio.
     */
    protected function forgetGuestCartCookie(): void
    {
        Cookie::queue(Cookie::forget('guest_cart', '/', config('session.domain')));
    }

    /**
     * Resuelve el carrito actual.
     * - Invitado: por session_id y además guarda cookie 'guest_cart' con el cart_id.
     * - Autenticado: por user_id y FUSIONA carrito invitado usando cookie 'guest_cart' (más confiable que session_id).
     */
    protected function resolveCart(Request $request): Cart
    {
        $sessionId   = $request->session()->getId();
        $guestCartId = (string) ($request->cookie('guest_cart') ?? '');

        if (auth()->check()) {
            $userId  = auth()->id();

            // Carrito del usuario
            $userCart = Cart::firstOrCreate(
                ['user_id' => $userId],
                ['session_id' => $sessionId]
            );

            // 1) Intentamos fusionar con cookie 'guest_cart'
            $guestCart = null;
            if ($guestCartId !== '') {
                $guestCart = Cart::whereNull('user_id')
                    ->where('id', $guestCartId)
                    ->with('items')
                    ->first();
            }

            // 2) Fallback: si no hay cookie válida, intentamos por session_id actual
            if (!$guestCart) {
                $guestCart = Cart::whereNull('user_id')
                    ->where('session_id', $sessionId)
                    ->with('items')
                    ->first();
            }

            if ($guestCart && $guestCart->id !== $userCart->id) {
                DB::transaction(function () use ($guestCart, $userCart) {
                    foreach ($guestCart->items as $gItem) {
                        $uItem = $userCart->items()
                            ->where('product_id', $gItem->product_id)
                            ->when(
                                is_null($gItem->size),
                                fn ($q) => $q->whereNull('size'),
                                fn ($q) => $q->where('size', $gItem->size)
                            )
                            ->first();

                        if ($uItem) {
                            $uItem->increment('quantity', $gItem->quantity);
                            if (!is_null($gItem->unit_price)) {
                                $uItem->unit_price = $gItem->unit_price;
                                $uItem->save();
                            }
                            $gItem->delete();
                        } else {
                            $gItem->cart_id = $userCart->id;
                            $gItem->save();
                        }
                    }
                    $guestCart->delete();
                });

                // Borramos cookie porque ya se fusionó
                $this->forgetGuestCartCookie();
            }

            // Alineamos session_id actual
            if ($userCart->session_id !== $sessionId) {
                $userCart->session_id = $sessionId;
                $userCart->save();
            }

            return $userCart;
        }

        // Invitado: trabajamos por session_id
        $cart = Cart::firstOrCreate(['session_id' => $sessionId]);

        // Persistimos el id del carrito de invitado por 30 días (con dominio correcto)
        if ($guestCartId !== (string) $cart->id) {
            $this->queueGuestCartCookie((string) $cart->id);
        }

        return $cart;
    }

    /**
     * Devuelve los items del carrito con su producto.
     * (TIP: puedes llamar /cart?debug=1 temporalmente si quieres ver cart_id/user_id en la respuesta)
     */
    public function index(Request $request)
    {
        $cart = $this->resolveCart($request)->load('items.product');

        $payload = [
            'items' => $cart->items,
        ];

        if ($request->boolean('debug')) {
            $payload['_debug'] = [
                'cart_id'    => $cart->id,
                'user_id'    => $cart->user_id,
                'session_id' => $cart->session_id,
                'items_cnt'  => $cart->items->count(),
            ];
        }

        return response()->json($payload);
    }

    /**
     * Agrega un producto (merge por product_id + size).
     */
    public function addItem(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity'   => ['nullable', 'integer', 'min:1'],
            'size'       => ['nullable', 'string', 'max:50'],
        ]);

        $qty  = $data['quantity'] ?? 1;
        $size = isset($data['size']) && $data['size'] !== '' ? $data['size'] : null;

        $cart = $this->resolveCart($request);

        // Usar 'precio' de tu tabla products; si algún día tienes 'price', también lo soporta.
        $product   = Product::findOrFail($data['product_id']);
        $unitPrice = $product->precio ?? ($product->price ?? 0);

        DB::transaction(function () use ($cart, $data, $size, $qty, $unitPrice) {
            $query = $cart->items()->where('product_id', $data['product_id']);
            is_null($size) ? $query->whereNull('size') : $query->where('size', $size);

            $item = $query->first();

            if ($item) {
                $item->increment('quantity', $qty);
                $item->unit_price = $unitPrice;
                $item->save();
            } else {
                $cart->items()->create([
                    'product_id' => $data['product_id'],
                    'size'       => $size,
                    'quantity'   => $qty,
                    'unit_price' => $unitPrice,
                ]);
            }
        });

        $cart->load('items.product');

        return response()->json([
            'items' => $cart->items
        ], 201);
    }

    /**
     * Actualiza cantidad de un item (PATCH).
     */
    public function updateItem(Request $request, CartItem $item)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cart = $this->resolveCart($request);
        abort_if($item->cart_id !== $cart->id, 403);

        $item->update(['quantity' => $data['quantity']]);

        $cart->load('items.product');
        return response()->json([
            'items' => $cart->items
        ]);
    }

    /**
     * Elimina un item del carrito actual por ID.
     */
    public function removeItem(Request $request)
    {
        $data = $request->validate([
            'item_id' => ['required', 'integer'],
        ]);

        $cart = $this->resolveCart($request);
        $cart->items()->whereKey($data['item_id'])->delete();

        $cart->load('items.product');
        return response()->json([
            'items' => $cart->items
        ]);
    }

    /**
     * Vacía el carrito actual.
     */
    public function clear(Request $request)
    {
        $cart = $this->resolveCart($request);
        $cart->items()->delete();

        $cart->load('items.product');
        return response()->json([
            'items' => $cart->items
        ]);
    }
}
