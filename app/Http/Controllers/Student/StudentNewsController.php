<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StudentNewsController extends Controller
{
    public function index(Request $request)
    {
        $news = News::query()
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->paginate(10)
            ->through(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'body' => $item->body,
                    'published_at' => optional($item->published_at)->toDateTimeString(),
                    'image_url' => $item->image_path ? Storage::url($item->image_path) : null,
                ];
            });

        return Inertia::render('student/news/NewsIndex', [
            'news' => $news,
        ]);
    }

    public function show(News $news)
    {
        abort_unless($news->status === 'published', 404);

        return Inertia::render('student/news/NewsShow', [
            'newsItem' => [
                'id' => $news->id,
                'title' => $news->title,
                'body' => $news->body,
                'published_at' => optional($news->published_at)->toDateTimeString(),
                'image_url' => $news->image_path ? Storage::url($news->image_path) : null,
            ],
        ]);
    }
}
