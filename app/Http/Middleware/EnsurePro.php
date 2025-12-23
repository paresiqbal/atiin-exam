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
            abort(403, 'Pro account required.');
        }

        return $next($request);
    }
}
