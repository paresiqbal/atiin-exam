<?php

namespace App\Http\Controllers\Admin;

use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class UniversityController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = trim((string) $request->input('search', ''));

        $universities = University::with('majors')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhereHas('majors', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/universities/UnivIndex', [
            'universities' => $universities,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function options()
    {
        return University::orderBy('name')->get(['id', 'name']);
    }

    public function create()
    {
        $universities = University::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/universities/UnivCreate', [
            'universities' => $universities,
        ]);
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
        $university->loadCount('majors');
        $majors = $university->majors()->orderBy('name')->get();

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
            'name' => 'required|string|max:255|unique:universities,name,'.$university->id,
            'code' => 'nullable|string|max:50|unique:universities,code,'.$university->id,
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

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.universities.index')
                ->with('info', 'Tidak ada universitas yang dipilih untuk dihapus.');
        }

        University::whereIn('id', $ids)->delete();

        return redirect()
            ->route('admin.universities.index')
            ->with('success', 'Universitas terpilih berhasil dihapus.');
    }
}
