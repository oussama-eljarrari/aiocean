<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Base controller with response helper methods.
 *
 * Extend this in feature controllers to get convenient json(), created(), etc.
 */
abstract class BaseController
{
    protected function data(mixed $data, int $status = 200, ?array $meta = null): Response
    {
        $body = ['data' => $data];
        if ($meta !== null) {
            $body['meta'] = $meta;
        }

        return (new Response())->json($body, $status);
    }

    protected function json(mixed $data, int $status = 200): Response
    {
        return (new Response())->json($data, $status);
    }

    protected function html(string $body, int $status = 200): Response
    {
        return (new Response())
            ->status($status)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->body($body);
    }

    protected function created(mixed $data): Response
    {
        return (new Response())->json($data, 201);
    }

    protected function noContent(): Response
    {
        return (new Response())->status(204)->body('');
    }

    protected function notFound(string $message = 'Not found'): Response
    {
        return (new Response())->json(['error' => $message], 404);
    }

    protected function badRequest(string $message = 'Bad request', array $errors = []): Response
    {
        $body = ['error' => $message];
        if ($errors) {
            $body['details'] = $errors;
        }
        return (new Response())->json($body, 400);
    }

    protected function unauthorized(string $message = 'Not authenticated'): Response
    {
        return (new Response())->json(['error' => $message], 401);
    }

    protected function forbidden(string $message = 'Forbidden'): Response
    {
        return (new Response())->json(['error' => $message], 403);
    }

    protected function serverError(string $message = 'Internal server error'): Response
    {
        return (new Response())->json(['error' => $message], 500);
    }
}
