<!-- resources/views/pdfs/official-letter.blade.php -->
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        * {
            font-family: Arial, sans-serif;
        }

        body {
            margin: 0;
            padding: 24px;
            color: #111;
        }

        .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #111;
            padding-bottom: 16px;
        }

        .header h1 {
            margin: 0 0 6px 0;
            font-size: 20px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .meta {
            font-size: 12px;
            color: #555;
        }

        .section {
            margin-top: 18px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .info-grid {
            border: 1px solid #ddd;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 6px;
        }

        .info-row span:first-child {
            color: #555;
            width: 35%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
        }

        th {
            background-color: #f3f3f3;
            text-align: left;
        }

        td.num {
            width: 40px;
            text-align: center;
        }

        td.right {
            text-align: right;
        }

        .note {
            font-size: 12px;
            color: #555;
            margin-top: 14px;
        }

        .letter-body {
            font-size: 12.5px;
            line-height: 1.6;
            margin-top: 12px;
        }

        .letter-body p {
            margin: 0 0 10px 0;
        }

        .guidance-table {
            margin-top: 8px;
        }

        .option-title {
            font-weight: bold;
            font-size: 12px;
        }

        .option-list {
            margin: 6px 0 0 0;
            padding-left: 16px;
            font-size: 12px;
        }

        .signature {
            margin-top: 28px;
            font-size: 12px;
        }

        .signature-line {
            margin-top: 6px;
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }

        .signature-block {
            width: 55%;
        }

        .signature-images {
            position: relative;
            height: 120px;
            margin-top: 6px;
        }

        .signature-images img.ttd {
            position: absolute;
            left: 0;
            top: 10px;
            width: 140px;
        }

        .signature-images img.stempel {
            position: absolute;
            left: 40px;
            top: 0;
            width: 120px;
            opacity: 0.8;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Surat Keterangan Hasil Ujian</h1>
        <div class="meta">{{ $exam_name }} &middot; {{ $exam_date ?? '-' }}</div>
    </div>

    <div class="section">
        <div class="letter-body">
            <p>Yang Kami Hormati</p>
            <p>Orang Tua/Wali dari "{{ $student_name }}"</p>
            <p>Email Peserta : {{ $student_email }}</p>
            <p>Nama Sekolah : {{ $school }}</p>
            <p>Kelas : {{ $class }}</p>
            <p>Assalamu'alaikum Warahmatullahi Wabarakatuh</p>
            <p>
                Segala puji bagi Allah SWT. yang telah menyambungkan silaturahim antara kami dan Bapak/Ibu
                sekeluarga. Salam sejahtera kami sampaikan, semoga senantiasa sukses dalam menjalankan berbagai
                aktivitas sehari-hari.
            </p>
            <p>
                Dengan telah dilaksanakannya "{{ $exam_name }}" pada hari {{ $exam_date ?? '-' }}, maka kami sampaikan
                hasilnya sebagai berikut:
            </p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Rangkuman Blok Ujian</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">No</th>
                    <th>Bidang Studi</th>
                    <th style="width: 180px;">Jumlah Jawaban Benar</th>
                    <th style="width: 160px;">Skor Siswa</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($bank_summaries as $summary)
                    <tr>
                        <td class="num">{{ $summary['index'] }}</td>
                        <td>{{ $summary['bank_name'] }}</td>
                        <td class="right">{{ $summary['correct_count'] }} / {{ $summary['total_questions'] }}</td>
                        <td class="right">{{ $summary['score_earned'] }} / {{ $summary['score_total'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">Belum ada data blok ujian.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Pilihan Program Studi</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">No</th>
                    <th>Pilihan Universitas / Program Studi</th>
                    <th style="width: 160px;">Minimum GPA</th>
                    <th style="width: 140px;">Hasil</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($selection_rows as $index => $selection)
                    <tr>
                        <td class="num">{{ $index + 1 }}</td>
                        <td>{{ $selection['program'] }}</td>
                        <td class="right">{{ $selection['minimum_grade'] }}</td>
                        <td>{{ $selection['result'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">Belum ada pilihan program studi.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Panduan Istilah</div>
        <table class="guidance-table">
            <thead>
                <tr>
                    <th style="width: 180px;">Istilah</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Skor Siswa</td>
                    <td>Nilai hasil ujian yang diperoleh peserta.</td>
                </tr>
                <tr>
                    <td>Jumlah Jawaban Benar</td>
                    <td>Total soal yang dijawab benar pada setiap blok ujian.</td>
                </tr>
                <tr>
                    <td>Minimum GPA</td>
                    <td>Ambang nilai minimal untuk dinyatakan lulus pada program studi.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Rekomendasi Pilihan (Maks. 5 Opsi per Kolom)</div>
        @forelse ($selection_rows as $index => $selection)
            <div class="note">Pilihan {{ $index + 1 }}: {{ $selection['program'] }}</div>
            <table>
                <thead>
                    <tr>
                        <th>Based on Major Group</th>
                        <th>PTN Group</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            @if (count($major_group_options) > 0)
                                <ul class="option-list">
                                    @foreach ($major_group_options as $option)
                                        <li>{{ $option['label'] }} (Min: {{ $option['minimum_grade'] }})</li>
                                    @endforeach
                                </ul>
                            @else
                                <div class="note">Belum ada rekomendasi yang memenuhi kriteria.</div>
                            @endif
                        </td>
                        <td>
                            @if (count($ptn_group_options) > 0)
                                <ul class="option-list">
                                    @foreach ($ptn_group_options as $option)
                                        <li>{{ $option['label'] }} (Min: {{ $option['minimum_grade'] }})</li>
                                    @endforeach
                                </ul>
                            @else
                                <div class="note">Belum ada rekomendasi yang memenuhi kriteria.</div>
                            @endif
                        </td>
                    </tr>
                </tbody>
            </table>
        @empty
            <div class="note">Belum ada rekomendasi yang memenuhi kriteria.</div>
        @endforelse
    </div>

    <div class="letter-body">
        <p>
            Terima kasih atas kepercayaan Bapak/Ibu kepada BKB. Nurul Fikri, kami akan selalu berupaya menjaga
            kepercayaan tersebut dengan menghadirkan layanan berkualitas.
        </p>
        <p>Wassalamu'alaikum Warahmatullahi Wabarakatuh</p>
    </div>

    <div class="signature">
        <div>Manager Operational</div>
        <div>BKB. Nurul Fikri Padang</div>
        <div class="signature-line">
            <div class="signature-block">
                <div class="signature-images">
                    <img class="ttd" src="{{ public_path('assets/ttd.jpeg') }}" alt="Tanda Tangan">
                    <img class="stempel" src="{{ public_path('assets/stempel.png') }}" alt="Stempel">
                </div>
                <div>Rian Eka Putra, S.Pd, M.Si</div>
            </div>
        </div>
    </div>
</body>

</html>
