<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->decimal('irt_theta', 8, 4)->nullable()->after('total_score');
            $table->decimal('irt_score', 8, 2)->nullable()->after('irt_theta');
            $table->timestamp('irt_processed_at')->nullable()->after('irt_score');
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropColumn([
                'irt_theta',
                'irt_score',
                'irt_processed_at'
            ]);
        });
    }
};
