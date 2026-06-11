<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Request;
use App\Core\Response;

final class InternalAuthMiddleware implements MiddlewareInterface
{
    public function __construct(private string $sharedSecret) {}

    public function handle(Request $request, callable $next): Response
    {
        $userId = $request->header('x-internal-user-id');
        $signature = $request->header('x-internal-signature');

        if ($userId !== null || $signature !== null) {
            $timestampStr = $request->header('x-internal-timestamp');
            $internalAdmin = $request->header('x-internal-admin');

            if (!$userId || !$timestampStr || !$signature || $internalAdmin === null || !$this->sharedSecret) {
                return (new Response())->json([
                    'error'             => 'forbidden',
                    'error_description' => 'Missing security headers',
                ], 403);
            }

            $timestamp = (int) $timestampStr;
            $now = time();
            
            // Prevent replay attacks (allow 5-minute skew)
            if (abs($now - $timestamp) > 300) {
                return (new Response())->json([
                    'error'             => 'forbidden',
                    'error_description' => 'Request expired',
                ], 403);
            }

            // Calculate expected signature using timestamp, method, path, user ID, and admin status
            $message = $timestamp . ':' . strtoupper($request->method()) . ':' . $request->path() . ':' . $userId . ':' . $internalAdmin;
            $expectedSignature = hash_hmac('sha256', $message, $this->sharedSecret);
            if (!hash_equals($expectedSignature, $signature)) {
                return (new Response())->json([
                    'error'             => 'forbidden',
                    'error_description' => 'Invalid internal signature',
                ], 403);
            }

            // Authenticate user statelessly for this request
            $_SESSION['user_id'] = $userId;
            $_SESSION['user_role'] = ($internalAdmin === '1') ? 'admin' : 'user';
        }

        return $next($request);
    }
}
