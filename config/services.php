<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],

'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],

 'skydropx' => [
        'base_url'     => env('SKYDROPX_BASE_URL', 'https://app.skydropx.com'),
        'client_id'    => env('SKYDROPX_CLIENT_ID'),
        'client_secret'=> env('SKYDROPX_CLIENT_SECRET'),

        'from' => [
            'name'    => env('SKYDROPX_FROM_NAME', 'Remitente'),
            'company' => env('SKYDROPX_FROM_COMPANY', ''),
            'street1' => env('SKYDROPX_FROM_STREET1', ''),
            'street2' => env('SKYDROPX_FROM_STREET2', ''),
            'city'    => env('SKYDROPX_FROM_CITY', ''),
            'state'   => env('SKYDROPX_FROM_STATE', ''),
            'zipcode' => env('SKYDROPX_FROM_ZIP', ''),
            'country' => env('SKYDROPX_FROM_COUNTRY', 'MX'),
            'phone'   => env('SKYDROPX_FROM_PHONE', ''),
            'email'   => env('SKYDROPX_FROM_EMAIL', ''),
            // Para quotation usamos street2 como “area_level3” por defecto:
            'sector'  => env('SKYDROPX_FROM_STREET2', ''),
        ],
    ],
];