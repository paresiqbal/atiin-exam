<!-- resources/views/pdfs/exam-results.blade.php -->
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
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
        }

        .header h1 {
            margin: 0 0 5px 0;
            color: #333;
        }

        .header p {
            margin: 5px 0;
            color: #666;
        }

        .student-info {
            background-color: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }

        .student-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .student-info-row strong {
            width: 35%;
            color: #444;
        }

        .score-section {
            background-color: {{ $is_passed ? '#d4edda' : '#f8d7da' }};
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
            text-align: center;
            border: 2px solid {{ $is_passed ? '#28a745' : '#dc3545' }};
        }

        .score-section h2 {
            margin: 0 0 6px 0;
            color: {{ $is_passed ? '#28a745' : '#dc3545' }};
            font-size: 28px;
            letter-spacing: 2px;
        }

        .score-main {
            font-size: 22px;
            margin: 8px 0 4px 0;
            color: #222;
        }

        .score-sub {
            font-size: 13px;
            color: #555;
            margin: 4px 0;
        }

        .score-grid {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 12px;
        }

        .score-box {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 6px;
            padding: 8px 18px;
            min-width: 120px;
        }

        .score-box .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .score-box .value {
            font-size: 20px;
            font-weight: bold;
            color: #222;
        }

        .questions-section {
            margin-top: 30px;
        }

        .subtest-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }

        .subtest-table th,
        .subtest-table td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 12px;
        }

        .subtest-table th {
            background-color: #f0f0f0;
            text-align: left;
        }

        .subtest-table td.num {
            width: 40px;
            text-align: center;
        }

        .subtest-table td.score {
            width: 120px;
            text-align: right;
        }

        .bank-section {
            margin-bottom: 25px;
        }

        .bank-title {
            background-color: #f0f4ff;
            border-left: 5px solid #3b6dd8;
            padding: 10px 12px;
            font-weight: bold;
            color: #1e3f8a;
            margin-bottom: 12px;
        }

        .question-item {
            background-color: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 5px;
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .question-text {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }

        .question-type {
            display: inline-block;
            background-color: #e7f3ff;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            color: #0066cc;
        }

        .points-badge {
            background-color: #fff3cd;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            color: #856404;
        }

        .answer-row {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 3px;
        }

        .correct {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
        }

        .incorrect {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
        }

        .answer-label {
            font-weight: bold;
            margin-right: 10px;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>

<body>
    {{-- Header --}}
    <div class="header">
        <h1>Hasil Ujian</h1>
        <p>{{ $exam_name }}</p>
        <p>Tanggal: {{ $exam_date }}</p>
    </div>

    {{-- Student Info --}}
    <div class="student-info">
        <div class="student-info-row">
            <strong>Nama Siswa</strong>
            <span>{{ $student_name }}</span>
        </div>
        <div class="student-info-row">
            <strong>Email</strong>
            <span>{{ $student_email }}</span>
        </div>
        <div class="student-info-row">
            <strong>Universitas</strong>
            <span>{{ $university }}</span>
        </div>
        <div class="student-info-row">
            <strong>Jurusan</strong>
            <span>{{ $major }}</span>
        </div>
        <div class="student-info-row">
            <strong>Nilai Minimum Jurusan</strong>
            <span>{{ $major_min_gpa }}%</span>
        </div>
        <div class="student-info-row">
            <strong>Sekolah / Kelas</strong>
            <span>{{ $school }} — {{ $class }}</span>
        </div>
    </div>

    {{-- Score summary --}}
    <div class="score-section">
        <h2>{{ $status }}</h2>

        <div class="score-grid">
            <div class="score-box">
                <div class="label">Skor UTBK</div>
                <div class="value">{{ number_format($skor_utbk, 2) }}</div>
            </div>
            <div class="score-box">
                <div class="label">Skor UTBK (%)</div>
                <div class="value">{{ number_format($skor_utbk_pct, 2) }}%</div>
            </div>
            <div class="score-box">
                <div class="label">Nilai Minimum</div>
                <div class="value">{{ $passing_score }}%</div>
            </div>
            @if ($theta !== null)
                <div class="score-box">
                    <div class="label">Kemampuan IRT (θ)</div>
                    <div class="value">{{ $theta }}</div>
                </div>
            @endif
        </div>
    </div>

    {{-- Subtest score table --}}
    <div class="questions-section">
        <h3>Skor Per Subtes</h3>
        <table class="subtest-table">
            <thead>
                <tr>
                    <th style="width:40px;">No</th>
                    <th>Subtes</th>
                    <th style="width:80px; text-align:center;">Benar</th>
                    <th style="width:80px; text-align:center;">Total Soal</th>
                    <th style="width:120px; text-align:right;">Skor Blok</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($question_sections as $section)
                    <tr>
                        <td class="num">{{ $section['bank_index'] }}</td>
                        <td>{{ $section['bank_name'] }}</td>
                        <td style="text-align:center;">{{ $section['correct'] }}</td>
                        <td style="text-align:center;">{{ $section['total'] }}</td>
                        <td class="score">{{ number_format($section['block_score'], 2) }}</td>
                    </tr>
                @endforeach
                <tr style="background:#f0f0f0;">
                    <th colspan="4" style="text-align:right;">Total Skor</th>
                    <th style="text-align:right;">{{ number_format($total_skor, 2) }}</th>
                </tr>
                <tr style="background:#e8f4fd;">
                    <th colspan="4" style="text-align:right;">Skor UTBK</th>
                    <th style="text-align:right;">{{ number_format($skor_utbk, 2) }}</th>
                </tr>
                <tr style="background:#e8f4fd;">
                    <th colspan="4" style="text-align:right;">Skor UTBK (%)</th>
                    <th style="text-align:right;">{{ number_format($skor_utbk_pct, 2) }}%</th>
                </tr>
            </tbody>
        </table>
    </div>

    {{-- Question breakdown --}}
    <div class="questions-section">
        <h3>Rincian Jawaban</h3>
        @foreach ($question_sections as $section)
            <div class="bank-section">
                <div class="bank-title">
                    Blok {{ $section['bank_index'] }}: {{ $section['bank_name'] }}
                </div>
                @foreach ($section['questions'] as $index => $question)
                    <div class="question-item">
                        <div class="question-header">
                            <div>
                                <div class="question-text">Soal {{ $index + 1 }}</div>
                                <div>{!! $question['question_text'] !!}</div>
                            </div>
                            <div style="text-align:right;">
                                <span class="question-type">
                                    {{ ucfirst(str_replace('_', ' ', $question['question_type'])) }}
                                </span>
                                <span class="points-badge">
                                    {{ $question['points_earned'] }}/{{ $question['points'] }} poin
                                </span>
                            </div>
                        </div>

                        {{-- Student answer --}}
                        <div class="answer-row {{ $question['is_correct'] ? 'correct' : 'incorrect' }}">
                            <span class="answer-label">Jawaban Anda:</span>
                            @if (!empty($question['student_answer']))
                                {!! $question['student_answer'] !!}
                            @else
                                Tidak dijawab
                            @endif
                        </div>

                        {{-- Correct answer (only when wrong) --}}
                        @if (!$question['is_correct'])
                            <div class="answer-row correct">
                                <span class="answer-label">Jawaban Benar:</span>
                                {!! $question['correct_answer'] !!}
                            </div>
                        @endif
                    </div>
                @endforeach
            </div>
        @endforeach
    </div>

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis pada {{ now()->format('d-m-Y H:i:s') }}</p>
    </div>
</body>

</html>
