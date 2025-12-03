<!-- resources/views/pdfs/student-cards.blade.php -->
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 10mm;
        }

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12mm;
            page-break-inside: avoid;
        }

        .card {
            width: 100%;
            aspect-ratio: 85.6 / 53.98;
            /* Standard ID card ratio */
            background: white;
            border: 1px solid #ddd;
            padding: 8mm;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
        }

        .card-header {
            display: flex;
            gap: 6mm;
            margin-bottom: 6mm;
        }

        .card-avatar {
            width: 18mm;
            height: 18mm;
            background: #e0e0e0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 8pt;
            color: #666;
            flex-shrink: 0;
        }

        .card-header-info {
            flex: 1;
            min-width: 0;
        }

        .card-name {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 1mm;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .card-school {
            font-size: 7pt;
            color: #666;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .card-divider {
            height: 1px;
            background: #e0e0e0;
            margin-bottom: 4mm;
        }

        .card-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3mm;
            font-size: 7pt;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            gap: 2mm;
        }

        .detail-label {
            font-weight: bold;
            min-width: 25mm;
        }

        .detail-value {
            flex: 1;
            word-break: break-word;
            font-family: monospace;
            font-size: 6.5pt;
        }

        .card-photo {
            margin-top: 4mm;
            padding: 3mm;
            border: 1px dashed #bbb;
            text-align: center;
            font-size: 6pt;
            color: #999;
            flex-shrink: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 8mm;
            page-break-after: avoid;
        }

        .header h1 {
            font-size: 18pt;
            margin-bottom: 2mm;
        }

        .header p {
            font-size: 9pt;
            color: #666;
        }

        @media print {
            body {
                padding: 0;
                background: white;
            }

            .card {
                box-shadow: none;
                page-break-inside: avoid;
            }
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Kartu Siswa</h1>
        <p>{{ $school_name }}</p>
        <p style="font-size: 8pt; color: #999;">Dicetak: {{ $generated_at }}</p>
    </div>

    <div class="cards-grid">
        @foreach ($students as $student)
            <div class="card">
                <div class="card-header">
                    <div class="card-avatar">
                        {{ strtoupper(substr($student->name, 0, 1)) }}{{ strtoupper(substr(strrchr($student->name, ' '), 1, 1)) }}
                    </div>
                    <div class="card-header-info">
                        <div class="card-name">{{ $student->name }}</div>
                        <div class="card-school">{{ $school_name }}</div>
                    </div>
                </div>

                <div class="card-divider"></div>

                <div class="card-details">
                    <div class="detail-row">
                        <span class="detail-label">Email</span>
                    </div>
                    <div style="font-size: 6.5pt; font-family: monospace; word-break: break-all;">
                        {{ $student->email }}
                    </div>

                    <div class="detail-row" style="margin-top: 2mm;">
                        <span class="detail-label">Kelas</span>
                        <span class="detail-value">{{ $student->class ?? '-' }}</span>
                    </div>
                </div>

                <div class="card-photo">
                    Placeholder foto — ganti dengan foto resmi saat siap
                </div>
            </div>
        @endforeach
    </div>
</body>

</html>
