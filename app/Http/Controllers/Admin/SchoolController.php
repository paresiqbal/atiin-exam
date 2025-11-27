<?php

namespace App\Http\Controllers\Admin;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::withCount('users', 'exams')->paginate(15);
        return Inertia::render('admin/schools/SchoolIndex', ['schools' => $schools]);
    }

    public function create()
    {
        return Inertia::render('admin/schools/SchoolCreate');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:schools',
            'description' => 'nullable|string',
        ]);

        School::create($validated);

        return redirect()->route('admin.schools.index')
            ->with('success', 'School created successfully');
    }

    public function edit(School $school)
    {
        return Inertia::render('admin/schools/SchoolEdit', ['school' => $school]);
    }

    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:schools,name,' . $school->id,
            'description' => 'nullable|string',
        ]);

        $school->update($validated);

        return redirect()->route('admin.schools.index')
            ->with('success', 'School updated successfully');
    }

    public function destroy(School $school)
    {
        $school->delete();

        return redirect()->route('admin.schools.index')
            ->with('success', 'School deleted successfully');
    }
}
