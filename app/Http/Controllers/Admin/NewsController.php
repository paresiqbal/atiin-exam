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

        $news = News::query()
            ->when($search, fn($q) => $q->where('title', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,published'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('news', 'public');
        }

        $publishedAt = $validated['status'] === 'published' ? now() : null;

        News::create([
            'title' => $validated['title'],
            'body' => $validated['body'] ?? null,
            'status' => $validated['status'],
            'published_at' => $publishedAt,
            'image_path' => $imagePath,
        ]);

        return redirect()->route('admin.news.index')->with('success', 'Berita berhasil dibuat.');
    }

    public function edit(News $news)
    {
        return Inertia::render('admin/news/NewsEdit', [
            'newsItem' => $news,
            'imageUrl' => $news->image_path ? Storage::url($news->image_path) : null,
        ]);
    }

    public function update(Request $request, News $news)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,published'],
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

        // publish date handling
        $newStatus = $validated['status'];
        if ($newStatus === 'published' && !$news->published_at) {
            $news->published_at = now();
        }
        if ($newStatus === 'draft') {
            $news->published_at = null;
        }

        $news->title = $validated['title'];
        $news->body = $validated['body'] ?? null;
        $news->status = $newStatus;

        $news->save();

        return redirect()->route('admin.news.index')->with('success', 'Berita berhasil diperbarui.');
    }

    public function destroy(News $news)
    {
        if ($news->image_path) {
            Storage::disk('public')->delete($news->image_path);
        }

        $news->delete();

        return back()->with('success', 'Berita berhasil dihapus.');
    }
}
