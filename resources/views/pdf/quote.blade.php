@php
    // Formato de moneda
    $fmt   = new \NumberFormatter('es_MX', \NumberFormatter::CURRENCY);
    $money = fn($n) => $fmt->formatCurrency((float)$n, $quote->currency ?? 'MXN');

    // Fechas
    $fecha  = $quote->created_at?->format('d/m/Y');
    $valida = $quote->valid_until ? \Carbon\Carbon::parse($quote->valid_until)->format('d/m/Y') : null;
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cotización {{ $quote->folio }}</title>
<style>
  /* Reset mínimo */
  *{box-sizing:border-box}
  body{font-family:DejaVu Sans, Arial, Helvetica, sans-serif;color:#111;font-size:12px;margin:0}
  .page{padding:28px 30px}

  /* Encabezado */
  .hdr-table{width:100%;border-collapse:collapse;margin-bottom:12px}
  .hdr-left h1{font-size:20px;margin:0 0 2px 0; letter-spacing:.5px}
  .hdr-left .slogan{font-size:11px;color:#666}
  .hdr-center{width:90px}
  .logo-box{width:60px;height:60px;border:1px solid #bdbdbd;border-radius:6px;margin:0 auto}
  .hdr-right{font-style:italic;font-weight:800;font-size:22px;text-align:right;color:#1d3a8a}

  /* Dos columnas inferior del encabezado */
  .info-grid{width:100%;border-collapse:collapse;margin:6px 0 12px 0}
  .info-grid td{vertical-align:top}
  .box-title{font-size:11px;color:#222;margin:0 0 6px 0; text-transform:uppercase; letter-spacing:.3px}
  .muted{color:#666}

  /* Caja simple */
  .box{border:1px solid #d7d7d7;border-radius:8px;padding:12px; background:#fff}
  .box + .box{margin-top:10px}

  /* Tabla de items */
  table.items{width:100%;border-collapse:collapse;margin-top:12px}
  .items th,.items td{border:1px solid #d7d7d7;padding:8px}
  .items th{background:#f3f5fb;color:#1e1f24;font-weight:700}
  .right{text-align:right}
  .center{text-align:center}

  /* Totales */
  table.totals{width:44%;border-collapse:collapse;margin-top:14px;margin-left:auto}
  .totals td{border:1px solid #d7d7d7;padding:8px}
  .totals td:first-child{background:#f8f9fc}
  .totals .grand td{font-weight:700}

  /* Pie */
  .foot{margin-top:16px;font-size:11px;color:#666;text-align:center}
</style>
</head>
<body>
<div class="page">

@php
  $logoPath = public_path('img/logo/logo_negro.png');
  $logoSrc  = file_exists($logoPath)
    ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
    : null;
@endphp

<!-- Encabezado -->
<table class="hdr-table">
  <tr>
    <td class="hdr-left">
      <h1>LUEMIK</h1>
      <div class="slogan">Diseño & confección</div>
    </td>

    <td class="hdr-center">
      <div class="logo-box" style="border:none">
        @if($logoSrc)
          <img src="{{ $logoSrc }}" alt="LUEMIK"
               style="max-width:60px; max-height:60px; display:block; margin:0 auto;">
        @endif
      </div>
    </td>

    <td class="hdr-right">
      Cotización
    </td>
  </tr>
</table>

  <!-- Bloque inferior del header (Izq: empresa/cliente; Der: meta) -->
  <table class="info-grid">
    <tr>
      <td style="width:62%;padding-right:16px">
        {{-- Dirección de la empresa --}}
        <div class="box" style="margin-bottom:10px">
          <p class="box-title"><strong>Dirección</strong></p>
          <div><strong>LUEMIK</strong></div>
          <div class="muted">Atarasquillo</div>
          <div class="muted">Lerma, Estado de México, 52044</div>
          <div class="muted">Teléfonos: 5615593795 · 5578499895</div>
        </div>

        {{-- Cliente --}}
        <div class="box">
          <p class="box-title"><strong>Cotización para</strong></p>
          <div><strong>{{ $quote->customer_name ?? '—' }}</strong></div>
          <div class="muted" style="margin-top:2px">
            @if($quote->customer_email) {{ $quote->customer_email }} @endif
            @if($quote->customer_phone) · {{ $quote->customer_phone }} @endif
          </div>
          <div class="muted" style="margin-top:4px">
            <strong>Dirección:</strong>
            {{ $quote->customer_address ?? '—' }}
          </div>
        </div>
      </td>

      <td style="width:38%;vertical-align:top">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:3px 0;width:48%;color:#333"><strong>FECHA:</strong></td>
            <td style="padding:3px 0">{{ $fecha }}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#333"><strong>N.º COTIZACIÓN:</strong></td>
            <td style="padding:3px 0">{{ $quote->folio }}</td>
          </tr>
          @if($valida)
          <tr>
            <td style="padding:3px 0;color:#333"><strong>Válida hasta:</strong></td>
            <td style="padding:3px 0">{{ $valida }}</td>
          </tr>
          @endif
          <tr>
            <td style="padding:3px 0;color:#333"><strong>Estatus:</strong></td>
            <td style="padding:3px 0">{{ strtoupper($quote->status) }}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Comentarios/indicaciones -->
  <div class="box" style="padding:10px;margin-top:0">
    <span class="box-title" style="display:inline-block;margin:0 6px 0 0"><strong>Comentarios o instrucciones especiales</strong></span>
    <span class="muted">{{ $quote->notes ? $quote->notes : 'Ninguno' }}</span>
  </div>

  <!-- Tabla de ítems -->
  <table class="items">
    <thead>
    <tr>
      <th style="width:16%">Categoría</th>
      <th>Descripción</th>
      <th style="width:12%" class="center">Cantidad</th>
      <th style="width:18%" class="right">Precio unitario</th>
      <th style="width:18%" class="right">Total</th>
    </tr>
    </thead>
    <tbody>
    @forelse($quote->items as $it)
      @php
        $importe = max(($it->qty * $it->unit_price) - ($it->line_discount ?? 0), 0);
      @endphp
      <tr>
        <td>{{ $it->category ?: '—' }}</td>
        <td>{{ $it->name }}</td>
        <td class="center">{{ $it->qty }}</td>
        <td class="right">{{ $money($it->unit_price) }}</td>
        <td class="right">{{ $money($importe) }}</td>
      </tr>
    @empty
      <tr>
        <td colspan="5" class="center muted">Sin conceptos</td>
      </tr>
    @endforelse
    </tbody>
  </table>

  <!-- Totales -->
  <table class="totals">
    <tr>
      <td>SUBTOTAL</td>
      <td class="right">{{ $money($quote->subtotal) }}</td>
    </tr>
    @if(($quote->discount ?? 0) > 0)
    <tr>
      <td>DESCUENTO</td>
      <td class="right">- {{ $money($quote->discount) }}</td>
    </tr>
    @endif
    @if(($quote->shipping ?? 0) > 0)
    <tr>
      <td>ENVÍO</td>
      <td class="right">{{ $money($quote->shipping) }}</td>
    </tr>
    @endif
    @if($quote->apply_tax)
    <tr>
      <td>IVA ({{ $quote->tax_rate }}%)</td>
      <td class="right">{{ $money($quote->tax) }}</td>
    </tr>
    @endif
    <tr class="grand">
      <td>TOTAL</td>
      <td class="right">{{ $money($quote->total) }}</td>
    </tr>
  </table>

  <div class="box" style="margin-top:10px">
    <span class="muted">Si desea realizar alguna consulta con respecto a esta cotización, póngase en contacto con nosotros.</span>
  </div>

  <div class="foot">¡GRACIAS POR SU COMPRA!</div>
</div>
</body>
</html>
