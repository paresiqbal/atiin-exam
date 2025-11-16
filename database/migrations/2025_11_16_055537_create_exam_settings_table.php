<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_settings', function (Blueprint $table) {
            $table->foreignId('exam_id')->primary()->constrained()->onDelete('cascade');
            $table->integer('time_limit_minutes')->default(90);
            $table->boolean('shuffle_questions')->default(true);
            $table->boolean('allow_review')->default(true);
            $table->integer('max_attempts')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_settings');
    }
};
