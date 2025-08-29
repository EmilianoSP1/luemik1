<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;
use Symfony\Component\HttpFoundation\Response;
use Stripe\Webhook;
use App\Services\SkydropxClient;
use App\Models\Shipment;
use App\Models\Cart;

class StripeWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        // 1) Verificar firma de Stripe
        try {
            $event = Webhook::constructEvent($request->getContent(), $sigHeader, $secret);
            Log::info('Stripe webhook OK', ['type' => $event->type]);
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);
            return response('Invalid signature', Response::HTTP_BAD_REQUEST);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                /** @var \Stripe\Checkout\Session $session */
                $session = $event->data->object;

                if (($session->payment_status ?? null) !== 'paid') {
                    Log::info('checkout.session.completed recibido pero no pagado', [
                        'session' => $session->id,
                        'payment_status' => $session->payment_status ?? null,
                    ]);
                    return response('ok', 200);
                }

                // Idempotencia: evita guías duplicadas
                if (Shipment::where('stripe_session_id', $session->id)->exists()) {
                    Log::info('Webhook duplicado ignorado', ['session' => $session->id]);
                    return response('ok', 200);
                }

                // 2) Dirección: usa shipping si existe, si no billing (customer_details.address)
                $ship = $session->shipping_details ?? null;
                $cust = $session->customer_details ?? null;

                $addr = $ship->address ?? ($cust->address ?? null);
                if (!$addr) {
                    Log::warning('checkout.session.completed sin address (ni shipping ni billing)', ['session' => $session->id]);
                    return response('ok', 200);
                }

                Log::info('Checkout address recibido', [
                    'session' => $session->id,
                    'from'    => ($ship && $ship->address) ? 'shipping' : 'billing',
                    'addr'    => [
                        'line1'       => $addr->line1 ?? null,
                        'line2'       => $addr->line2 ?? null,
                        'city'        => $addr->city ?? null,
                        'state'       => $addr->state ?? null,
                        'postal_code' => $addr->postal_code ?? null,
                        'country'     => $addr->country ?? null,
                    ],
                ]);

                $addressTo = [
                    'name'     => ($ship->name ?? $cust->name ?? 'Cliente'),
                    'street1'  => $addr->line1 ?? '',
                    'street2'  => $addr->line2 ?? '',
                    'zipcode'  => $addr->postal_code ?? '',
                    'city'     => $addr->city ?? '',
                    'province' => $addr->state ?? '',
                    'country'  => strtoupper($addr->country ?? 'MX'),
                    'phone'    => $cust->phone ?? null,
                    'email'    => $cust->email ?? null,
                    // Para quotation, usaremos street2 como area_level3 si aplica
                    'sector'   => $addr->line2 ?? null,
                ];

                // Validación mínima
                if (!($addressTo['street1'] && $addressTo['zipcode'] && $addressTo['city'] && $addressTo['province'])) {
                    Log::warning('Address incompleto para Skydropx', ['session' => $session->id, 'addressTo' => $addressTo]);
                    return response('ok', 200);
                }

                // 3) Estimar paquetes desde carrito (metadata.cart_id) o defaults
                $parcels = $this->buildParcelsFromCartMeta($session);

                // Paquetes para /shipments (se referencian por índice 1..N)
                $packagesForShipment = collect($parcels)->keys()->map(fn ($i) => ['package_number' => (string) ($i + 1)])->all();

                try {
                    $client = new SkydropxClient();

                    // 4) Cotización
                    $quotation = $client->quote($addressTo, $parcels, $session->id);

                    // 5) Mejor tarifa
                    $best = $client->pickBestRate($quotation);
                    if (!$best || empty($best['id'] ?? null)) {
                        Log::error('Skydropx sin rates disponibles', [
                            'session'   => $session->id,
                            'quotation' => $quotation,
                        ]);
                        return response('ok', 200);
                    }

                    // 6) Crear envío (guía)
                    $shipmentRes = $client->createShipmentFromRate(
                        $best['id'],
                        $addressTo,
                        $packagesForShipment,
                        'standard' // o 'thermal' si usas térmica
                    );

                    // 7) Extraer tracking/label
                    $pkgInfo = $client->extractPackageInfo($shipmentRes);

                    // 8) Guardar en DB
                    $userId = (int) data_get($session, 'metadata.user_id') ?: null;

                    Shipment::create([
                        'user_id'             => $userId,
                        'stripe_session_id'   => $session->id,
                        'carrier'             => $best['provider_name'] ?? null,
                        'service_level'       => $best['provider_service_code'] ?? null,
                        'rate_id'             => $best['id'],
                        'shipping_cost_cents' => (int) round(((float) ($best['total'] ?? $best['amount'] ?? 0) * 100)),
                        'tracking_number'     => $pkgInfo['tracking_number'] ?? null,
                        'tracking_url'        => $pkgInfo['tracking_url'] ?? null,
                        'label_url'           => $pkgInfo['label_url'] ?? null,
                        'address_to'          => $addressTo,
                        'raw_payload'         => ['quotation' => $quotation, 'shipment' => $shipmentRes],
                    ]);

                    Log::info('Guía Skydropx generada', [
                        'session'  => $session->id,
                        'tracking' => $pkgInfo['tracking_number'] ?? null,
                    ]);
                } catch (RequestException $e) {
                    Log::error('Skydropx HTTP error', [
                        'session' => $session->id,
                        'status'  => optional($e->response)->status(),
                        'body'    => optional($e->response)->body(),
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Error al crear guía en Skydropx', [
                        'session' => $session->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
                break;

            default:
                Log::info('Evento Stripe recibido', ['type' => $event->type]);
        }

        return response('ok', 200);
    }

    /**
     * Estima paquetes a partir del carrito (metadata.cart_id).
     * Heurística: 0.5 kg por unidad (mín 1 kg, máx 5 kg), caja 32x22x12.
     * Si no hay carrito: 1kg / 30x20x10.
     */
    private function buildParcelsFromCartMeta($session): array
    {
        $default = [[ 'weight' => 1, 'height' => 10, 'width' => 20, 'length' => 30 ]]; // KG/CM

        try {
            $cartId = data_get($session, 'metadata.cart_id');
            if (!$cartId) return $default;

            $cart = Cart::with('items')->find($cartId);
            if (!$cart || $cart->items->isEmpty()) return $default;

            $units  = (int) $cart->items->sum('quantity');
            $weight = max(1, min(5, (int) ceil($units * 0.5)));
            return [[
                'weight' => $weight,
                'height' => 12 + (2 * $units),
                'width'  => 22,
                'length' => 32,
            ]];
        } catch (\Throwable $e) {
            return $default;
        }
    }
}
