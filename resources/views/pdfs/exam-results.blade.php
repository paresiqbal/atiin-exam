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
            width: 25%;
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
            margin: 0;
            color: {{ $is_passed ? '#28a745' : '#dc3545' }};
            font-size: 32px;
        }

        .score-section p {
            margin: 10px 0 0 0;
            color: #333;
            font-size: 14px;
        }

        .questions-section {
            margin-top: 30px;
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
    <div class="header">
        <h1>Exam Results</h1>
        <p>{{ $exam_name }}</p>
        <p>Date: {{ $exam_date }}</p>
    </div>

    <div class="student-info">
        <div class="student-info-row">
            <strong>Student Name:</strong>
            <span>{{ $student_name }}</span>
        </div>
        <div class="student-info-row">
            <strong>Email:</strong>
            <span>{{ $student_email }}</span>
        </div>
        <div class="student-info-row">
            <strong>University/Major:</strong>
            <span>{{ $university }} - {{ $major }}</span>
        </div>
        <div class="student-info-row">
            <strong>School/Class:</strong>
            <span>{{ $school }} - {{ $class }}</span>
        </div>
    </div>

    <div class="score-section">
        <h2>{{ $status }}</h2>
        <div style="font-size: 24px; margin: 10px 0;">
            <strong>{{ $score }} / {{ $total_score }}</strong> ({{ $percentage }}%)
        </div>
        <p>Passing Grade Required: {{ $passing_score }}</p>
    </div>

    <div class="questions-section">
        <h3>Question Breakdown</h3>
        @foreach ($questions as $index => $question)
            <div class="question-item">
                <div class="question-header">
                    <div>
                        <div class="question-text">Question {{ $index + 1 }}</div>
                        {{ $question['question_text'] }}
                    </div>
                    <div style="text-align: right;">
                        <span
                            class="question-type">{{ ucfirst(str_replace('_', ' ', $question['question_type'])) }}</span>
                        <span class="points-badge">{{ $question['points_earned'] }}/{{ $question['points'] }}
                            pts</span>
                    </div>
                </div>

                <div class="answer-row {{ $question['is_correct'] ? 'correct' : 'incorrect' }}">
                    <span class="answer-label">Your Answer:</span>
                    {{ $question['student_answer'] ?? 'Not answered' }}
                </div>

                @if (!$question['is_correct'])
                    <div class="answer-row correct">
                        <span class="answer-label">Correct Answer:</span>
                        {{ $question['correct_answer'] }}
                    </div>
                @endif
            </div>
        @endforeach
    </div>

    <div class="footer">
        <p>This document was generated on {{ now()->format('Y-m-d H:i:s') }}</p>
    </div>
</body>

</html>
