<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAccountController extends Controller
{
    public function accounts(Request $request)
    {
        $perPage = (int) $request->input('per_page', 20);

        $baseQuery = User::query()
            ->where('role', 'student')
            ->with(['school:id,name', 'university:id,name', 'major:id,name'])
            ->select('id', 'name', 'email', 'school_id', 'university_id', 'major_id', 'account_type', 'pro_expires_at', 'created_at');

        if ($request->filled('account_type')) {
            $baseQuery->where('account_type', $request->account_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $baseQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        $statsQuery = clone $baseQuery;
        $total = (clone $statsQuery)->count();
        $totalPro = (clone $statsQuery)->where('account_type', 'pro')->count();
        $totalRegular = $total - $totalPro;

        $students = $baseQuery
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/payments/PaymentIndex', [
            'students' => $students,
            'filters' => [
                'search' => $request->search,
                'account_type' => $request->account_type,
                'per_page' => $perPage,
            ],
            'stats' => [
                'total' => $total,
                'pro' => $totalPro,
                'regular' => $totalRegular,
            ],
        ]);
    }

    public function updateAccountType(Request $request, User $user)
    {
        $request->validate([
            'account_type' => 'required|in:regular,pro',
            'pro_expires_at' => 'nullable|date|after:today',
        ]);

        $data = ['account_type' => $request->account_type];

        if ($request->account_type === 'pro') {
            $data['pro_expires_at'] = $request->pro_expires_at ? $request->pro_expires_at : null;
        } else {
            $data['pro_expires_at'] = null;
        }

        $user->update($data);

        return back()->with('success', 'Account type updated successfully!');
    }

    public function togglePro(User $user)
    {
        $newType = $user->account_type === 'pro' ? 'regular' : 'pro';

        $user->update([
            'account_type' => $newType,
            'pro_expires_at' => $newType === 'pro' ? null : null,
        ]);

        return back()->with('success', "Account changed to {$newType}!");
    }

    public function extendPro(Request $request, User $user)
    {
        $request->validate([
            'months' => 'required|integer|min:1|max:36',
        ]);

        $currentExpiry = $user->pro_expires_at ?? now();
        $newExpiry = $currentExpiry->addMonths($request->months);

        $user->update([
            'account_type' => 'pro',
            'pro_expires_at' => $newExpiry,
        ]);

        return back()->with('success', "Pro extended by {$request->months} month(s)!");
    }
}
