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
            'university_id'          => 'required|exists:universities,id',
            'name'                   => 'required|string|max:255',
            'description'            => 'nullable|string',
            'minimum_passing_grade'  => 'required|numeric|min:0|max:100',
        ]);

        $major = Major::create($validated);

        // If called via fetch (AJAX / JSON)
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Major created successfully.',
                'major'   => $major->load('university:id,name'),
            ], 201);
        }

        // If called via Inertia form / normal POST
        return redirect()
            ->route('admin.universities.show', $major->university_id)
            ->with('success', 'Program studi berhasil ditambahkan');
    }

    public function edit(Major $major)
    {
        return Inertia::render('admin/majors/MajorEdit', [
            'major' => $major,
            'universities' => University::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Major $major)
    {
        $validated = $request->validate([
            'university_id'          => 'required|exists:universities,id',
            'name'                   => 'required|string|max:255',
            'description'            => 'nullable|string',
            'minimum_passing_grade'  => 'required|numeric|min:0|max:100',
        ]);

        $major->update($validated);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Major updated successfully.',
                'major'   => $major->load('university:id,name'),
            ]);
        }

        return redirect()
            ->route('admin.universities.show', $major->university_id)
            ->with('success', 'Program studi berhasil diperbarui');
    }

    public function destroy(Request $request, Major $major)
    {
        $universityId = $major->university_id;

        $major->delete();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Major deleted successfully.',
            ]);
        }

        return redirect()
            ->route('admin.universities.show', $universityId)
            ->with('success', 'Program studi berhasil dihapus');
    }
}
