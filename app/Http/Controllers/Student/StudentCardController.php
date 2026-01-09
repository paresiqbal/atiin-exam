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
                'name' => $user->name,
                'student_id' => (string) $user->id,
                'school' => optional($user->school)->name,
                'class' => $user->class,
                'photo_url' => $user->photo_path
                    ? Storage::url($user->photo_path)
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
        $validated = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = Auth::user();

        if ($user->photo_path) {
            Storage::disk('public')->delete($user->photo_path);
        }

        $path = $validated['photo']->store('student-photos', 'public');

        $user->update([
            'photo_path' => $path,
        ]);

        return back()->with('success', 'Foto berhasil diupdate.');
    }
}
