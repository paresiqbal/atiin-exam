<?php

namespace Database\Seeders;

use App\Models\University;
use Illuminate\Database\Seeder;

class UniversitySeeder extends Seeder
{
    public function run(): void
    {
        $universities = [
            [
                'name' => 'Universitas Indonesia (UI)',
                'code' => 'UI',
                'city' => 'Depok',
                'description' => 'Kampus Perjuangan, Universitas tertua di Indonesia',
                'website' => 'https://www.ui.ac.id',
            ],
            [
                'name' => 'Universitas Gadjah Mada (UGM)',
                'code' => 'UGM',
                'city' => 'Yogyakarta',
                'description' => 'Universitas kerakyatan yang berakar kuat pada budaya bangsa',
                'website' => 'https://www.ugm.ac.id',
            ],
            [
                'name' => 'Institut Teknologi Bandung (ITB)',
                'code' => 'ITB',
                'city' => 'Bandung',
                'description' => 'Institusi pendidikan teknik tertua di Indonesia',
                'website' => 'https://www.itb.ac.id',
            ],
            [
                'name' => 'IPB University',
                'code' => 'IPB',
                'city' => 'Bogor',
                'description' => 'Institut Pertanian Bogor - Leading innovation in agriculture',
                'website' => 'https://ipb.ac.id',
            ],
            [
                'name' => 'Institut Teknologi Sepuluh Nopember (ITS)',
                'code' => 'ITS',
                'city' => 'Surabaya',
                'description' => 'Kampus teknologi dan maritim terdepan',
                'website' => 'https://www.its.ac.id',
            ],
            [
                'name' => 'Universitas Airlangga (UNAIR)',
                'code' => 'UNAIR',
                'city' => 'Surabaya',
                'description' => 'Excellence with Morality',
                'website' => 'https://www.unair.ac.id',
            ],
            [
                'name' => 'Universitas Padjadjaran (UNPAD)',
                'code' => 'UNPAD',
                'city' => 'Sumedang', // Main campus is in Jatinangor, Sumedang
                'description' => 'Universitas berkelas dunia yang nyata bagi Jawa Barat',
                'website' => 'https://www.unpad.ac.id',
            ],
            [
                'name' => 'Universitas Diponegoro (UNDIP)',
                'code' => 'UNDIP',
                'city' => 'Semarang',
                'description' => 'Universitas riset yang unggul',
                'website' => 'https://www.undip.ac.id',
            ],
        ];

        foreach ($universities as $uni) {
            University::create($uni);
        }
    }
}
