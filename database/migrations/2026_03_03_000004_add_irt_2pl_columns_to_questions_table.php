<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'irt_a')) {
                $table->decimal('irt_a', 8, 4)->nullable()->after('points');
            }

            if (!Schema::hasColumn('questions', 'irt_b')) {
                $afterColumn = Schema::hasColumn('questions', 'irt_a') ? 'irt_a' : 'points';
                $table->decimal('irt_b', 8, 4)->nullable()->after($afterColumn);
            }
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('questions', 'irt_a')) {
                $columns[] = 'irt_a';
            }

            if (Schema::hasColumn('questions', 'irt_b')) {
                $columns[] = 'irt_b';
            }

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
