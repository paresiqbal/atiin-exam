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
            font-size: 12px;
        }

        /* ── Header ─────────────────────────────────────── */
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #111;
            padding-bottom: 14px;
        }

        .header h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .header .meta {
            font-size: 11px;
            color: #555;
        }

        /* ── Sections ───────────────────────────────────── */
        .section {
            margin-top: 16px;
        }

        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 6px;
            border-left: 3px solid #111;
            padding-left: 7px;
        }

        /* ── Letter body ────────────────────────────────── */
        .letter-body {
            font-size: 12px;
            line-height: 1.65;
            margin-top: 10px;
        }

        .letter-body p {
            margin: 0 0 8px 0;
        }

        /* ── Score highlight box ─────────────────────────── */
        .score-box {
            display: inline-block;
            border: 1.5px solid #111;
            border-radius: 6px;
            padding: 8px 20px;
            margin: 10px 0;
            text-align: center;
        }

        .score-box .score-label {
            font-size: 10px;
            color: #555;
        }

        .score-box .score-value {
            font-size: 22px;
            font-weight: bold;
        }

        /* ── Tables ─────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 4px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 7px 9px;
        }

        th {
            background-color: #f3f3f3;
            font-weight: bold;
            text-align: left;
        }

        td.center {
            text-align: center;
        }

        td.right {
            text-align: right;
        }

        .result-lulus {
            color: #166534;
            font-weight: bold;
        }

        .result-tl {
            color: #991b1b;
            font-weight: bold;
        }

        /* ── Recommendation two-column ───────────────────── */
        .rec-table td {
            vertical-align: top;
            width: 50%;
        }

        .rec-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
        }

        .rec-list {
            margin: 0;
            padding-left: 14px;
        }

        .rec-list li {
            margin-bottom: 3px;
        }

        .note {
            font-size: 11px;
            color: #666;
            margin-top: 6px;
        }

        /* ── Signature ───────────────────────────────────── */
        .signature {
            margin-top: 28px;
            font-size: 12px;
        }

        .signature-images {
            position: relative;
            height: 110px;
            margin: 6px 0;
        }

        .signature-images img.ttd {
            position: absolute;
            left: 0;
            top: 10px;
            width: 130px;
        }

        .signature-images img.stempel {
            position: absolute;
            left: 35px;
            top: 0;
            width: 110px;
            opacity: 0.8;
        }
    </style>
</head>

<body>

    {{-- ── Header ── --}}
    <div class="header">
        <h1>Surat Keterangan Hasil Ujian</h1>
        <div class="meta">{{ $exam_name }} &middot; {{ $exam_date ?? '-' }}</div>
    </div>

    {{-- ── Greeting ── --}}
    <div class="letter-body">
        <p>Yang Kami Hormati,</p>
        <p>Orang Tua/Wali dari <strong>{{ $student_name }}</strong></p>
        <p>Email Peserta &nbsp;: {{ $student_email }}<br>
            Nama Sekolah &nbsp;: {{ $school }}<br>
            Kelas &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {{ $class }}</p>
        <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh</em></p>
        <p>
            Segala puji bagi Allah SWT. yang telah menyambungkan silaturahim antara kami dan Bapak/Ibu
            sekeluarga. Salam sejahtera kami sampaikan, semoga senantiasa sukses dalam menjalankan berbagai
            aktivitas sehari-hari.
        </p>
        <p>
            Dengan telah dilaksanakannya <strong>{{ $exam_name }}</strong> pada {{ $exam_date ?? '-' }},
            maka kami sampaikan hasilnya sebagai berikut:
        </p>
    </div>

    {{-- ── Skor UTBK highlight ── --}}
    <div style="text-align:center; margin: 12px 0;">
        <div class="score-box">
            <div class="score-label">Skor UTBK</div>
            <div class="score-value">{{ number_format($skor_utbk_pct, 2) }}</div>
            <div class="score-label">({{ number_format($skor_utbk, 2) }} / 1.525)</div>
        </div>
    </div>

    {{-- ── Block summaries ── --}}
    <div class="section">
        <div class="section-title">Rangkuman Blok Ujian</div>
        <table>
            <thead>
                <tr>
                    <th style="width:36px;">No</th>
                    <th>Bidang Studi</th>
                    <th style="width:170px;">Jawaban Benar</th>
                    <th style="width:140px;">Skor Blok (/ 1000)</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($bank_summaries as $summary)
                    <tr>
                        <td class="center">{{ $summary['index'] }}</td>
                        <td>{{ $summary['bank_name'] }}</td>
                        <td class="right">{{ $summary['correct_count'] }} / {{ $summary['total_questions'] }}</td>
                        <td class="right">{{ number_format($summary['block_score'], 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="center">Belum ada data blok ujian.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ── Program study choices ── --}}
    <div class="section">
        <div class="section-title">Pilihan Program Studi</div>
        <table>
            <thead>
                <tr>
                    <th style="width:36px;">No</th>
                    <th>Universitas / Program Studi</th>
                    <th style="width:130px;">Skor UTBK Kamu</th>
                    <th style="width:130px;">Minimum Skor</th>
                    <th style="width:120px;">Hasil</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($selection_rows as $index => $row)
                    <tr>
                        <td class="center">{{ $index + 1 }}</td>
                        <td>{{ $row['program'] }}</td>
                        <td class="right">{{ number_format($row['skor_utbk_pct'], 2) }}</td>
                        <td class="right">{{ number_format($row['minimum_grade'], 2) }}</td>
                        <td class="{{ $row['is_passed'] ? 'result-lulus' : 'result-tl' }}">
                            {{ $row['result'] }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="center">Belum ada pilihan program studi.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ── Recommendations — only if at least one selection failed ── --}}
    @if ($any_failed)
        <div class="section">
            <div class="section-title">Rekomendasi Pilihan (Maks. 5 Opsi per Kolom)</div>
            <p class="note">
                Berdasarkan Skor UTBK kamu (<strong>{{ number_format($skor_utbk_pct, 2) }}</strong>),
                berikut adalah pilihan program studi lain yang masih dapat kamu jangkau:
            </p>
            <table class="rec-table">
                <thead>
                    <tr>
                        <th>Jurusan Serupa (Universitas Lain)</th>
                        <th>Jurusan Lain (Universitas yang Sama)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            @if (count($major_group_options) > 0)
                                <ul class="rec-list">
                                    @foreach ($major_group_options as $opt)
                                        <li>{{ $opt['label'] }}<br>
                                            <span style="color:#555;">Min. Skor:
                                                {{ number_format($opt['minimum_grade'], 2) }}</span>
                                        </li>
                                    @endforeach
                                </ul>
                            @else
                                <span class="note">Tidak ada rekomendasi yang memenuhi kriteria.</span>
                            @endif
                        </td>
                        <td>
                            @if (count($ptn_group_options) > 0)
                                <ul class="rec-list">
                                    @foreach ($ptn_group_options as $opt)
                                        <li>{{ $opt['label'] }}<br>
                                            <span style="color:#555;">Min. Skor:
                                                {{ number_format($opt['minimum_grade'], 2) }}</span>
                                        </li>
                                    @endforeach
                                </ul>
                            @else
                                <span class="note">Tidak ada rekomendasi yang memenuhi kriteria.</span>
                            @endif
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endif

    {{-- ── Closing ── --}}
    <div class="letter-body" style="margin-top:16px;">
        <p>
            Terima kasih atas kepercayaan Bapak/Ibu kepada BKB. Nurul Fikri, kami akan selalu berupaya menjaga
            kepercayaan tersebut dengan menghadirkan layanan berkualitas.
        </p>
        <p><em>Wassalamu'alaikum Warahmatullahi Wabarakatuh</em></p>
    </div>

    {{-- ── Signature ── --}}
    <div class="signature">
        <div>Manager Operational</div>
        <div>BKB. Nurul Fikri Padang</div>
        <div class="signature-images">
            <img class="ttd" src="{{ public_path('assets/ttd.jpeg') }}" alt="Tanda Tangan">
            <img class="stempel" src="{{ public_path('assets/stempel.png') }}" alt="Stempel">
        </div>
        <div>Rian Eka Putra, S.Pd, M.Si</div>
    </div>

</body>

</html>
