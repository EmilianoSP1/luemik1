<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;

class SkydropxClient
{
    protected string $base;
    protected ?string $clientId;
    protected ?string $clientSecret;
    protected array $from;

    public function __construct()
    {
        $cfg = config('services.skydropx');
        $this->base        = rtrim(data_get($cfg, 'base_url', 'https://app.skydropx.com'), '/');
        $this->clientId    = data_get($cfg, 'client_id');
        $this->clientSecret= data_get($cfg, 'client_secret');
        $this->from        = (array) data_get($cfg, 'from', []);
    }

    /** Obtiene (y cachea) el access_token OAuth2 client_credentials */
    public function getAccessToken(): string
    {
        return Cache::remember('skydropx.oauth.token', now()->addMinutes(110), function () {
            $resp = Http::baseUrl($this->base)
                ->asJson()
                ->withHeaders(['Accept' => 'application/json'])
                ->post('/api/v1/oauth/token', [
                    'grant_type'    => 'client_credentials',
                    'client_id'     => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ]);

            if ($resp->failed()) {
                Log::error('Skydropx OAuth failed', ['status' => $resp->status(), 'body' => $resp->body()]);
                $resp->throw(); // lanzará RequestException con detalle del 401/400
            }

            $token   = (string) data_get($resp->json(), 'access_token');
            $expires = (int) data_get($resp->json(), 'expires_in', 7200);

            // Guarda con colchón de 2 minutos
            Cache::put('skydropx.oauth.token', $token, now()->addSeconds(max(60, $expires - 120)));

            return $token;
        });
    }

    /** Helper: cliente HTTP con bearer */
    protected function http()
    {
        return Http::baseUrl($this->base)
            ->withHeaders(['Accept' => 'application/json'])
            ->withToken($this->getAccessToken());
    }

    /** Realiza una petición con reintento si el token expira (401) */
    protected function request(string $method, string $url, array $payload = null)
    {
        $res = $this->http()->{$method}($url, $payload ?? []);
        if ($res->status() === 401) {
            Cache::forget('skydropx.oauth.token');
            $res = $this->http()->{$method}($url, $payload ?? []);
        }
        if ($res->failed()) {
            Log::error('Skydropx HTTP error', ['url'=>$url, 'status'=>$res->status(), 'body'=>$res->body()]);
            $res->throw();
        }
        return $res->json();
    }

    /** Crea una cotización y devuelve la respuesta completa */
    public function quote(array $addressTo, array $parcels, ?string $orderId = null): array
    {
        $payload = [
            'quotation' => [
                'order_id'    => $orderId,
                'address_from'=> [
                    'country_code' => data_get($this->from, 'country', 'MX'),
                    'postal_code'  => (string) data_get($this->from, 'zipcode', ''),
                    'area_level1'  => data_get($this->from, 'state', ''),
                    'area_level2'  => data_get($this->from, 'city', ''),
                    'area_level3'  => data_get($this->from, 'sector', data_get($this->from, 'street2')),
                ],
                'address_to'  => [
                    'country_code' => strtoupper($addressTo['country'] ?? 'MX'),
                    'postal_code'  => (string) ($addressTo['zipcode'] ?? ''),
                    'area_level1'  => $addressTo['province'] ?? '',
                    'area_level2'  => $addressTo['city'] ?? '',
                    'area_level3'  => $addressTo['sector'] ?? ($addressTo['street2'] ?? ''),
                ],
                'parcels'     => collect($parcels)->map(fn ($p) => [
                    'length' => (int) $p['length'],
                    'width'  => (int) $p['width'],
                    'height' => (int) $p['height'],
                    'weight' => (float) $p['weight'],
                ])->values()->all(),
            ],
        ];

        return $this->request('post', '/api/v1/quotations', $payload);
    }

    /** Escoge la tarifa más barata de una respuesta de cotización */
    public function pickBestRate(array $quotation): ?array
    {
        $rates = data_get($quotation, 'rates', []);
        if (!is_array($rates) || empty($rates)) return null;

        usort($rates, function ($a, $b) {
            $ta = (float) ($a['total'] ?? $a['amount'] ?? 0);
            $tb = (float) ($b['total'] ?? $b['amount'] ?? 0);
            return $ta <=> $tb;
        });

        return $rates[0] ?? null;
    }

    /** Crea un envío a partir de un rate_id */
    public function createShipmentFromRate(string $rateId, array $addressTo, array $packages, string $printingFormat = 'standard'): array
    {
        $addressFrom = [
            'street1'   => data_get($this->from, 'street1', ''),
            'name'      => data_get($this->from, 'name', 'Remitente'),
            'company'   => data_get($this->from, 'company', ''),
            'phone'     => data_get($this->from, 'phone', ''),
            'email'     => data_get($this->from, 'email', ''),
            'reference' => data_get($this->from, 'street2', ''),
        ];

        $addrTo = [
            'street1'   => $addressTo['street1'] ?? '',
            'name'      => $addressTo['name'] ?? 'Cliente',
            'company'   => $addressTo['company'] ?? '',
            'phone'     => $addressTo['phone'] ?? '',
            'email'     => $addressTo['email'] ?? '',
            'reference' => $addressTo['reference'] ?? ($addressTo['street2'] ?? ''),
        ];

        $payload = [
            'shipment' => [
                'rate_id'        => $rateId,
                'printing_format'=> $printingFormat, // standard | thermal
                'address_from'   => $addressFrom,
                'address_to'     => $addrTo,
                'packages'       => collect($packages)->values()->map(function ($pkg, $i) {
                    return [
                        'package_number'    => (string) ($pkg['package_number'] ?? ($i + 1)),
                        'package_protected' => (bool) ($pkg['package_protected'] ?? false),
                        'declared_value'    => data_get($pkg, 'declared_value'),
                        'package_type'      => data_get($pkg, 'package_type'),
                        'consignment_note'  => data_get($pkg, 'consignment_note'),
                        'products'          => data_get($pkg, 'products'),
                    ];
                })->all(),
            ],
        ];

        return $this->request('post', '/api/v1/shipments', $payload);
    }

    /** Recupera un envío */
    public function getShipment(string $id): array
    {
        return $this->request('get', '/api/v1/shipments/' . $id);
    }

    /** Extrae tracking/label del response del shipment */
    public function extractPackageInfo(array $shipment): array
    {
        $included = (array) data_get($shipment, 'included', []);
        // En la API puede llamarse "packages" o "package"
        $pkg = collect($included)->firstWhere('type', 'package')
            ?? collect($included)->firstWhere('type', 'packages')
            ?? (count($included) ? $included[0] : []);

        return [
            'tracking_number' => data_get($pkg, 'attributes.tracking_number'),
            'tracking_url'    => data_get($pkg, 'attributes.tracking_url_provider'),
            'label_url'       => data_get($pkg, 'attributes.label_url'),
        ];
    }
}

