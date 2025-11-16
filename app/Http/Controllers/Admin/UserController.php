<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\University;
use App\Models\User;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('university', 'major')->paginate(15);

        return Inertia::render('admin/users/UserIndex', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/UserCreate', [
            'universities' => University::with('majors')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,instructor,student',
            'university_id' => 'nullable|exists:universities,id',
            'major_id' => 'nullable|exists:majors,id',
        ]);

        User::create($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully');
    }

    public function edit(User $user)
    {
        return Inertia::render('admin/users/UserEdit', [
            'user' => $user,
            'universities' => University::with('majors')->get(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,instructor,student',
            'university_id' => 'nullable|exists:universities,id',
            'major_id' => 'nullable|exists:majors,id',
        ]);

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
}
