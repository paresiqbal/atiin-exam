<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
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
            color: #0f172a;
        }

        /* Header (matches FE "page header" vibe) */
        .header {
            text-align: center;
            margin-bottom: 8mm;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: 700;
            margin-bottom: 1mm;
        }

        .header .school {
            font-size: 9pt;
            color: #334155;
        }

        .header .meta {
            font-size: 8pt;
            color: #94a3b8;
            margin-top: 1mm;
        }

        /* DOMPDF-friendly 3 columns: fixed mm to avoid overflow */
        table.grid {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        td.cell {
            width: 33.333%;
            vertical-align: top;
            padding: 0 4mm 6mm 0;
        }

        tr td:last-child {
            padding-right: 0;
        }

        /* Card: mimic FE card */
        .card {
            border: 1px solid #e5e7eb;
            background: #ffffff;
            border-radius: 3mm;
            /* dompdf supports small radius well */
            padding: 4mm;
        }

        .row {
            width: 100%;
            display: table;
        }

        .row>div {
            display: table-cell;
            vertical-align: middle;
        }

        /* Header row inside card: avatar + name/school */
        .avatar {
            width: 12mm;
            height: 12mm;
            border-radius: 50%;
            background: #e5e7eb;
            color: #64748b;
            font-weight: 700;
            text-align: center;
            vertical-align: middle;
            font-size: 9pt;
        }

        .info {
            padding-left: 3mm;
        }

        .name {
            font-size: 9.5pt;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .schoolName {
            margin-top: 0.5mm;
            font-size: 7pt;
            color: #64748b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 3mm 0;
        }

        /* Details: mimic FE spacing and sizes */
        .label {
            font-size: 7pt;
            font-weight: 700;
            color: #334155;
            margin-bottom: 1mm;
        }

        .mono {
            font-family: monospace;
            font-size: 7pt;
            color: #0f172a;
            word-break: break-all;
        }

        .kv {
            display: table;
            width: 100%;
            margin-top: 3mm;
        }

        .kv .k,
        .kv .v {
            display: table-cell;
            font-size: 7pt;
        }

        .kv .k {
            font-weight: 700;
            color: #334155;
        }

        .kv .v {
            text-align: right;
            color: #0f172a;
        }

        .photo {
            margin-top: 3mm;
            border: 1px dashed #cbd5e1;
            border-radius: 2mm;
            padding: 2mm;
            text-align: center;
            font-size: 6.5pt;
            color: #94a3b8;
        }

        /* keep cards from splitting */
        .card,
        td.cell {
            page-break-inside: avoid;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Kartu Siswa</h1>
        <div class="school">{{ $school_name }}</div>
        <div class="meta">Dicetak: {{ $generated_at }}</div>
    </div>

    @php
        // make rows of 3 for the table
        $chunks = $students->chunk(3);
    @endphp

    <table class="grid">
        @foreach ($chunks as $row)
            <tr>
                @foreach ($row as $student)
                    @php
                        $name = trim($student->name ?? '');
                        $parts = preg_split('/\s+/', $name);
                        $first = strtoupper(substr($parts[0] ?? '?', 0, 1));
                        $last = strtoupper(substr($parts[count($parts) - 1] ?? '?', 0, 1));
                        $initials = $first . $last;
                    @endphp

                    <td class="cell">
                        <div class="card">
                            <div class="row">
                                <div class="avatar">{{ $initials }}</div>
                                <div class="info">
                                    <div class="name">{{ $student->name }}</div>
                                    <div class="schoolName">{{ $school_name }}</div>
                                </div>
                            </div>

                            <div class="divider"></div>

                            <div class="label">Email</div>
                            <div class="mono">{{ $student->email }}</div>

                            <div class="kv">
                                <div class="k">Sekolah</div>
                                <div class="v">{{ $student->school->name ?? '-' }}</div>
                            </div>

                            <div class="kv">
                                <div class="k">Kelas</div>
                                <div class="v">{{ $student->class ?? '-' }}</div>
                            </div>

                            <div class="photo">
                                Placeholder foto siswa — ganti dengan foto resmi saat siap.
                            </div>
                        </div>
                    </td>
                @endforeach

                {{-- fill empty cells to keep table consistent --}}
                @for ($i = $row->count(); $i < 3; $i++)
                    <td class="cell"></td>
                @endfor
            </tr>
        @endforeach
    </table>
</body>

</html>
