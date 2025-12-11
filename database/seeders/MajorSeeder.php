<?php

namespace Database\Seeders;

use App\Models\University;
use Illuminate\Database\Seeder;

class MajorSeeder extends Seeder
{
    public function run(): void
    {
        // Define the majors for each university key
        $data = [
            'Universitas Indonesia (UI)' => [
                ['name' => 'Ilmu Komputer', 'description' => 'Computer Science & AI', 'minimum_passing_grade' => 85],
                ['name' => 'Kedokteran', 'description' => 'Pendidikan Dokter Umum', 'minimum_passing_grade' => 88],
                ['name' => 'Hukum', 'description' => 'Ilmu Hukum dan Perundang-undangan', 'minimum_passing_grade' => 82],
            ],
            'Universitas Gadjah Mada (UGM)' => [
                ['name' => 'Psikologi', 'description' => 'Ilmu perilaku manusia', 'minimum_passing_grade' => 80],
                ['name' => 'Teknik Sipil', 'description' => 'Infrastruktur dan konstruksi', 'minimum_passing_grade' => 78],
                ['name' => 'Manajemen', 'description' => 'Bisnis dan Ekonomi', 'minimum_passing_grade' => 82],
            ],
            'Institut Teknologi Bandung (ITB)' => [
                ['name' => 'Teknik Informatika', 'description' => 'Software Engineering & Computation', 'minimum_passing_grade' => 88],
                ['name' => 'Desain Komunikasi Visual', 'description' => 'Seni dan Desain Digital', 'minimum_passing_grade' => 79],
                ['name' => 'Teknik Industri', 'description' => 'Optimasi sistem industri', 'minimum_passing_grade' => 83],
            ],
            'IPB University' => [
                ['name' => 'Agribisnis', 'description' => 'Bisnis pertanian modern', 'minimum_passing_grade' => 75],
                ['name' => 'Ilmu Gizi', 'description' => 'Nutrisi dan kesehatan pangan', 'minimum_passing_grade' => 78],
                ['name' => 'Teknologi Pangan', 'description' => 'Food Tech & Processing', 'minimum_passing_grade' => 77],
            ],
            'Institut Teknologi Sepuluh Nopember (ITS)' => [
                ['name' => 'Sistem Informasi', 'description' => 'Manajemen data dan teknologi', 'minimum_passing_grade' => 84],
                ['name' => 'Teknik Kelautan', 'description' => 'Rekayasa laut dan offshore', 'minimum_passing_grade' => 76],
                ['name' => 'Arsitektur', 'description' => 'Desain bangunan dan lingkungan', 'minimum_passing_grade' => 79],
            ],
            'Universitas Airlangga (UNAIR)' => [
                ['name' => 'Farmasi', 'description' => 'Obat-obatan dan kesehatan', 'minimum_passing_grade' => 81],
                ['name' => 'Kedokteran Gigi', 'description' => 'Kesehatan gigi dan mulut', 'minimum_passing_grade' => 83],
                ['name' => 'Akuntansi', 'description' => 'Keuangan dan audit', 'minimum_passing_grade' => 79],
            ],
            'Universitas Padjadjaran (UNPAD)' => [
                ['name' => 'Ilmu Komunikasi', 'description' => 'Jurnalistik dan Humas', 'minimum_passing_grade' => 84],
                ['name' => 'Hubungan Internasional', 'description' => 'Diplomasi dan politik global', 'minimum_passing_grade' => 85],
                ['name' => 'Sastra Inggris', 'description' => 'Bahasa dan budaya Inggris', 'minimum_passing_grade' => 76],
            ],
            'Universitas Diponegoro (UNDIP)' => [
                ['name' => 'Kesehatan Masyarakat', 'description' => 'Public Health', 'minimum_passing_grade' => 78],
                ['name' => 'Teknik Mesin', 'description' => 'Rekayasa mekanikal', 'minimum_passing_grade' => 77],
                ['name' => 'Oseanografi', 'description' => 'Ilmu kelautan', 'minimum_passing_grade' => 74],
            ],
        ];

        // Loop through the array and insert data
        foreach ($data as $uniName => $majors) {
            // Find the university by name
            $university = University::where('name', $uniName)->first();

            // If university exists, create the majors for it
            if ($university) {
                foreach ($majors as $major) {
                    $university->majors()->create($major);
                }
            }
        }
    }
}
