<?php

namespace App\Http\Controllers\Admin;

use App\Models\Major;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class MajorController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'university_id' => 'required|exists:universities,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'minimum_passing_grade' => 'required|integer',
        ]);

        Major::create($validated);

        return back()->with('success', 'Major created successfully');
    }

    public function edit(Major $major)
    {
        return Inertia::render('admin/majors/Edit', [
            'major' => $major,
            'university' => $major->university,
        ]);
    }

    public function update(Request $request, Major $major)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'minimum_passing_grade' => 'required|integer|min:0|max:100',
        ]);

        $major->update($validated);

        return redirect()->route('admin.universities.show', $major->university_id)
            ->with('success', 'Major updated successfully');
    }

    public function destroy(Major $major)
    {
        $university_id = $major->university_id;
        $major->delete();

        return redirect()->route('admin.universities.show', $university_id)
            ->with('success', 'Major deleted successfully');
    }
}
