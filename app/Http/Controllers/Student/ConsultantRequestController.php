<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ConsultantRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConsultantRequestController extends Controller
{
    public function index(Request $request)
    {
        $studentId = $request->user()->id;

        $requests = ConsultantRequest::with(['consultant:id,name,email'])
            ->where('student_id', $studentId)
            ->latest()
            ->paginate(10);

        return Inertia::render('student/consultants/ConsultIndex', [
            'requests' => $requests,
        ]);
    }

    public function create()
    {
        $consultants = User::query()
            ->where('role', 'teacher')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('student/consultants/ConsultCreate', [
            'consultants' => $consultants,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'consultant_id' => ['required', 'integer', 'exists:users,id'],
            'topic' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string'],
            'preferred_date' => ['nullable', 'date'],
        ]);

        // optional: ensure chosen consultant really is teacher
        $isTeacher = User::where('id', $validated['consultant_id'])->where('role', 'teacher')->exists();
        if (!$isTeacher) {
            return back()->withErrors(['consultant_id' => 'Selected consultant is not valid.']);
        }

        ConsultantRequest::create([
            ...$validated,
            'student_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return redirect()
            ->to('/student/consultant-requests')
            ->with('success', 'Request submitted.');
    }
}
