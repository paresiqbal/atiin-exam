<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\FacadesDB;

class StudentAccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $user->checkProExpiration();

        return Inertia::render('student/payments/PaymentIndex', [
            'account' => [
                'account_type' => $user->account_type ?? 'regular',
                'is_pro' => $user->isPro(),
                'pro_expires_at' => $user->pro_expires_at,
            ],
            'benefits' => [
                'Akses fitur premium (contoh: analitik / export / latihan tambahan)',
                'Prioritas support',
                'Tanpa iklan (kalau ada)',
            ],
            'how_to_upgrade' => [
                'Transfer manual sesuai instruksi admin',
                'Upload bukti transfer di halaman ini',
                'Tunggu admin approve (biasanya cepat)',
            ],
        ]);
    }
}
