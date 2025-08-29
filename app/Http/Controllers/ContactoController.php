<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactoController extends Controller
{
    public function enviar(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'correo' => 'required|email',
            'mensaje' => 'required|string'
        ]);

        $destinatarios = ['luemikmx@gmail.com', 'mxluemik@hotmail.com'];

        // Opcional: El correo del usuario como "reply-to"
        $replyTo = $data['correo'];

       Mail::send([], [], function ($message) use ($data, $destinatarios, $replyTo) {
    $message->to($destinatarios)
        ->subject('Nuevo mensaje de contacto desde la web')
        ->html(
            "<b>Nombre:</b> {$data['nombre']} <br>".
            "<b>Correo:</b> {$data['correo']} <br><br>".
            "<b>Mensaje:</b> <br>{$data['mensaje']}"
        )
        ->replyTo($replyTo, $data['nombre']);
});


        return response()->json(['success' => true]);
    }
}
