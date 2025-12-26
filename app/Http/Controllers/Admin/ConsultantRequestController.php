<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConsultantRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConsultantRequestController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = $request->query('search');
        $perPage = (int) $request->input('per_page', 15);

        $requests = ConsultantRequest::query()
            ->with([
                'student:id,name,email',
                'consultant:id,name,email',
            ])
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('topic', 'like', "%{$search}%")
                        ->orWhereHas('student', function ($s) use ($search) {
                            $s->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('consultant', function ($c) use ($search) {
                            $c->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/consultants/ConsultIndex', [
            'requests' => $requests,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function show(ConsultantRequest $consultantRequest)
    {
        $consultantRequest->load([
            'student:id,name,email',
            'consultant:id,name,email',
        ]);

        return Inertia::render('admin/consultants/ConsultShow', [
            'request' => $consultantRequest,
        ]);
    }

    public function print(ConsultantRequest $consultantRequest)
    {
        $consultantRequest->load([
            'student:id,name,email',
            'consultant:id,name,email',
        ]);

        $consultantRequest->update(['printed_at' => now()]);

        return view('admin.consultant-requests.print', [
            'request' => $consultantRequest,
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.consultant-requests.index')
                ->with('info', 'Tidak ada data yang dipilih untuk dihapus.');
        }

        ConsultantRequest::whereIn('id', $ids)->delete();

        return redirect()
            ->route('admin.consultant-requests.index')
            ->with('success', 'Data terpilih berhasil dihapus.');
    }
}
