<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SUPERADMIN_EMAIL');
        $pass  = env('SUPERADMIN_PASSWORD');

        if (!$email || !$pass) {
            $this->command?->warn('SUPERADMIN_EMAIL o SUPERADMIN_PASSWORD faltan en .env — se omite SuperAdmin.');
            return;
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name'              => 'Super Admin',
                'email'             => $email,
                'password'          => Hash::make($pass),
                'email_verified_at' => now(),
                'is_superadmin'     => true,
            ]);
        } else {
            $user->update([
                'password'      => Hash::make($pass),
                'is_superadmin' => true,
            ]);
            if (!$user->email_verified_at) {
                $user->email_verified_at = now();
                $user->save();
            }
        }
    }
}
