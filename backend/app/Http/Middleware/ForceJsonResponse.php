<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * This is a JSON-only API. Treat every API request as if it asked for JSON so that
 * validation failures answer with 422 + JSON instead of a redirect when a client
 * forgets the `Accept: application/json` header.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
