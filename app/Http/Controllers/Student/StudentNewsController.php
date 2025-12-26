<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StudentNewsController extends Controller
{
    public function index()
    {
        $news = News::query()
            ->select(['id', 'title', 'body', 'published_at', 'status', 'image_path'])
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (News $item) {
                $plain = trim(\Illuminate\Support\Str::of($item->body ?? '')->stripTags()->toString());

                return [
                    'id'           => $item->id,
                    'title'        => $item->title,
                    'excerpt'      => \Illuminate\Support\Str::limit($plain, 160),
                    'published_at' => optional($item->published_at)->toIso8601String(),
                    'image_url' => $item->image_path ? \Illuminate\Support\Facades\Storage::url($item->image_path) : null,
                ];
            });

        return \Inertia\Inertia::render('student/news/NewsIndex', [
            'news' => $news,
        ]);
    }

    public function show(News $news)
    {
        abort_unless($news->status === 'published', 404);

        return Inertia::render('student/news/NewsShow', [
            'newsItem' => [
                'id'           => $news->id,
                'title'        => $news->title,
                // ✅ send rich HTML for rendering
                'body_html'    => $news->body,
                'published_at' => optional($news->published_at)->toIso8601String(),
                'image_url'    => $news->image_path ? Storage::url($news->image_path) : null,
            ],
        ]);
    }
}
