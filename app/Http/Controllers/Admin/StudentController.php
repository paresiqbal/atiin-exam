<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index()
    {
        $students = User::where('role', 'student')
            ->with('university', 'major', 'school')
            ->paginate(15);

        return Inertia::render('admin/students/StudentIndex', [
            'students' => $students,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/students/Create', [
            'schools' => School::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'school_id' => 'nullable|exists:schools,id',
            'class' => 'nullable|string|max:255',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['role'] = 'student';

        User::create($validated);

        return redirect()->route('admin.students.index')
            ->with('success', 'Student created successfully');
    }

    public function show(User $student)
    {
        if ($student->role !== 'student') {
            abort(404);
        }

        $attempts = $student->attempts()->with('exam')->orderByDesc('completed_at')->get();

        return Inertia::render('admin/students/Show', [
            'student' => $student->load('university', 'major', 'school'),
            'exam_attempts' => $attempts,
        ]);
    }

    public function edit(User $student)
    {
        if ($student->role !== 'student') {
            abort(404);
        }

        return Inertia::render('admin/students/Edit', [
            'student' => $student,
            'schools' => School::all(),
        ]);
    }

    public function update(Request $request, User $student)
    {
        if ($student->role !== 'student') {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $student->id,
            'school_id' => 'nullable|exists:schools,id',
            'class' => 'nullable|string|max:255',
        ]);

        if ($request->filled('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $student->update($validated);

        return redirect()->route('admin.students.index')
            ->with('success', 'Student updated successfully');
    }

    public function destroy(User $student)
    {
        if ($student->role !== 'student') {
            abort(404);
        }

        $student->delete();

        return redirect()->route('admin.students.index')
            ->with('success', 'Student deleted successfully');
    }
}
