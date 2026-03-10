<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StudentCardController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        $user->checkProExpiration();

        return Inertia::render('student/card/StudentCardPage', [
            'student' => [
                'name'       => $user->name,
                'student_id' => (string) $user->id,
                'school'     => optional($user->school)->name,
                'class'      => $user->class,
                'photo_url'  => $user->photo_path
                    ? route('student.photo', ['filename' => basename($user->photo_path)])
                    : null,
            ],
            'auth' => [
                'user' => [
                    'is_pro' => $user->isPro(),
                ],
            ],
        ]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = Auth::user();

        if ($user->photo_path) {
            Storage::disk('public')->delete($user->photo_path);
        }

        $path = $request->file('photo')->store('student-photos', 'public');

        $user->update(['photo_path' => $path]);

        return back()->with('success', 'Foto berhasil diupdate.');
    }

    public function servePhoto(string $filename)
    {
        // Sanitize — prevent path traversal
        $filename = basename($filename);
        $path     = 'student-photos/' . $filename;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        $fullPath = Storage::disk('public')->path($path);
        $mimeType = mime_content_type($fullPath) ?: 'image/jpeg';

        return response()->file($fullPath, [
            'Content-Type'  => $mimeType,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
