<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ExamSettingController extends Controller
{
    public function edit()
    {
        if (! Schema::hasTable('system_settings')) {
            return Inertia::render('settings/exam-settings', [
                'exam_auto_freeze' => true,
            ]);
        }

        $settings = SystemSetting::first();

        return Inertia::render('settings/exam-settings', [
            'exam_auto_freeze' => $settings?->exam_auto_freeze ?? true,
        ]);
    }

    public function update(Request $request)
    {
        if (! Schema::hasTable('system_settings')) {
            return back()->with('error', 'Tabel system_settings belum ada. Jalankan migrasi.');
        }

        $validated = $request->validate([
            'exam_auto_freeze' => 'required|boolean',
        ]);

        SystemSetting::updateOrCreate(
            ['id' => 1],
            ['exam_auto_freeze' => $validated['exam_auto_freeze']],
        );

        return back()->with('success', 'Exam settings updated.');
    }
}
