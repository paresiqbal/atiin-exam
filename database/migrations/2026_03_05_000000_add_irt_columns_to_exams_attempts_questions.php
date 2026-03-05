<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->double('irt_b')->nullable()->after('image_url');
        });

        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->double('irt_theta')->nullable()->after('total_score');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->timestamp('irt_scored_at')->nullable()->after('end_at');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('irt_b');
        });

        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropColumn('irt_theta');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('irt_scored_at');
        });
    }
};
