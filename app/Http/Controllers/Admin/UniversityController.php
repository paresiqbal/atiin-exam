<?php

namespace App\Http\Controllers\Admin;

use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class UniversityController extends Controller
{
    public function index()
    {
        $universities = University::withCount('majors')->paginate(15);

        return Inertia::render('admin/universities/UnivIndex', [
            'universities' => $universities,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/universities/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:universities',
            'description' => 'nullable|string',
            'website' => 'nullable|url',
        ]);

        University::create($validated);

        return redirect()->route('admin.universities.index')
            ->with('success', 'University created successfully');
    }

    public function show(University $university)
    {
        $majors = $university->majors()->paginate(15);

        return Inertia::render('admin/universities/Show', [
            'university' => $university,
            'majors' => $majors,
        ]);
    }

    public function edit(University $university)
    {
        return Inertia::render('admin/universities/Edit', [
            'university' => $university,
        ]);
    }

    public function update(Request $request, University $university)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:universities,name,' . $university->id,
            'description' => 'nullable|string',
            'website' => 'nullable|url',
        ]);

        $university->update($validated);

        return redirect()->route('admin.universities.index')
            ->with('success', 'University updated successfully');
    }

    public function destroy(University $university)
    {
        $university->delete();

        return redirect()->route('admin.universities.index')
            ->with('success', 'University deleted successfully');
    }
}
