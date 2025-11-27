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
        $universities = University::with('majors')
            ->withCount('majors')
            ->paginate(15);

        return Inertia::render('admin/universities/UnivIndex', [
            'universities' => $universities,
        ]);
    }

    public function options()
    {
        // Return JSON with all universities (id + name only)
        return University::orderBy('name')->get(['id', 'name']);
    }

    public function create()
    {
        return Inertia::render('admin/universities/UnivCreate');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:universities',
            'code' => 'nullable|string|max:50|unique:universities,code',
            'city' => 'nullable|string|max:255',
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

        return Inertia::render('admin/universities/UnivShow', [
            'university' => $university,
            'majors' => $majors,
        ]);
    }


    public function edit(University $university)
    {
        return Inertia::render('admin/universities/UnivEdit', [
            'university' => $university->only('id', 'name', 'code', 'city', 'description', 'website'),
        ]);
    }

    public function update(Request $request, University $university)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:universities,name,' . $university->id,
            'code' => 'nullable|string|max:50|unique:universities,code,' . $university->id,
            'city' => 'nullable|string|max:255',
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
