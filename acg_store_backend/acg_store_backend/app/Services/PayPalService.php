<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Thin wrapper around the PayPal REST API (Orders v2 + Payments v2).
 * Uses the sandbox unless PAYPAL_MODE=live.
 */
class PayPalService
{
    protected function baseUrl(): string
    {
        return config('services.paypal.mode') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    protected function accessToken(): string
    {
        $cacheKey = 'paypal_access_token_' . config('services.paypal.mode');

        if ($token = Cache::get($cacheKey)) {
            return $token;
        }

        $clientId = config('services.paypal.client_id');
        $secret = config('services.paypal.secret');

        if (! $clientId || ! $secret) {
            throw new RuntimeException('PayPal credentials are missing. Set PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env.');
        }

        $response = Http::withBasicAuth($clientId, $secret)
            ->asForm()
            ->post($this->baseUrl() . '/v1/oauth2/token', ['grant_type' => 'client_credentials']);

        if (! $response->successful()) {
            throw new RuntimeException('Unable to authenticate with PayPal: ' . $response->body());
        }

        $token = $response->json('access_token');
        $ttl = max(60, (int) $response->json('expires_in', 300) - 60);
        Cache::put($cacheKey, $token, $ttl);

        return $token;
    }

    protected function request(string $method, string $path, array $body = [], ?string $requestId = null)
    {
        $http = Http::withToken($this->accessToken())
            ->acceptJson()
            ->contentType('application/json');

        if ($requestId) {
            $http = $http->withHeaders(['PayPal-Request-Id' => $requestId]);
        }

        // An empty array would be sent as [] — PayPal expects {} for empty bodies.
        $payload = empty($body) ? '{}' : json_encode($body);

        return $http->withBody($payload, 'application/json')
            ->send($method, $this->baseUrl() . $path);
    }

    /**
     * Create a PayPal order for one of our orders.
     *
     * @return array{id: string, approval_url: string}
     */
    public function createOrder(string $invoiceNumber, float $itemTotal, float $shipping, array $items, string $returnUrl, string $cancelUrl): array
    {
        $currency = config('services.paypal.currency', 'MYR');
        $fmt = fn ($n) => number_format($n, 2, '.', '');
        $total = $itemTotal + $shipping;

        $body = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'invoice_id' => $invoiceNumber,
                'description' => 'ACG Store order ' . $invoiceNumber,
                'amount' => [
                    'currency_code' => $currency,
                    'value' => $fmt($total),
                    'breakdown' => [
                        'item_total' => ['currency_code' => $currency, 'value' => $fmt($itemTotal)],
                        'shipping' => ['currency_code' => $currency, 'value' => $fmt($shipping)],
                    ],
                ],
                'items' => array_map(fn ($i) => [
                    'name' => Str::limit($i['name'], 120, ''),
                    'quantity' => (string) $i['quantity'],
                    'unit_amount' => ['currency_code' => $currency, 'value' => $fmt($i['unit_price'])],
                ], $items),
            ]],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'brand_name' => config('app.name', 'ACG Store'),
                        'user_action' => 'PAY_NOW',
                        'shipping_preference' => 'NO_SHIPPING',
                        'return_url' => $returnUrl,
                        'cancel_url' => $cancelUrl,
                    ],
                ],
            ],
        ];

        $response = $this->request('POST', '/v2/checkout/orders', $body, (string) Str::uuid());

        if (! $response->successful()) {
            throw new RuntimeException('PayPal create order failed: ' . $response->body());
        }

        $approval = collect($response->json('links', []))
            ->first(fn ($link) => in_array($link['rel'] ?? '', ['payer-action', 'approve'], true));

        if (! $approval) {
            throw new RuntimeException('PayPal did not return an approval link.');
        }

        return ['id' => $response->json('id'), 'approval_url' => $approval['href']];
    }

    /**
     * Capture an approved PayPal order. Returns the decoded PayPal response.
     */
    public function captureOrder(string $paypalOrderId): array
    {
        $response = $this->request('POST', "/v2/checkout/orders/{$paypalOrderId}/capture", [], 'capture-' . $paypalOrderId);

        if (! $response->successful()) {
            throw new RuntimeException('PayPal capture failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Fully refund a captured payment. Returns the decoded PayPal response.
     */
    public function refundCapture(string $captureId): array
    {
        $response = $this->request('POST', "/v2/payments/captures/{$captureId}/refund", [], 'refund-' . $captureId);

        if (! $response->successful()) {
            throw new RuntimeException('PayPal refund failed: ' . $response->body());
        }

        return $response->json();
    }
}
