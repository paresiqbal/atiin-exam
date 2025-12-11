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
            'minimum_passing_grade'  => 'required|numeric|min:0',
        ]);

        $major = Major::create($validated);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Major created successfully.',
                'major'   => $major->load('university:id,name'),
            ], 201);
        }

        return redirect()
            ->route('admin.universities.show', $major->university_id)
            ->with('success', 'Program studi berhasil ditambahkan');
    }

    public function update(Request $request, Major $major)
    {
        $validated = $request->validate([
            'university_id'          => 'required|exists:universities,id',
            'name'                   => 'required|string|max:255',
            'description'            => 'nullable|string',
            'minimum_passing_grade'  => 'required|numeric|min:0',
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
