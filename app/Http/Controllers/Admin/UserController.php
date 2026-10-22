<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = trim((string) $request->input('search', ''));
        $role = $request->input('role');

        $users = User::with('school')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when(in_array($role, ['admin', 'teacher', 'student'], true), function ($query) use ($role) {
                $query->where('role', $role);
            })
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/users/UserIndex', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => in_array($role, ['admin', 'teacher', 'student'], true) ? $role : 'all',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/UserCreate', [
            'schools' => School::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => [
                'required',
                'string',
                $request->input('role') === 'student' ? Password::min(6) : Password::defaults(),
            ],
            'role' => 'required|in:admin,teacher,student',
            'school_id' => 'nullable|exists:schools,id',
            'class' => 'nullable|string|max:255',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully');
    }

    public function edit(User $user)
    {
        return Inertia::render('admin/users/UserEdit', [
            'user' => $user,
            'schools' => School::all(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'role' => 'required|in:admin,teacher,student',
            'school_id' => 'nullable|exists:schools,id',
            'class' => 'nullable|string|max:255',
            'password' => [
                'nullable',
                'string',
                $request->input('role') === 'student' ? Password::min(6) : Password::defaults(),
            ],
        ]);

        if ($request->filled('password')) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        $ids = array_diff($ids, [auth()->id()]);

        if (empty($ids)) {
            return redirect()
                ->route('admin.users.index')
                ->with('info', 'Tidak ada pengguna yang dipilih untuk dihapus.');
        }

        User::whereIn('id', $ids)->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'Pengguna terpilih berhasil dihapus.');
    }
}
