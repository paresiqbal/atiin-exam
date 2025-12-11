<?php

namespace App\Http\Controllers\Admin;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class SchoolController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $schools = School::withCount(['users', 'exams'])
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/schools/SchoolIndex', [
            'schools' => $schools,
        ]);
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

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.schools.index')
                ->with('info', 'Tidak ada sekolah yang dipilih untuk dihapus.');
        }

        School::whereIn('id', $ids)->delete();

        return redirect()
            ->route('admin.schools.index')
            ->with('success', 'Sekolah terpilih berhasil dihapus.');
    }
}
