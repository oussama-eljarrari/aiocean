<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Request;
use App\Core\Response;

/**
 * Parses request bodies into the Request object. Supports:
 *  - application/json
 *  - application/x-www-form-urlencoded
 */
final class JsonBodyParser implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        $contentType = $request->header('content-type', '');

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            if ($raw !== false && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $request->setBody($decoded);
                }
            }
        } elseif (str_contains($contentType, 'application/x-www-form-urlencoded')) {
            $raw = file_get_contents('php://input');
            if ($raw !== false && $raw !== '') {
                $parsed = [];
                parse_str($raw, $parsed);
                $request->setBody($parsed);
            }
        }

        return $next($request);
    }
}
