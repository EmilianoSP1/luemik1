<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Stripe\StripeClient;
use Stripe\Exception\ApiErrorException;
use Carbon\Carbon;

class CheckoutController extends Controller
{
    /**
     * Muestra la página de checkout con el carrito actual.
     */
    public function index(Request $request)
    {
        $cart = $this->resolveCart($request);
        $cart->load('items.product');

        $items = $cart->items->map(function ($i) {
            $p = $i->product;

            $unitPriceCents = (int) round(((float) ($p->precio ?? 0)) * 100);
            $qty = (int) ($i->quantity ?? 1);

            return [
                'id' => $p->id,
                'name' => $p->nombre ?? 'Producto',
                'quantity' => $qty,
                'unit_price_cents' => $unitPriceCents,
                'subtotal_cents' => $unitPriceCents * $qty,
                'image' => $p->img ?? null,
                'slug'  => $p->slug ?? null,
            ];
        });

        $total_cents = (int) $items->sum('subtotal_cents');

        return Inertia::render('Checkout/Index', [
            'items'        => $items->values(),
            'total_cents'  => $total_cents,
            'currency'     => 'MXN',
            'stripe_pk'    => config('services.stripe.key'),
            // Estado actual del carrito (para el front)
            'cart' => [
                'id'                   => $cart->id,
                'status'               => $cart->status ?? 'pending',
                'checkout_session_id'  => $cart->checkout_session_id,
                'payment_intent_id'    => $cart->payment_intent_id,
                'paid_at'              => $cart->paid_at ? Carbon::parse($cart->paid_at)->toIso8601String() : null,
            ],
        ]);
    }

    /**
     * Crea la sesión de Stripe Checkout y devuelve la URL.
     */
    public function createSession(Request $request)
    {
        $user = Auth::user();
        $cart = $this->resolveCart($request);
        $cart->load('items.product');

        if ($cart->items->isEmpty()) {
            return response()->json(['message' => 'Tu carrito está vacío.'], 422);
        }

        // Construye line_items desde BD
        $lineItems = [];
        foreach ($cart->items as $ci) {
            $product = $ci->product;
            if (!$product) {
                return response()->json(['message' => 'Producto no encontrado.'], 422);
            }

            $priceCents = (int) round(((float) ($product->precio ?? 0)) * 100);
            if ($priceCents <= 0) {
                return response()->json(['message' => 'Precio inválido.'], 422);
            }

            $lineItems[] = [
                'price_data' => [
                    'currency' => 'mxn',
                    'product_data' => [
                        'name' => $product->nombre ?? 'Producto',
                    ],
                    'unit_amount' => $priceCents,
                ],
                'quantity' => (int) ($ci->quantity ?? 1),
            ];
        }

        $totalCents = collect($lineItems)->sum(fn ($li) => $li['price_data']['unit_amount'] * $li['quantity']);
        if ($totalCents <= 0) {
            return response()->json(['message' => 'El total no puede ser $0.00'], 422);
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));

            // Parámetros de la sesión (con client_reference_id y metadatos)
            $params = [
                'mode'                   => 'payment',
                'payment_method_types'   => ['card'], // agrega 'oxxo' si lo habilitas en Stripe
                'line_items'             => $lineItems,
                'customer_email'         => $user->email,
                'shipping_address_collection' => ['allowed_countries' => ['MX']],
                'phone_number_collection' => ['enabled' => true],
                'billing_address_collection' => 'auto',
                'allow_promotion_codes'  => true,
                'success_url'            => route('checkout.success') . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url'             => route('checkout.cancel'),
                'client_reference_id'    => (string) $cart->id,
                'metadata'               => [
                    'user_id'      => (string) $user->id,
                    'cart_id'      => (string) $cart->id,
                    'total_cents'  => (string) $totalCents,
                ],
                'payment_intent_data'    => [
                    'metadata' => [
                        'user_id' => (string) $user->id,
                        'cart_id' => (string) $cart->id,
                    ],
                ],
            ];

            // Idempotencia basada en payload
            $hash = substr(hash('sha256', json_encode($params, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)), 0, 24);
            $idempotencyKey = 'chk_' . $cart->id . '_' . $hash;

            $session = $stripe->checkout->sessions->create($params, [
                'idempotency_key' => $idempotencyKey,
            ]);

            // Persistir el session id (sin marcar pagado todavía)
            $cart->forceFill([
                'checkout_session_id' => $session->id,
                'status'              => $cart->status === 'paid' ? 'paid' : 'pending',
            ])->save();

            return response()->json(['url' => $session->url]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'message' => 'No se pudo crear la sesión de pago.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Página de éxito: confirma estado y marca el carrito como pagado si corresponde.
     * (El webhook también debe hacerlo como respaldo.)
     */
    public function success(Request $request)
    {
        $sid = $request->query('session_id');
        if (!$sid) {
            // Sin session_id, muestra la página "limpia"
            return Inertia::render('Checkout/Success', [
                'session_id' => null,
                'status'     => null,
                'cartId'     => null,
                'paid'       => false,
            ]);
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            // Expande payment_intent para obtener su ID directo
            $session = $stripe->checkout->sessions->retrieve($sid, ['expand' => ['payment_intent']]);
        } catch (ApiErrorException $e) {
            // Si Stripe falla, muestra info básica
            return Inertia::render('Checkout/Success', [
                'session_id' => $sid,
                'status'     => 'error',
                'cartId'     => null,
                'paid'       => false,
                'debug'      => ['stripe_error' => $e->getMessage()],
            ]);
        }

        // Resuelve el carrito por checkout_session_id o metadata/client_reference_id
        $cart = Cart::where('checkout_session_id', $sid)->first();
        if (!$cart && isset($session->metadata->cart_id)) {
            $cart = Cart::find($session->metadata->cart_id);
        }
        if (!$cart && !empty($session->client_reference_id)) {
            $cart = Cart::find($session->client_reference_id);
        }

        // Si no hay carrito, mostramos info de sesión para depurar
        if (!$cart) {
            return Inertia::render('Checkout/Success', [
                'session_id' => $sid,
                'status'     => 'unknown',
                'cartId'     => null,
                'paid'       => $session->payment_status === 'paid',
                'debug'      => [
                    'client_reference_id' => $session->client_reference_id,
                    'metadata'            => $session->metadata,
                ],
            ]);
        }

        // 🟢 Marca pagado de forma idempotente si Stripe reporta "paid"
        if ($session->payment_status === 'paid') {
            $piId = is_string($session->payment_intent)
                ? $session->payment_intent
                : ($session->payment_intent->id ?? null);

            $cart->forceFill([
                'status'            => 'paid',
                'payment_intent_id' => $piId,
                'paid_at'           => $cart->paid_at ?: Carbon::now(),
            ])->save();
        }

        return Inertia::render('Checkout/Success', [
            'session_id' => $sid,
            'status'     => $cart->status ?? null,
            'cartId'     => $cart->id,
            'paid'       => ($cart->status ?? null) === 'paid',
        ]);
    }

    /**
     * Página cuando el usuario cancela el pago en Stripe.
     */
    public function cancel()
    {
        return Inertia::render('Checkout/Cancel');
    }

    /* ===================== Helpers privados ===================== */

    /**
     * Resuelve (o crea) el carrito del usuario actual.
     * - Si está logueado: usa user_id. Si había carrito por session_id, lo reasigna al user.
     * - Si no: usa session_id (por si habilitas checkout de invitados).
     */
    private function resolveCart(Request $request): Cart
    {
        $sessionId = $request->session()->getId();

        if (Auth::check()) {
            $userId = Auth::id();

            // Si ya existe por user_id, úsalo
            $cart = Cart::firstOrCreate(['user_id' => $userId]);

            // Si había uno huérfano por sesión, mézclalo (opcional)
            $sessionCart = Cart::whereNull('user_id')
                ->where('session_id', $sessionId)
                ->first();

            if ($sessionCart && $sessionCart->id !== $cart->id) {
                // Mover items del sessionCart al cart del usuario (si tienes relación items)
                if ($sessionCart->relationLoaded('items')) {
                    $items = $sessionCart->items;
                } else {
                    $items = $sessionCart->items()->get();
                }
                foreach ($items as $it) {
                    $it->cart_id = $cart->id;
                    $it->save();
                }
                // Borra el carrito de sesión
                $sessionCart->delete();
            }

            // Asegura session_id actual por consistencia
            if (!$cart->session_id) {
                $cart->session_id = $sessionId;
                $cart->save();
            }

            return $cart->fresh();
        }

        // Invitado: usa session_id
        return Cart::firstOrCreate(['session_id' => $sessionId]);
    }
}
