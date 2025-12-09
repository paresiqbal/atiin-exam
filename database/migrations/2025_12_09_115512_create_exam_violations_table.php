<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->string('violation_type');
            $table->integer('count')->default(1);
            $table->timestamp('last_occurred_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::drop('exam_violations');
    }
};
