<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $perPage = (int) $request->input('per_page', 10);

        $news = News::query()
            ->when($search, fn($q) => $q->where('title', 'like', "%{$search}%"))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/news/NewsIndex', [
            'news' => $news,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/news/NewsCreate');
    }

    // Draft removed: always publish on create
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('news', 'public');
        }

        News::create([
            'title' => $validated['title'],
            'body' => $validated['body'] ?? null,
            'status' => 'published',
            'published_at' => now(),
            'image_path' => $imagePath,
        ]);

        return redirect()
            ->route('admin.news.index')
            ->with('success', 'Berita berhasil dibuat & dipublikasikan.');
    }

    public function edit(News $news)
    {
        return Inertia::render('admin/news/NewsEdit', [
            'newsItem' => $news,
            'imageUrl' => $news->image_path ? Storage::url($news->image_path) : null,
        ]);
    }

    // Draft removed: always keep published on update
    public function update(Request $request, News $news)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        // remove image
        if (!empty($validated['remove_image']) && $news->image_path) {
            Storage::disk('public')->delete($news->image_path);
            $news->image_path = null;
        }

        // replace image
        if ($request->hasFile('image')) {
            if ($news->image_path) {
                Storage::disk('public')->delete($news->image_path);
            }
            $news->image_path = $request->file('image')->store('news', 'public');
        }

        $news->title = $validated['title'];
        $news->body = $validated['body'] ?? null;

        // always published
        $news->status = 'published';
        $news->published_at = $news->published_at ?? now();

        $news->save();

        return redirect()
            ->route('admin.news.index')
            ->with('success', 'Berita berhasil diperbarui.');
    }

    public function destroy(News $news)
    {
        if ($news->image_path) {
            Storage::disk('public')->delete($news->image_path);
        }

        $news->delete();

        return back()->with('success', 'Berita berhasil dihapus.');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.news.index')
                ->with('info', 'Tidak ada berita yang dipilih untuk dihapus.');
        }

        $items = News::whereIn('id', $ids)->get(['id', 'image_path']);
        foreach ($items as $item) {
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }
        }

        News::whereIn('id', $ids)->delete();

        return redirect()
            ->route('admin.news.index')
            ->with('success', 'Berita terpilih berhasil dihapus.');
    }
}
