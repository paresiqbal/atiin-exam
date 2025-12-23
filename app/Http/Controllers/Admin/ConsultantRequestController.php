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

        $requests = ConsultantRequest::with([
            'student:id,name,email',
            'consultant:id,name,email',
        ])
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/consultants/ConsultIndex', [
            'requests' => $requests,
            'filters' => ['status' => $status],
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
}
