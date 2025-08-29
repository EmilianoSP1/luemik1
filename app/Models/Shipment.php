<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = [
        'user_id','stripe_session_id','carrier','service_level',
        'tracking_number','tracking_url','label_url','rate_id',
        'shipping_cost_cents','address_to','raw_payload'
    ];

    protected $casts = [
        'address_to'  => 'array',
        'raw_payload' => 'array',
    ];
}
