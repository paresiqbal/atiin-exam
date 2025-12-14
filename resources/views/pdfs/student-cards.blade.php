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

        @page {
            margin: 10mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #111;
        }

        .header {
            text-align: center;
            margin-bottom: 8mm;
        }

        .header h1 {
            font-size: 16pt;
            margin-bottom: 1mm;
        }

        .header p {
            font-size: 9pt;
            color: #666;
        }

        .header .meta {
            font-size: 8pt;
            color: #999;
            margin-top: 1mm;
        }

        /* DOMPDF friendly 2-column layout */
        table.grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6mm 6mm;
            /* gap between cards */
        }

        td.cell {
            width: 50%;
            /* 2 columns */
            vertical-align: top;
        }

        /* Fixed card size (ID card-ish) */
        .card {
            width: 100%;
            height: 54mm;
            border: 1px solid #ddd;
            background: #fff;
            padding: 6mm;
        }

        .card-header {
            display: table;
            width: 100%;
            margin-bottom: 4mm;
        }

        .avatar {
            display: table-cell;
            width: 16mm;
            height: 16mm;
            border-radius: 50%;
            background: #e8e8e8;
            text-align: center;
            vertical-align: middle;
            font-weight: bold;
            font-size: 9pt;
            color: #666;
        }

        .info {
            display: table-cell;
            padding-left: 4mm;
            vertical-align: middle;
        }

        .name {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 1mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .school {
            font-size: 7pt;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .divider {
            height: 1px;
            background: #e5e5e5;
            margin: 3mm 0 3mm 0;
        }

        .label {
            font-size: 7pt;
            font-weight: bold;
            color: #444;
            margin-bottom: 1mm;
        }

        .email {
            font-family: monospace;
            font-size: 7pt;
            word-break: break-all;
            color: #111;
            margin-bottom: 3mm;
        }

        .row {
            display: table;
            width: 100%;
        }

        .row .left {
            display: table-cell;
            font-size: 7pt;
            font-weight: bold;
            color: #444;
            width: 18mm;
        }

        .row .right {
            display: table-cell;
            font-size: 7pt;
            color: #111;
            text-align: right;
        }

        .photo {
            margin-top: 4mm;
            border: 1px dashed #bbb;
            padding: 2mm;
            font-size: 6.5pt;
            color: #999;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Kartu Siswa</h1>
        <p>{{ $school_name }}</p>
        <div class="meta">Dicetak: {{ $generated_at }}</div>
    </div>

    @php
        // chunk students 2 per row for 2-column layout
        $rows = $students->chunk(2);
    @endphp

    <table class="grid">
        @foreach ($rows as $row)
            <tr>
                @foreach ($row as $student)
                    @php
                        $parts = preg_split('/\s+/', trim($student->name ?? ''));
                        $first = strtoupper(substr($parts[0] ?? '?', 0, 1));
                        $last = strtoupper(substr($parts[count($parts) - 1] ?? '?', 0, 1));
                        $initials = $first . $last;
                    @endphp

                    <td class="cell">
                        <div class="card">
                            <div class="card-header">
                                <div class="avatar">{{ $initials }}</div>
                                <div class="info">
                                    <div class="name">{{ $student->name }}</div>
                                    <div class="school">{{ $school_name }}</div>
                                </div>
                            </div>

                            <div class="divider"></div>

                            <div class="label">Email</div>
                            <div class="email">{{ $student->email }}</div>

                            <div class="row">
                                <div class="left">Kelas</div>
                                <div class="right">{{ $student->class ?? '-' }}</div>
                            </div>

                            <div class="photo">
                                Placeholder foto — ganti dengan foto resmi saat siap
                            </div>
                        </div>
                    </td>
                @endforeach

                {{-- fill empty cell if odd number of students --}}
                @if ($row->count() === 1)
                    <td class="cell"></td>
                @endif
            </tr>
        @endforeach
    </table>
</body>

</html>
