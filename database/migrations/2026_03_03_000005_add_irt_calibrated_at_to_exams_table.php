<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (!Schema::hasColumn('exams', 'irt_calibrated_at')) {
                $afterColumn = Schema::hasColumn('exams', 'scoring_method') ? 'scoring_method' : 'name';
                $table->timestamp('irt_calibrated_at')->nullable()->after($afterColumn);
            }
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'irt_calibrated_at')) {
                $table->dropColumn('irt_calibrated_at');
            }
        });
    }
};
