<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePro
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        $user->checkProExpiration();

        if (!$user->isPro()) {
            return redirect()
                ->route('student.dashboard')
                ->with('error', 'Fitur ini khusus akun Pro.');
        }

        return $next($request);
    }
}
