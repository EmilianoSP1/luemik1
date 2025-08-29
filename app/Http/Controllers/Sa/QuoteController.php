<?php

namespace App\Http\Controllers\Sa;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Models\QuoteItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Throwable;

class QuoteController extends Controller
{
    /**
     * Listado + panel Inertia
     */
    public function index(Request $request)
    {
        $quotes = Quote::query()
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q) use ($request) {
                $s = trim((string)$request->search);
                $q->where(function ($w) use ($s) {
                    $w->where('folio', 'like', "%{$s}%")
                      ->orWhere('customer_name', 'like', "%{$s}%");
                });
            })
            ->withCount('items')
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Sa/cotizacion/cotizacion', [
            'quotes'  => $quotes,
            'filters' => [
                'status' => (string) ($request->status ?? ''),
                'search' => (string) ($request->search ?? ''),
            ],
        ]);
    }

    /**
     * Genera el siguiente folio.
     */
    protected function nextFolio(): string
    {
        $next = Quote::count() + 1;
        return 'Q-' . str_pad($next, 6, '0', STR_PAD_LEFT);
    }

        protected function resequenceQuotes(): void
    {
        $quotes = Quote::orderBy('created_at')->orderBy('id')->get(['id','folio','created_at']);

        DB::transaction(function () use ($quotes) {
            $n = 1;
            foreach ($quotes as $q) {
                $nuevo = sprintf('Q-%06d', $n++);
                if ($q->folio !== $nuevo) {
                    $q->folio = $nuevo;
                    $q->save();
                }
            }
        });
    }

    /**
     * Endpoint para re-secuenciar (usado por el front si quieres).
     */
    public function resequence()
    {
        $this->resequenceQuotes();
        return response()->json(['ok' => true]);
    }
    /**
     * Calcula subtotal, impuesto y total.
     */
    protected function computeTotals(array $items, float $discount, float $shipping, bool $applyTax, float|int $taxRate): array
    {
        $subtotal = 0.0;
        foreach ($items as $it) {
            $line = ($it['qty'] * $it['unit_price']) - ($it['line_discount'] ?? 0);
            $subtotal += max((float)$line, 0.0);
        }

        $taxBase = max($subtotal - $discount, 0.0) + $shipping;
        $tax     = $applyTax ? round($taxBase * ((float)$taxRate / 100), 2) : 0.0;
        $total   = max($taxBase + $tax, 0.0);

        return [$subtotal, $tax, $total];
    }

    /**
     * Reglas de validación compartidas para create/update.
     */
    protected function rules(): array
    {
        return [
            'customer_name'           => ['nullable', 'string', 'max:255'],
            'customer_email'          => ['nullable', 'email', 'max:255'],
            'customer_phone'          => ['nullable', 'string', 'max:50'],
            'valid_until'             => ['nullable', 'date'],
            'currency'                => ['required', 'string', 'max:8'],
            'apply_tax'               => ['required', 'boolean'],
            'tax_rate'                => ['required', 'numeric', 'min:0', 'max:50'],
            'shipping'                => ['nullable', 'numeric', 'min:0'],
            'discount'                => ['nullable', 'numeric', 'min:0'],
            'notes'                   => ['nullable', 'string'],
            'items'                   => ['required', 'array', 'min:1'],
            'items.*.category'        => ['nullable', 'string', 'max:255'],
            'items.*.name'            => ['required', 'string', 'max:255'],
            'items.*.sku'             => ['nullable', 'string', 'max:255'],
            'items.*.qty'             => ['required', 'integer', 'min:1'],
            'items.*.unit_price'      => ['required', 'numeric', 'min:0'],
            'items.*.line_discount'   => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Crea una cotización (AJAX JSON).
     */
    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        try {
            $quote = DB::transaction(function () use ($data) {
                $discount = (float)($data['discount'] ?? 0);
                $shipping = (float)($data['shipping'] ?? 0);
                [$subtotal, $tax, $total] = $this->computeTotals(
                    $data['items'],
                    $discount,
                    $shipping,
                    (bool)$data['apply_tax'],
                    (float)$data['tax_rate']
                );

                $quote = Quote::create([
                    'folio'         => $this->nextFolio(),
                    'customer_name' => $data['customer_name'] ?? null,
                    'customer_email'=> $data['customer_email'] ?? null,
                    'customer_phone'=> $data['customer_phone'] ?? null,
                    'valid_until'   => $data['valid_until'] ?? null,
                    'currency'      => strtoupper($data['currency'] ?: 'MXN'),
                    'subtotal'      => $subtotal,
                    'discount'      => $discount,
                    'tax'           => $tax,
                    'shipping'      => $shipping,
                    'total'         => $total,
                    'apply_tax'     => (bool) $data['apply_tax'],
                    'tax_rate'      => (int)  $data['tax_rate'],
                    'status'        => 'draft',
                    'notes'         => $data['notes'] ?? null,
                ]);

                foreach ($data['items'] as $it) {
                    $line = max(($it['qty'] * $it['unit_price']) - ($it['line_discount'] ?? 0), 0);
                    QuoteItem::create([
                        'quote_id'      => $quote->id,
                        'category'      => $it['category'] ?? null,
                        'name'          => $it['name'],
                        'sku'           => $it['sku'] ?? null,
                        'qty'           => (int)$it['qty'],
                        'unit_price'    => (float)$it['unit_price'],
                        'line_discount' => (float)($it['line_discount'] ?? 0),
                        'line_total'    => (float)$line,
                    ]);
                }

                return $quote;
            });

            return response()->json(['id' => $quote->id, 'folio' => $quote->folio]);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['message' => 'No se pudo guardar la cotización.'], 500);
        }
    }

    /**
     * Mostrar una cotización (JSON) — útil si la necesitas en el front.
     */
    public function show(Quote $quote)
    {
        return response()->json($quote->load('items'));
    }

    /**
     * Actualiza una cotización (reemplaza items por simplicidad).
     */
    public function update(Request $request, Quote $quote)
    {
        $data = $request->validate($this->rules());

        try {
            DB::transaction(function () use ($data, $quote) {
                $discount = (float)($data['discount'] ?? 0);
                $shipping = (float)($data['shipping'] ?? 0);
                [$subtotal, $tax, $total] = $this->computeTotals(
                    $data['items'],
                    $discount,
                    $shipping,
                    (bool)$data['apply_tax'],
                    (float)$data['tax_rate']
                );

                $quote->update([
                    'customer_name' => $data['customer_name'] ?? null,
                    'customer_email'=> $data['customer_email'] ?? null,
                    'customer_phone'=> $data['customer_phone'] ?? null,
                    'valid_until'   => $data['valid_until'] ?? null,
                    'currency'      => strtoupper($data['currency'] ?: 'MXN'),
                    'subtotal'      => $subtotal,
                    'discount'      => $discount,
                    'tax'           => $tax,
                    'shipping'      => $shipping,
                    'total'         => $total,
                    'apply_tax'     => (bool) $data['apply_tax'],
                    'tax_rate'      => (int)  $data['tax_rate'],
                    'notes'         => $data['notes'] ?? null,
                ]);

                // Reemplazar items
                $quote->items()->delete();
                foreach ($data['items'] as $it) {
                    $line = max(($it['qty'] * $it['unit_price']) - ($it['line_discount'] ?? 0), 0);
                    QuoteItem::create([
                        'quote_id'      => $quote->id,
                        'category'      => $it['category'] ?? null,
                        'name'          => $it['name'],
                        'sku'           => $it['sku'] ?? null,
                        'qty'           => (int)$it['qty'],
                        'unit_price'    => (float)$it['unit_price'],
                        'line_discount' => (float)($it['line_discount'] ?? 0),
                        'line_total'    => (float)$line,
                    ]);
                }
            });

            return response()->json(['ok' => true]);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['message' => 'No se pudo actualizar la cotización.'], 500);
        }
    }

    /**
     * Eliminar
     */
    public function destroy(Quote $quote)
    {
        try {
            DB::transaction(function () use ($quote) {
                $quote->items()->delete();
                $quote->delete();
            });

            // Reacomoda los folios para que no queden huecos
            $this->resequenceQuotes();

            return response()->json(['ok' => true]);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['message' => 'No se pudo eliminar la cotización.'], 500);
        }
    }

    /**
     * Descargar PDF.
     */
    public function pdf(Quote $quote)
    {
        $quote->load('items');

        $pdf = Pdf::loadView('pdf.quote', ['quote' => $quote])
            ->setPaper('letter')
            ->setOptions([
                'isRemoteEnabled' => true,   // por si cargas imágenes por URL
                'dpi'             => 96,
                'defaultFont'     => 'DejaVu Sans',
            ]);

        return $pdf->download("Cotizacion_{$quote->folio}.pdf");
    }

    /**
     * Ver PDF en el navegador (stream).
     */
    public function pdfStream(Quote $quote)
    {
        $quote->load('items');

        $pdf = Pdf::loadView('pdf.quote', ['quote' => $quote])
            ->setPaper('letter')
            ->setOptions([
                'isRemoteEnabled' => true,
                'dpi'             => 96,
                'defaultFont'     => 'DejaVu Sans',
            ]);

        return $pdf->stream("Cotizacion_{$quote->folio}.pdf");
    }
}
