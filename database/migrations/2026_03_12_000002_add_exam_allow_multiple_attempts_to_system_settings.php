<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('system_settings', 'exam_allow_multiple_attempts')) {
                $table->boolean('exam_allow_multiple_attempts')->default(false);
            }
        });
    }

    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            if (Schema::hasColumn('system_settings', 'exam_allow_multiple_attempts')) {
                $table->dropColumn('exam_allow_multiple_attempts');
            }
        });
    }
};
